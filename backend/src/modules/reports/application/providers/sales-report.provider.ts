import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RLS_PRISMA, RlsPrismaClient } from '../../../../core/database/rls-prisma.service';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip, parseSort } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import {
  applySearch,
  buildReportResponse,
  moneyFields,
  paginateRows,
  saleDateFilter,
  sortRows,
  sumDecimal,
} from './report-query.helpers';

@Injectable()
export class SalesReportProvider {
  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient, private readonly basePrisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'daily_summary':
        return this.dailySummary(ctx);
      case 'detail':
        return this.detail(ctx);
      case 'by_product':
        return this.byProduct(ctx);
      case 'by_category':
        return this.byCategory(ctx);
      case 'by_cashier':
        return this.byCashier(ctx);
      case 'by_branch':
        return this.byBranch(ctx);
      case 'returns':
        return this.returns(ctx);
      default:
        return this.dailySummary(ctx);
    }
  }

  private async dailySummary(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    // Fetched per-sale (not Prisma's groupBy _sum) because the credit
    // (unpaid) portion must be computed per sale using *that sale's own*
    // exchangeRateUsed before summing — independently summing amountPaidUzs
    // and amountPaidUsd across sales and subtracting each from the
    // matching total conflates "which currency paid" with "how much is
    // still owed": a sale paid in full in UZS has amountPaidUsd=0, so
    // totalUsd.sub(sum of amountPaidUsd) wrongly counted its entire USD
    // total as still-outstanding credit even though nothing was owed.
    const sales = await this.prisma.sale.findMany({
      where: saleDateFilter(ctx),
      select: {
        createdAt: true,
        totalUzs: true,
        totalUsd: true,
        amountPaidUzs: true,
        amountPaidUsd: true,
        exchangeRateUsed: true,
      },
    });

    const dayMap = new Map<string, { count: number; totalUzs: Decimal; totalUsd: Decimal; creditUzs: Decimal; creditUsd: Decimal }>();

    for (const sale of sales) {
      const key = sale.createdAt.toISOString().slice(0, 10);
      const existing = dayMap.get(key) ?? {
        count: 0,
        totalUzs: new Decimal(0),
        totalUsd: new Decimal(0),
        creditUzs: new Decimal(0),
        creditUsd: new Decimal(0),
      };
      existing.count += 1;
      existing.totalUzs = existing.totalUzs.add(sale.totalUzs);
      existing.totalUsd = existing.totalUsd.add(sale.totalUsd);

      const paidUzsEquivalent = sale.amountPaidUzs.add(sale.amountPaidUsd.mul(sale.exchangeRateUsed));
      const saleCreditUzs = Decimal.max(0, sale.totalUzs.sub(paidUzsEquivalent));
      const saleCreditUsd = sale.exchangeRateUsed.gt(0) ? saleCreditUzs.div(sale.exchangeRateUsed) : new Decimal(0);
      existing.creditUzs = existing.creditUzs.add(saleCreditUzs);
      existing.creditUsd = existing.creditUsd.add(saleCreditUsd);
      dayMap.set(key, existing);
    }

    let rows = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      saleCount: v.count,
      totalUzs: formatMoney(v.totalUzs),
      totalUsd: formatMoney(v.totalUsd),
      cashUzs: formatMoney(v.totalUzs.sub(v.creditUzs)),
      cashUsd: formatMoney(v.totalUsd.sub(v.creditUsd)),
      creditUzs: formatMoney(v.creditUzs),
      creditUsd: formatMoney(v.creditUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['date', 'saleCount', 'totalUzs'], 'date');
    rows = applySearch(rows, ctx.q, ['date']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    const allTotals = Array.from(dayMap.values());
    const totalSales = allTotals.reduce((s, v) => s + v.count, 0);
    const totalUzs = sumDecimal(allTotals.map((v) => v.totalUzs));
    const totalUsd = sumDecimal(allTotals.map((v) => v.totalUsd));

    return {
      data,
      total,
      summary: { period: ctx.period, dateFrom: ctx.dateFrom.toISOString(), dateTo: ctx.dateTo.toISOString() },
      totals: {
        saleCount: totalSales,
        ...moneyFields(totalUzs, totalUsd, ctx.currency),
      },
      kpi: [
        { id: 'kpi_sales', label: 'Savdolar soni', value: String(totalSales) },
        { id: 'kpi_revenue_uzs', label: 'Jami daromad (UZS)', value: formatMoney(totalUzs) },
        { id: 'kpi_revenue_usd', label: 'Jami daromad (USD)', value: formatMoney(totalUsd) },
      ],
    };
  }

  private async detail(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where = saleDateFilter(ctx);
    if (ctx.q) {
      where.OR = [
        { saleNumber: { contains: ctx.q, mode: 'insensitive' } },
        { customer: { name: { contains: ctx.q, mode: 'insensitive' } } },
      ];
    }

    const sortFields = parseSort(ctx.sort, ['createdAt', 'totalUzs', 'number'], [
      { field: 'createdAt', direction: 'desc' },
    ]);
    const orderBy = sortFields.map((s) => {
      if (s.field === 'number') return { saleNumber: s.direction };
      return { [s.field]: s.direction };
    }) as Prisma.SaleOrderByWithRelationInput[];

    const [total, sales] = await this.basePrisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.company_id', ${ctx.companyId}, true)`;
      return [
        await tx.sale.count({ where }),
        await tx.sale.findMany({
          where,
          include: {
            customer: { select: { name: true } },
            cashier: { select: { firstName: true, lastName: true } },
            items: { select: { id: true } },
          },
          orderBy,
          skip: paginationSkip(ctx.page, ctx.limit),
          take: ctx.limit,
        }),
      ] as const;
    });

    const agg = await this.prisma.sale.aggregate({
      where,
      _sum: { totalUzs: true, totalUsd: true },
      _count: { id: true },
    });

    const data = sales.map((s) => ({
      saleNumber: s.saleNumber,
      date: s.createdAt.toISOString(),
      customer: s.customer?.name ?? '—',
      cashier: `${s.cashier.firstName} ${s.cashier.lastName}`,
      itemCount: s.items.length,
      totalUzs: formatMoney(s.totalUzs),
      totalUsd: formatMoney(s.totalUsd),
      paymentType: s.paymentType,
    }));

    return {
      data,
      total,
      summary: { template: 'detail' },
      totals: {
        saleCount: agg._count.id,
        ...moneyFields(agg._sum.totalUzs ?? 0, agg._sum.totalUsd ?? 0, ctx.currency),
      },
      kpi: [
        { id: 'kpi_count', label: 'Savdolar', value: String(agg._count.id) },
        { id: 'kpi_total_uzs', label: 'Jami UZS', value: formatMoney(agg._sum.totalUzs) },
      ],
    };
  }

  private async byProduct(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: saleDateFilter(ctx) },
      include: { product: { select: { sku: true, name: true } } },
    });

    const map = new Map<string, { sku: string; name: string; qty: Decimal; revenueUzs: Decimal; revenueUsd: Decimal; cogsUzs: Decimal; cogsUsd: Decimal }>();
    for (const item of items) {
      const key = item.productId;
      const e = map.get(key) ?? {
        sku: item.product.sku,
        name: item.product.name,
        qty: new Decimal(0),
        revenueUzs: new Decimal(0),
        revenueUsd: new Decimal(0),
        cogsUzs: new Decimal(0),
        cogsUsd: new Decimal(0),
      };
      e.qty = e.qty.add(item.quantity);
      e.revenueUzs = e.revenueUzs.add(item.totalUzs);
      e.revenueUsd = e.revenueUsd.add(item.totalUsd);
      e.cogsUzs = e.cogsUzs.add(item.cogsUzs);
      e.cogsUsd = e.cogsUsd.add(item.cogsUsd);
      map.set(key, e);
    }

    let rows = Array.from(map.values()).map((v) => ({
      sku: v.sku,
      name: v.name,
      quantity: formatMoney(v.qty),
      revenueUzs: formatMoney(v.revenueUzs),
      revenueUsd: formatMoney(v.revenueUsd),
      cogsUzs: formatMoney(v.cogsUzs),
      profitUzs: formatMoney(v.revenueUzs.sub(v.cogsUzs)),
    }));

    rows = sortRows(rows, ctx.sort, ['name', 'revenueUzs', 'quantity'], 'revenueUzs');
    rows = applySearch(rows, ctx.q, ['sku', 'name']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    const totalRev = sumDecimal(Array.from(map.values()).map((v) => v.revenueUzs));

    return {
      data,
      total,
      summary: { productCount: map.size },
      totals: { productCount: map.size, totalRevenueUzs: formatMoney(totalRev) },
      kpi: [
        { id: 'kpi_products', label: 'Mahsulotlar', value: String(map.size) },
        { id: 'kpi_revenue', label: 'Daromad UZS', value: formatMoney(totalRev) },
      ],
    };
  }

  private async byCategory(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: saleDateFilter(ctx) },
      include: { product: { include: { category: { select: { name: true } } } } },
    });

    const map = new Map<string, { category: string; qty: Decimal; revenueUzs: Decimal; revenueUsd: Decimal }>();
    for (const item of items) {
      const cat = item.product.category?.name ?? 'Boshqa';
      const e = map.get(cat) ?? { category: cat, qty: new Decimal(0), revenueUzs: new Decimal(0), revenueUsd: new Decimal(0) };
      e.qty = e.qty.add(item.quantity);
      e.revenueUzs = e.revenueUzs.add(item.totalUzs);
      e.revenueUsd = e.revenueUsd.add(item.totalUsd);
      map.set(cat, e);
    }

    let rows = Array.from(map.values()).map((v) => ({
      category: v.category,
      quantity: formatMoney(v.qty),
      revenueUzs: formatMoney(v.revenueUzs),
      revenueUsd: formatMoney(v.revenueUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['category', 'revenueUzs'], 'revenueUzs');
    rows = applySearch(rows, ctx.q, ['category']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { categoryCount: map.size },
      totals: { categoryCount: map.size },
      kpi: [{ id: 'kpi_categories', label: 'Kategoriyalar', value: String(map.size) }],
    };
  }

  private async byCashier(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const grouped = await this.prisma.sale.groupBy({
      by: ['cashierId'],
      where: saleDateFilter(ctx),
      _count: { id: true },
      _sum: { totalUzs: true, totalUsd: true },
    });

    const cashiers = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.cashierId) } },
      select: { id: true, firstName: true, lastName: true },
    });
    const nameMap = new Map(cashiers.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));

    let rows = grouped.map((g) => ({
      cashier: nameMap.get(g.cashierId) ?? g.cashierId,
      saleCount: g._count.id,
      totalUzs: formatMoney(g._sum.totalUzs),
      totalUsd: formatMoney(g._sum.totalUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['cashier', 'saleCount', 'totalUzs'], 'totalUzs');
    rows = applySearch(rows, ctx.q, ['cashier']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { cashierCount: grouped.length },
      totals: { cashierCount: grouped.length },
      kpi: [{ id: 'kpi_cashiers', label: 'Kassirlar', value: String(grouped.length) }],
    };
  }

  private async byBranch(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const grouped = await this.prisma.sale.groupBy({
      by: ['branchId'],
      where: saleDateFilter(ctx),
      _count: { id: true },
      _sum: { totalUzs: true, totalUsd: true },
    });

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: grouped.map((g) => g.branchId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(branches.map((b) => [b.id, b.name]));

    let rows = grouped.map((g) => ({
      branch: nameMap.get(g.branchId) ?? g.branchId,
      saleCount: g._count.id,
      totalUzs: formatMoney(g._sum.totalUzs),
      totalUsd: formatMoney(g._sum.totalUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['branch', 'saleCount', 'totalUzs'], 'totalUzs');
    rows = applySearch(rows, ctx.q, ['branch']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { branchCount: grouped.length },
      totals: { branchCount: grouped.length },
      kpi: [{ id: 'kpi_branches', label: 'Filiallar', value: String(grouped.length) }],
    };
  }

  private async returns(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.SaleReturnWhereInput = {
      companyId: ctx.companyId,
      status: 'APPROVED',
      createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
    };
    if (ctx.q) {
      where.OR = [
        { reason: { contains: ctx.q, mode: 'insensitive' } },
        { sale: { saleNumber: { contains: ctx.q, mode: 'insensitive' } } },
      ];
    }

    const [total, returns] = await this.basePrisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.company_id', ${ctx.companyId}, true)`;
      return [
        await tx.saleReturn.count({ where }),
        await tx.saleReturn.findMany({
          where,
          include: {
            sale: { select: { saleNumber: true } },
            customer: { select: { name: true } },
            items: { select: { id: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: paginationSkip(ctx.page, ctx.limit),
          take: ctx.limit,
        }),
      ] as const;
    });

    const agg = await this.prisma.saleReturn.aggregate({
      where,
      _sum: { amountUzs: true, amountUsd: true },
      _count: { id: true },
    });

    const data = returns.map((r) => ({
      returnId: r.id,
      originalSale: r.sale.saleNumber,
      customer: r.customer?.name ?? '—',
      date: r.createdAt.toISOString(),
      itemCount: r.items.length,
      amountUzs: formatMoney(r.amountUzs),
      amountUsd: formatMoney(r.amountUsd),
      reason: r.reason,
    }));

    return {
      data,
      total,
      summary: { returnCount: agg._count.id },
      totals: {
        returnCount: agg._count.id,
        ...moneyFields(agg._sum.amountUzs ?? 0, agg._sum.amountUsd ?? 0, ctx.currency),
      },
      kpi: [{ id: 'kpi_returns', label: 'Qaytarishlar', value: String(agg._count.id) }],
    };
  }
}
