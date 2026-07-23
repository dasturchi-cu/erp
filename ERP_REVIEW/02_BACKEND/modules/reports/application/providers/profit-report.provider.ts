import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, moneyFields, paginateRows, saleDateFilter, sortRows, sumDecimal } from './report-query.helpers';

@Injectable()
export class ProfitReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'by_product':
        return this.byProduct(ctx);
      case 'by_category':
        return this.byCategory(ctx);
      case 'cogs_detail':
        return this.cogsDetail(ctx);
      case 'gross_profit':
      default:
        return this.grossProfit(ctx);
    }
  }

  private async grossProfit(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const salesAgg = await this.prisma.sale.aggregate({
      where: saleDateFilter(ctx),
      _sum: { totalUzs: true, totalUsd: true },
      _count: { id: true },
    });

    const cogsAgg = await this.prisma.saleItem.aggregate({
      where: { sale: saleDateFilter(ctx) },
      _sum: { cogsUzs: true, cogsUsd: true },
    });

    const expenseAgg = await this.prisma.expense.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        expenseDate: { gte: ctx.dateFrom, lte: ctx.dateTo },
      },
      _sum: { amountUzs: true, amountUsd: true },
    });

    const revenueUzs = new Decimal(salesAgg._sum.totalUzs ?? 0);
    const revenueUsd = new Decimal(salesAgg._sum.totalUsd ?? 0);
    const cogsUzs = new Decimal(cogsAgg._sum.cogsUzs ?? 0);
    const cogsUsd = new Decimal(cogsAgg._sum.cogsUsd ?? 0);
    const expenseUzs = new Decimal(expenseAgg._sum.amountUzs ?? 0);
    const expenseUsd = new Decimal(expenseAgg._sum.amountUsd ?? 0);
    const grossProfitUzs = revenueUzs.sub(cogsUzs);
    const grossProfitUsd = revenueUsd.sub(cogsUsd);
    const netProfitUzs = grossProfitUzs.sub(expenseUzs);
    const netProfitUsd = grossProfitUsd.sub(expenseUsd);

    const marginPct = revenueUzs.gt(0)
      ? grossProfitUzs.div(revenueUzs).mul(100).toDecimalPlaces(2).toString()
      : '0';

    const data = [
      {
        period: `${ctx.dateFrom.toISOString().slice(0, 10)} — ${ctx.dateTo.toISOString().slice(0, 10)}`,
        revenueUzs: formatMoney(revenueUzs),
        revenueUsd: formatMoney(revenueUsd),
        cogsUzs: formatMoney(cogsUzs),
        cogsUsd: formatMoney(cogsUsd),
        grossProfitUzs: formatMoney(grossProfitUzs),
        grossProfitUsd: formatMoney(grossProfitUsd),
        expensesUzs: formatMoney(expenseUzs),
        netProfitUzs: formatMoney(netProfitUzs),
        marginPercent: marginPct,
      },
    ];

    return {
      data,
      total: 1,
      summary: { saleCount: salesAgg._count.id },
      totals: {
        revenueUzs: formatMoney(revenueUzs),
        cogsUzs: formatMoney(cogsUzs),
        grossProfitUzs: formatMoney(grossProfitUzs),
        expensesUzs: formatMoney(expenseUzs),
        netProfitUzs: formatMoney(netProfitUzs),
        marginPercent: marginPct,
      },
      kpi: [
        { id: 'kpi_revenue', label: 'Daromad UZS', value: formatMoney(revenueUzs) },
        { id: 'kpi_profit', label: 'Yalpi foyda UZS', value: formatMoney(grossProfitUzs) },
        { id: 'kpi_margin', label: 'Marja %', value: marginPct },
      ],
    };
  }

  private async byProduct(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: saleDateFilter(ctx) },
      include: { product: { select: { sku: true, name: true } } },
    });

    const map = new Map<string, { sku: string; name: string; revenueUzs: Decimal; cogsUzs: Decimal }>();
    for (const item of items) {
      const e = map.get(item.productId) ?? {
        sku: item.product.sku,
        name: item.product.name,
        revenueUzs: new Decimal(0),
        cogsUzs: new Decimal(0),
      };
      e.revenueUzs = e.revenueUzs.add(item.totalUzs);
      e.cogsUzs = e.cogsUzs.add(item.cogsUzs);
      map.set(item.productId, e);
    }

    let rows = Array.from(map.values()).map((v) => {
      const profit = v.revenueUzs.sub(v.cogsUzs);
      const margin = v.revenueUzs.gt(0) ? profit.div(v.revenueUzs).mul(100).toDecimalPlaces(2).toString() : '0';
      return {
        sku: v.sku,
        name: v.name,
        revenueUzs: formatMoney(v.revenueUzs),
        cogsUzs: formatMoney(v.cogsUzs),
        grossProfitUzs: formatMoney(profit),
        marginPercent: margin,
      };
    });

    rows = sortRows(rows, ctx.sort, ['name', 'grossProfitUzs', 'marginPercent'], 'grossProfitUzs');
    rows = applySearch(rows, ctx.q, ['sku', 'name']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { productCount: map.size },
      totals: { productCount: map.size },
      kpi: [{ id: 'kpi_products', label: 'Mahsulotlar', value: String(map.size) }],
    };
  }

  private async byCategory(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: saleDateFilter(ctx) },
      include: { product: { include: { category: { select: { name: true } } } } },
    });

    const map = new Map<string, { category: string; revenueUzs: Decimal; cogsUzs: Decimal }>();
    for (const item of items) {
      const cat = item.product.category?.name ?? 'Boshqa';
      const e = map.get(cat) ?? { category: cat, revenueUzs: new Decimal(0), cogsUzs: new Decimal(0) };
      e.revenueUzs = e.revenueUzs.add(item.totalUzs);
      e.cogsUzs = e.cogsUzs.add(item.cogsUzs);
      map.set(cat, e);
    }

    let rows = Array.from(map.values()).map((v) => {
      const profit = v.revenueUzs.sub(v.cogsUzs);
      const margin = v.revenueUzs.gt(0) ? profit.div(v.revenueUzs).mul(100).toDecimalPlaces(2).toString() : '0';
      return {
        category: v.category,
        revenueUzs: formatMoney(v.revenueUzs),
        cogsUzs: formatMoney(v.cogsUzs),
        grossProfitUzs: formatMoney(profit),
        marginPercent: margin,
      };
    });

    rows = sortRows(rows, ctx.sort, ['category', 'grossProfitUzs'], 'grossProfitUzs');
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

  private async cogsDetail(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.SaleFifoAllocationWhereInput = {
      companyId: ctx.companyId,
      sale: saleDateFilter(ctx),
    };

    const [total, allocations] = await this.prisma.$transaction([
      this.prisma.saleFifoAllocation.count({ where }),
      this.prisma.saleFifoAllocation.findMany({
        where,
        include: {
          sale: { select: { saleNumber: true } },
          product: { select: { sku: true, name: true } },
          batch: { select: { id: true, receivedAt: true } },
        },
        orderBy: { sale: { createdAt: 'desc' } },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.saleFifoAllocation.aggregate({
      where,
      _sum: { costUzs: true, costUsd: true, quantity: true },
    });

    const data = allocations.map((a) => ({
      saleNumber: a.sale.saleNumber,
      product: a.product.name,
      sku: a.product.sku,
      batchId: a.batch.id,
      quantity: formatMoney(a.quantity),
      unitCostUzs: formatMoney(a.unitCostUzs),
      totalCogsUzs: formatMoney(a.costUzs),
      receivedAt: a.batch.receivedAt.toISOString(),
    }));

    return {
      data,
      total,
      summary: { allocationCount: total },
      totals: {
        allocationCount: total,
        totalCogsUzs: formatMoney(agg._sum.costUzs),
        totalQuantity: formatMoney(agg._sum.quantity),
      },
      kpi: [
        { id: 'kpi_allocations', label: 'Taqsimotlar', value: String(total) },
        { id: 'kpi_cogs', label: 'Jami COGS UZS', value: formatMoney(agg._sum.costUzs) },
      ],
    };
  }
}
