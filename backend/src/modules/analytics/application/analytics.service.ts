import { Injectable } from '@nestjs/common';
import { ReportPeriod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../../../core/audit/audit.service';
import { formatMoney } from '../../../core/utils/money.util';
import { AnalyticsCacheService } from './analytics-cache.service';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  defaultChartPoints,
  formatMonthShort,
  pctChange,
  resolveAnalyticsPeriod,
} from './analytics-period.util';
import { AnalyticsQueriesService, AnalyticsQueryScope } from './analytics-queries.service';

export interface AnalyticsMetricDto {
  id: string;
  label: string;
  value: string;
  change: number;
  period: string;
}

export interface AnalyticsChartPointDto {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
}

function formatCompactUzs(value: Decimal | number): string {
  const n = Number(value);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd so'm`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} mln so'm`;
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}

function toNum(d: Decimal | bigint | number): number {
  if (typeof d === 'bigint') return Number(d);
  return Number(d);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly queries: AnalyticsQueriesService,
    private readonly cache: AnalyticsCacheService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private scope(
    companyId: string,
    dateFrom: Date,
    dateTo: Date,
    branchId?: string,
    cashierId?: string,
  ): AnalyticsQueryScope {
    return { companyId, dateFrom, dateTo, branchId, cashierId };
  }

  async getOverview(
    companyId: string,
    userId: string,
    params: {
      period?: ReportPeriod;
      date_from?: string;
      date_to?: string;
      branch_id?: string;
      months?: number;
    },
    canViewAllSales: boolean,
    ip?: string,
    requestId?: string,
  ) {
    const resolved = resolveAnalyticsPeriod(params.period, params.date_from, params.date_to);
    const cacheParams = { ...params, canViewAllSales, endpoint: 'overview' };

    const result = await this.cache.getOrSet(
      companyId,
      'overview',
      cacheParams,
      resolved.period,
      async () => {
        const metrics = await this.buildMetrics(companyId, resolved, params.branch_id, canViewAllSales ? undefined : userId);
        const chart = await this.buildChart(companyId, resolved, params.branch_id, canViewAllSales ? undefined : userId, params.months);
        const highlights = this.buildHighlights(chart, metrics);
        return { metrics, chart, highlights };
      },
    );

    await this.audit.log({
      companyId,
      userId,
      action: 'VIEW',
      entityType: 'analytics_overview',
      newValue: { period: resolved.period },
      ipAddress: ip,
      requestId,
    });

    return result;
  }

  async getDashboardKpi(
    companyId: string,
    params: {
      period?: ReportPeriod;
      date_from?: string;
      date_to?: string;
      branch_id?: string;
    },
    userId: string,
    canViewAllSales: boolean,
  ) {
    const resolved = resolveAnalyticsPeriod(params.period, params.date_from, params.date_to);
    const cashierId = canViewAllSales ? undefined : userId;

    return this.cache.getOrSet(
      companyId,
      'dashboard-kpi',
      { ...params, canViewAllSales },
      resolved.period,
      async () => {
        const current = this.scope(companyId, resolved.dateFrom, resolved.dateTo, params.branch_id, cashierId);
        const previous = this.scope(companyId, resolved.prevFrom, resolved.prevTo, params.branch_id, cashierId);

        const [cur, prev, invValue, expenses] = await Promise.all([
          this.queries.aggregateSales(current),
          this.queries.aggregateSales(previous),
          this.queries.inventoryValue(companyId),
          this.queries.expenseTotal(current),
        ]);

        const curRev = toNum(cur.revenue_uzs);
        const prevRev = toNum(prev.revenue_uzs);
        const curOrders = toNum(cur.order_count);
        const prevOrders = toNum(prev.order_count);
        const curCogs = toNum(cur.cogs_uzs);
        const curProfit = curRev - curCogs;
        const prevCogs = toNum(prev.cogs_uzs);
        const prevProfit = prevRev - prevCogs;
        const curAvg = curOrders > 0 ? curRev / curOrders : 0;
        const prevAvg = prevOrders > 0 ? prevRev / prevOrders : 0;

        return {
          period: resolved.period,
          label: resolved.label,
          kpis: {
            totalRevenue: {
              uzs: formatMoney(cur.revenue_uzs),
              usd: formatMoney(cur.revenue_usd),
              change: pctChange(curRev, prevRev),
            },
            saleCount: {
              value: curOrders,
              change: pctChange(curOrders, prevOrders),
            },
            avgCheck: {
              uzs: formatMoney(curAvg),
              change: pctChange(curAvg, prevAvg),
            },
            grossProfit: {
              uzs: formatMoney(curProfit),
              change: pctChange(curProfit, prevProfit),
            },
            grossMargin: {
              value: curRev > 0 ? Number(((curProfit / curRev) * 100).toFixed(1)) : 0,
              change: pctChange(
                curRev > 0 ? curProfit / curRev : 0,
                prevRev > 0 ? prevProfit / prevRev : 0,
              ),
            },
            expenses: {
              uzs: formatMoney(expenses),
              change: 0,
            },
            inventoryValue: {
              uzs: formatMoney(invValue),
              change: 0,
            },
          },
        };
      },
    );
  }

  async getSalesAnalytics(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean) {
    return this.domainAnalytics(companyId, 'sales', params, userId, canViewAllSales, async (cur, prev) => {
      const [curAgg, prevAgg, returnData] = await Promise.all([
        this.queries.aggregateSales(cur),
        this.queries.aggregateSales(prev),
        this.queries.returnRate(cur),
      ]);
      const returnPct = toNum(returnData.saleAmount) > 0
        ? (toNum(returnData.returnAmount) / toNum(returnData.saleAmount)) * 100
        : 0;
      return {
        summary: {
          orderCount: toNum(curAgg.order_count),
          revenueUzs: formatMoney(curAgg.revenue_uzs),
          revenueUsd: formatMoney(curAgg.revenue_usd),
          returnRatePercent: Number(returnPct.toFixed(1)),
        },
        comparison: {
          orderCountChange: pctChange(toNum(curAgg.order_count), toNum(prevAgg.order_count)),
          revenueChange: pctChange(toNum(curAgg.revenue_uzs), toNum(prevAgg.revenue_uzs)),
        },
      };
    });
  }

  async getRevenueAnalytics(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean) {
    return this.domainAnalytics(companyId, 'revenue', params, userId, canViewAllSales, async (cur, prev) => {
      const [curAgg, prevAgg] = await Promise.all([
        this.queries.aggregateSales(cur),
        this.queries.aggregateSales(prev),
      ]);
      return {
        summary: {
          revenueUzs: formatMoney(curAgg.revenue_uzs),
          revenueUsd: formatMoney(curAgg.revenue_usd),
        },
        comparison: {
          revenueUzsChange: pctChange(toNum(curAgg.revenue_uzs), toNum(prevAgg.revenue_uzs)),
          revenueUsdChange: pctChange(toNum(curAgg.revenue_usd), toNum(prevAgg.revenue_usd)),
        },
      };
    });
  }

  async getProfitAnalytics(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean) {
    return this.domainAnalytics(companyId, 'profit', params, userId, canViewAllSales, async (cur, prev) => {
      const [curAgg, prevAgg, expenses] = await Promise.all([
        this.queries.aggregateSales(cur),
        this.queries.aggregateSales(prev),
        this.queries.expenseTotal(cur),
      ]);
      const curProfit = toNum(curAgg.revenue_uzs) - toNum(curAgg.cogs_uzs);
      const prevProfit = toNum(prevAgg.revenue_uzs) - toNum(prevAgg.cogs_uzs);
      const netProfit = curProfit - toNum(expenses);
      return {
        summary: {
          grossProfitUzs: formatMoney(curProfit),
          cogsUzs: formatMoney(curAgg.cogs_uzs),
          expensesUzs: formatMoney(expenses),
          netProfitUzs: formatMoney(netProfit),
          marginPercent: toNum(curAgg.revenue_uzs) > 0
            ? Number(((curProfit / toNum(curAgg.revenue_uzs)) * 100).toFixed(1))
            : 0,
        },
        comparison: {
          grossProfitChange: pctChange(curProfit, prevProfit),
        },
      };
    });
  }

  async getSupplierAnalytics(companyId: string, params: Record<string, unknown>) {
    const resolved = resolveAnalyticsPeriod(
      params.period as ReportPeriod,
      params.date_from as string,
      params.date_to as string,
    );
    const scope = this.scope(companyId, resolved.dateFrom, resolved.dateTo, params.branch_id as string);

    return this.cache.getOrSet(companyId, 'suppliers', params, resolved.period, async () => {
      const summary = await this.queries.supplierSummary(scope);
      return {
        period: resolved.period,
        label: resolved.label,
        summary: {
          supplierCount: summary.count,
          totalDebtUzs: formatMoney(summary.totalDebt),
          receiptsUzs: formatMoney(summary.totalReceipts),
          paymentsUzs: formatMoney(summary.paymentTotal),
        },
      };
    });
  }

  async getCustomerAnalytics(companyId: string, params: Record<string, unknown>) {
    const resolved = resolveAnalyticsPeriod(
      params.period as ReportPeriod,
      params.date_from as string,
      params.date_to as string,
    );
    const scope = this.scope(companyId, resolved.dateFrom, resolved.dateTo, params.branch_id as string);

    return this.cache.getOrSet(companyId, 'customers', params, resolved.period, async () => {
      const summary = await this.queries.customerSummary(scope);
      return {
        period: resolved.period,
        label: resolved.label,
        summary: {
          totalCustomers: summary.totalCustomers,
          activeBuyers: summary.activeBuyers,
          totalDebtUzs: formatMoney(summary.totalDebt),
        },
      };
    });
  }

  async getProductAnalytics(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean) {
    return this.domainAnalytics(companyId, 'products', params, userId, canViewAllSales, async (cur) => {
      const top = await this.queries.topProducts(cur, 5);
      return {
        summary: {
          topProductCount: top.length,
          topProducts: top.map((p) => ({
            name: p.name,
            sku: p.sku,
            quantity: formatMoney(p.quantity),
            revenueUzs: formatMoney(p.revenue_uzs),
          })),
        },
      };
    });
  }

  async getTopProducts(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean, limit = 10) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    const scope = this.scope(
      companyId,
      resolved.dateFrom,
      resolved.dateTo,
      params.branch_id as string,
      canViewAllSales ? undefined : userId,
    );

    return this.cache.getOrSet(companyId, 'top-products', { ...params, limit }, resolved.period, async () => {
      const rows = await this.queries.topProducts(scope, limit);
      return {
        data: rows.map((r, i) => ({
          rank: i + 1,
          productId: r.product_id,
          name: r.name,
          sku: r.sku,
          quantity: formatMoney(r.quantity),
          revenueUzs: formatMoney(r.revenue_uzs),
        })),
      };
    });
  }

  async getTopCustomers(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean, limit = 10) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    const scope = this.scope(
      companyId,
      resolved.dateFrom,
      resolved.dateTo,
      params.branch_id as string,
      canViewAllSales ? undefined : userId,
    );

    return this.cache.getOrSet(companyId, 'top-customers', { ...params, limit }, resolved.period, async () => {
      const rows = await this.queries.topCustomers(scope, limit);
      return {
        data: rows.map((r, i) => ({
          rank: i + 1,
          customerId: r.customer_id,
          name: r.name,
          phone: r.phone,
          orderCount: toNum(r.order_count),
          revenueUzs: formatMoney(r.revenue_uzs),
        })),
      };
    });
  }

  async getTopSuppliers(companyId: string, params: Record<string, unknown>, limit = 10) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    const scope = this.scope(companyId, resolved.dateFrom, resolved.dateTo, params.branch_id as string);

    return this.cache.getOrSet(companyId, 'top-suppliers', { ...params, limit }, resolved.period, async () => {
      const rows = await this.queries.topSuppliers(scope, limit);
      return {
        data: rows.map((r, i) => ({
          rank: i + 1,
          supplierId: r.supplier_id,
          name: r.name,
          receiptCount: toNum(r.receipt_count),
          totalCostUzs: formatMoney(r.total_cost_uzs),
          debtUzs: formatMoney(r.debt_uzs),
        })),
      };
    });
  }

  async getRevenueProfitChart(
    companyId: string,
    params: Record<string, unknown>,
    userId: string,
    canViewAllSales: boolean,
  ) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    const points = Number(params.months ?? defaultChartPoints(resolved.period));
    const scope = this.scope(
      companyId,
      resolved.dateFrom,
      resolved.dateTo,
      params.branch_id as string,
      canViewAllSales ? undefined : userId,
    );

    return this.cache.getOrSet(companyId, 'chart-revenue-profit', { ...params, points }, resolved.period, async () => {
      const chart = await this.buildChart(companyId, resolved, params.branch_id as string, canViewAllSales ? undefined : userId, points);
      return { chart, period: resolved.period };
    });
  }

  async getMetrics(companyId: string, params: Record<string, unknown>, userId: string, canViewAllSales: boolean) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    return this.cache.getOrSet(companyId, 'metrics', params, resolved.period, async () => {
      const metrics = await this.buildMetrics(
        companyId,
        resolved,
        params.branch_id as string,
        canViewAllSales ? undefined : userId,
      );
      return { metrics, period: resolved.period, label: resolved.label };
    });
  }

  private async domainAnalytics(
    companyId: string,
    endpoint: string,
    params: Record<string, unknown>,
    userId: string,
    canViewAllSales: boolean,
    builder: (cur: AnalyticsQueryScope, prev: AnalyticsQueryScope) => Promise<Record<string, unknown>>,
  ) {
    const resolved = resolveAnalyticsPeriod(params.period as ReportPeriod, params.date_from as string, params.date_to as string);
    const cashierId = canViewAllSales ? undefined : userId;
    const cur = this.scope(companyId, resolved.dateFrom, resolved.dateTo, params.branch_id as string, cashierId);
    const prev = this.scope(companyId, resolved.prevFrom, resolved.prevTo, params.branch_id as string, cashierId);

    return this.cache.getOrSet(companyId, endpoint, params, resolved.period, async () => ({
      period: resolved.period,
      label: resolved.label,
      ...(await builder(cur, prev)),
    }));
  }

  private async buildMetrics(
    companyId: string,
    resolved: ReturnType<typeof resolveAnalyticsPeriod>,
    branchId?: string,
    cashierId?: string,
  ): Promise<AnalyticsMetricDto[]> {
    const current = this.scope(companyId, resolved.dateFrom, resolved.dateTo, branchId, cashierId);
    const previous = this.scope(companyId, resolved.prevFrom, resolved.prevTo, branchId, cashierId);

    const [cur, prev, newCustomers, prevNewCustomers, returnData, prevReturnData] = await Promise.all([
      this.queries.aggregateSales(current),
      this.queries.aggregateSales(previous),
      this.queries.countNewCustomers(current),
      this.queries.countNewCustomers(previous),
      this.queries.returnRate(current),
      this.queries.returnRate(previous),
    ]);

    const curRev = toNum(cur.revenue_uzs);
    const prevRev = toNum(prev.revenue_uzs);
    const curOrders = toNum(cur.order_count);
    const prevOrders = toNum(prev.order_count);
    const curAvg = curOrders > 0 ? curRev / curOrders : 0;
    const prevAvg = prevOrders > 0 ? prevRev / prevOrders : 0;
    const curReturnPct = toNum(returnData.saleAmount) > 0
      ? (toNum(returnData.returnAmount) / toNum(returnData.saleAmount)) * 100
      : 0;
    const prevReturnPct = toNum(prevReturnData.saleAmount) > 0
      ? (toNum(prevReturnData.returnAmount) / toNum(prevReturnData.saleAmount)) * 100
      : 0;

    return [
      {
        id: 'am_revenue',
        label: 'Oylik daromad',
        value: formatCompactUzs(cur.revenue_uzs),
        change: pctChange(curRev, prevRev),
        period: resolved.label,
      },
      {
        id: 'am_customers',
        label: 'Yangi mijozlar',
        value: String(newCustomers),
        change: pctChange(newCustomers, prevNewCustomers),
        period: resolved.label,
      },
      {
        id: 'am_avg_check',
        label: "O'rtacha chek",
        value: formatCompactUzs(curAvg),
        change: pctChange(curAvg, prevAvg),
        period: resolved.label,
      },
      {
        id: 'am_returns',
        label: 'Qaytarishlar',
        value: `${curReturnPct.toFixed(1)}%`,
        change: Number((curReturnPct - prevReturnPct).toFixed(1)),
        period: resolved.label,
      },
    ];
  }

  private async buildChart(
    companyId: string,
    resolved: ReturnType<typeof resolveAnalyticsPeriod>,
    branchId?: string,
    cashierId?: string,
    months?: number,
  ): Promise<AnalyticsChartPointDto[]> {
    const points = months ?? defaultChartPoints(resolved.period);
    const chartTo = resolved.dateTo;
    const chartFrom = new Date(chartTo);
    chartFrom.setMonth(chartFrom.getMonth() - (points - 1));
    chartFrom.setDate(1);
    chartFrom.setHours(0, 0, 0, 0);

    const scope = this.scope(companyId, chartFrom, chartTo, branchId, cashierId);
    const rows = await this.queries.chartBuckets(scope, ReportPeriod.monthly, points);
    return rows
      .reverse()
      .map((r) => ({
        month: formatMonthShort(new Date(r.bucket)),
        revenue: toNum(r.revenue),
        profit: toNum(r.profit),
        orders: toNum(r.orders),
      }));
  }

  private buildHighlights(chart: AnalyticsChartPointDto[], metrics: AnalyticsMetricDto[]) {
    const peak = chart.reduce(
      (best, p) => (p.revenue > best.revenue ? p : best),
      chart[0] ?? { month: '—', revenue: 0, profit: 0, orders: 0 },
    );
    const avgCheckMetric = metrics.find((m) => m.id === 'am_avg_check');
    return {
      peakMonth: { label: peak.month, revenue: peak.revenue },
      avgCheckChange: {
        percent: avgCheckMetric?.change ?? 0,
        period: avgCheckMetric?.period ?? '',
      },
    };
  }

  async getEnterpriseDashboard(
    companyId: string,
    userId: string,
    canViewAllSales: boolean,
  ) {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { effectiveFrom: 'desc' },
    });
    const rate = exchangeRate?.rate ? Number(exchangeRate.rate) : 12620;

    const now = new Date();

    // Time boundaries
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    const monthStart = new Date(now);
    monthStart.setDate(monthStart.getDate() - 30);
    const prevMonthStart = new Date(now);
    prevMonthStart.setDate(prevMonthStart.getDate() - 60);

    const yearStart = new Date(now);
    yearStart.setDate(yearStart.getDate() - 365);
    const prevYearStart = new Date(now);
    prevYearStart.setDate(prevYearStart.getDate() - 730);

    const cashierId = canViewAllSales ? undefined : userId;

    const [
      inventoryVal,
      custDebt,
      suppDebt,
      todayAgg,
      yesterdayAgg,
      weekAgg,
      prevWeekAgg,
      monthAgg,
      prevMonthAgg,
      yearAgg,
      prevYearAgg,
      cogsAgg,
      prevCogsAgg,
      topProducts,
      topCustomers,
      dailyChartData
    ] = await Promise.all([
      // 1. Inventory Value (at cost)
      this.prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(remaining_qty * unit_cost_uzs), 0)::float AS total
        FROM inventory_batches
        WHERE company_id = ${companyId}::uuid AND remaining_qty > 0
      `,
      // 2. Customer Debt
      this.prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(total_debt_uzs), 0)::float AS total
        FROM customers
        WHERE company_id = ${companyId}::uuid AND deleted_at IS NULL
      `,
      // 3. Supplier Debt
      this.prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(total_debt_uzs - total_paid_uzs), 0)::float AS total
        FROM suppliers
        WHERE company_id = ${companyId}::uuid AND deleted_at IS NULL
      `,
      // Today Sales
      cashierId 
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number, order_count: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd,
              COUNT(id)::int as order_count
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${todayStart} AND created_at <= ${todayEnd}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number, order_count: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd,
              COUNT(id)::int as order_count
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${todayStart} AND created_at <= ${todayEnd}
          `,
      // Yesterday Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${yesterdayStart} AND created_at <= ${yesterdayEnd}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${yesterdayStart} AND created_at <= ${yesterdayEnd}
          `,
      // Weekly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${weekStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${weekStart}
          `,
      // Prev Weekly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${prevWeekStart} AND created_at < ${weekStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${prevWeekStart} AND created_at < ${weekStart}
          `,
      // Monthly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${monthStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${monthStart}
          `,
      // Prev Monthly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${prevMonthStart} AND created_at < ${monthStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${prevMonthStart} AND created_at < ${monthStart}
          `,
      // Yearly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${yearStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number, revenue_usd: number }>>`
            SELECT 
              COALESCE(SUM(total_uzs), 0)::float as revenue_uzs,
              COALESCE(SUM(total_usd), 0)::float as revenue_usd
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${yearStart}
          `,
      // Prev Yearly Sales
      cashierId
        ? this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND cashier_id = ${cashierId}::uuid AND created_at >= ${prevYearStart} AND created_at < ${yearStart}
          `
        : this.prisma.$queryRaw<Array<{ revenue_uzs: number }>>`
            SELECT COALESCE(SUM(total_uzs), 0)::float as revenue_uzs
            FROM sales
            WHERE company_id = ${companyId}::uuid AND status = 'COMPLETED' AND created_at >= ${prevYearStart} AND created_at < ${yearStart}
          `,
      // COGS in last 30 days
      cashierId
        ? this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(SUM(sfa.cost_uzs), 0)::float as total
            FROM sale_fifo_allocations sfa
            JOIN sales s ON s.id = sfa.sale_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.cashier_id = ${cashierId}::uuid AND s.created_at >= ${monthStart}
          `
        : this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(SUM(sfa.cost_uzs), 0)::float as total
            FROM sale_fifo_allocations sfa
            JOIN sales s ON s.id = sfa.sale_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.created_at >= ${monthStart}
          `,
      // Prev COGS in month prior
      cashierId
        ? this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(SUM(sfa.cost_uzs), 0)::float as total
            FROM sale_fifo_allocations sfa
            JOIN sales s ON s.id = sfa.sale_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.cashier_id = ${cashierId}::uuid AND s.created_at >= ${prevMonthStart} AND s.created_at < ${monthStart}
          `
        : this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(SUM(sfa.cost_uzs), 0)::float as total
            FROM sale_fifo_allocations sfa
            JOIN sales s ON s.id = sfa.sale_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.created_at >= ${prevMonthStart} AND s.created_at < ${monthStart}
          `,
      // Top products (revenue-based) in last 30 days
      cashierId
        ? this.prisma.$queryRaw<Array<{ name: string, quantity: number, revenue_uzs: number }>>`
            SELECT 
              p.name,
              SUM(sli.quantity)::float as quantity,
              SUM(sli.total_uzs)::float as revenue_uzs
            FROM sale_items sli
            JOIN sales s ON s.id = sli.sale_id
            JOIN products p ON p.id = sli.product_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.cashier_id = ${cashierId}::uuid AND s.created_at >= ${monthStart}
            GROUP BY p.id, p.name
            ORDER BY revenue_uzs DESC
            LIMIT 10
          `
        : this.prisma.$queryRaw<Array<{ name: string, quantity: number, revenue_uzs: number }>>`
            SELECT 
              p.name,
              SUM(sli.quantity)::float as quantity,
              SUM(sli.total_uzs)::float as revenue_uzs
            FROM sale_items sli
            JOIN sales s ON s.id = sli.sale_id
            JOIN products p ON p.id = sli.product_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.created_at >= ${monthStart}
            GROUP BY p.id, p.name
            ORDER BY revenue_uzs DESC
            LIMIT 10
          `,
      // Top customers in last 30 days
      cashierId
        ? this.prisma.$queryRaw<Array<{ name: string, revenue_uzs: number }>>`
            SELECT 
              c.name,
              SUM(s.total_uzs)::float as revenue_uzs
            FROM sales s
            JOIN customers c ON c.id = s.customer_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.cashier_id = ${cashierId}::uuid AND s.created_at >= ${monthStart}
            GROUP BY c.id, c.name
            ORDER BY revenue_uzs DESC
            LIMIT 10
          `
        : this.prisma.$queryRaw<Array<{ name: string, revenue_uzs: number }>>`
            SELECT 
              c.name,
              SUM(s.total_uzs)::float as revenue_uzs
            FROM sales s
            JOIN customers c ON c.id = s.customer_id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.created_at >= ${monthStart}
            GROUP BY c.id, c.name
            ORDER BY revenue_uzs DESC
            LIMIT 10
          `,
      // Daily chart data for last 30 days
      cashierId
        ? this.prisma.$queryRaw<Array<{ date: Date, revenue_uzs: number, revenue_usd: number, cogs_uzs: number }>>`
            SELECT 
              DATE(s.created_at) as date,
              SUM(s.total_uzs)::float as revenue_uzs,
              SUM(s.total_usd)::float as revenue_usd,
              COALESCE(SUM(sfa.cost_uzs), 0)::float as cogs_uzs
            FROM sales s
            LEFT JOIN (
              SELECT sale_id, SUM(cost_uzs) as cost_uzs
              FROM sale_fifo_allocations
              GROUP BY sale_id
            ) sfa ON sfa.sale_id = s.id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.cashier_id = ${cashierId}::uuid AND s.created_at >= ${monthStart}
            GROUP BY DATE(s.created_at)
            ORDER BY date ASC
          `
        : this.prisma.$queryRaw<Array<{ date: Date, revenue_uzs: number, revenue_usd: number, cogs_uzs: number }>>`
            SELECT 
              DATE(s.created_at) as date,
              SUM(s.total_uzs)::float as revenue_uzs,
              SUM(s.total_usd)::float as revenue_usd,
              COALESCE(SUM(sfa.cost_uzs), 0)::float as cogs_uzs
            FROM sales s
            LEFT JOIN (
              SELECT sale_id, SUM(cost_uzs) as cost_uzs
              FROM sale_fifo_allocations
              GROUP BY sale_id
            ) sfa ON sfa.sale_id = s.id
            WHERE s.company_id = ${companyId}::uuid AND s.status = 'COMPLETED' AND s.created_at >= ${monthStart}
            GROUP BY DATE(s.created_at)
            ORDER BY date ASC
          `
    ]);

    // Trend calculations
    const todayRev = todayAgg[0]?.revenue_uzs ?? 0;
    const yesterdayRev = yesterdayAgg[0]?.revenue_uzs ?? 0;
    const todayTrend = pctChange(todayRev, yesterdayRev);

    const weekRev = weekAgg[0]?.revenue_uzs ?? 0;
    const prevWeekRev = prevWeekAgg[0]?.revenue_uzs ?? 0;
    const weekTrend = pctChange(weekRev, prevWeekRev);

    const monthRev = monthAgg[0]?.revenue_uzs ?? 0;
    const prevMonthRev = prevMonthAgg[0]?.revenue_uzs ?? 0;
    const monthTrend = pctChange(monthRev, prevMonthRev);

    const yearRev = yearAgg[0]?.revenue_uzs ?? 0;
    const prevYearRev = prevYearAgg[0]?.revenue_uzs ?? 0;
    const yearTrend = pctChange(yearRev, prevYearRev);

    const monthCogs = cogsAgg[0]?.total ?? 0;
    const monthProfit = monthRev - monthCogs;

    const prevMonthCogs = prevCogsAgg[0]?.total ?? 0;
    const prevMonthProfit = prevMonthRev - prevMonthCogs;
    const profitTrend = pctChange(monthProfit, prevMonthProfit);

    return {
      exchangeRate: rate,
      todaySales: {
        uzs: todayRev,
        usd: todayAgg[0]?.revenue_usd || (todayRev / rate),
        trend: todayTrend
      },
      weeklySales: {
        uzs: weekRev,
        usd: weekAgg[0]?.revenue_usd || (weekRev / rate),
        trend: weekTrend
      },
      monthlySales: {
        uzs: monthRev,
        usd: monthAgg[0]?.revenue_usd || (monthRev / rate),
        trend: monthTrend
      },
      yearlySales: {
        uzs: yearRev,
        usd: yearAgg[0]?.revenue_usd || (yearRev / rate),
        trend: yearTrend
      },
      netProfit: {
        uzs: monthProfit,
        usd: monthProfit / rate,
        trend: profitTrend
      },
      inventoryValue: {
        uzs: inventoryVal[0]?.total ?? 0,
        usd: (inventoryVal[0]?.total ?? 0) / rate
      },
      customerDebt: {
        uzs: custDebt[0]?.total ?? 0,
        usd: (custDebt[0]?.total ?? 0) / rate
      },
      supplierDebt: {
        uzs: suppDebt[0]?.total ?? 0,
        usd: (suppDebt[0]?.total ?? 0) / rate
      },
      warehouseValue: {
        uzs: inventoryVal[0]?.total ?? 0,
        usd: (inventoryVal[0]?.total ?? 0) / rate
      },
      topProducts: topProducts.map((p: any) => ({
        name: p.name,
        qty: p.quantity,
        revenueUzs: p.revenue_uzs,
        revenueUsd: p.revenue_uzs / rate
      })),
      topCustomers: topCustomers.map((c: any) => ({
        name: c.name,
        revenueUzs: c.revenue_uzs,
        revenueUsd: c.revenue_uzs / rate
      })),
      last30DaysChart: dailyChartData.map((point: any) => {
        const rev = point.revenue_uzs ?? 0;
        const cogs = point.cogs_uzs ?? 0;
        const profit = rev - cogs;
        const dateStr = point.date instanceof Date 
          ? point.date.toISOString().slice(0, 10) 
          : String(point.date);
        return {
          date: dateStr,
          salesUzs: rev,
          salesUsd: point.revenue_usd || (rev / rate),
          profitUzs: profit,
          profitUsd: profit / rate
        };
      })
    };
  }
}

