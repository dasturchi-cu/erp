import { Injectable } from '@nestjs/common';
import { ExpenseCategory, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, moneyFields, paginateRows, sortRows, sumDecimal } from './report-query.helpers';

@Injectable()
export class ExpenseReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'detail':
        return this.detail(ctx);
      case 'monthly_trend':
        return this.monthlyTrend(ctx);
      case 'by_category':
      default:
        return this.byCategory(ctx);
    }
  }

  private expenseWhere(ctx: ReportQueryContext): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {
      companyId: ctx.companyId,
      deletedAt: null,
      expenseDate: { gte: ctx.dateFrom, lte: ctx.dateTo },
    };
    if (ctx.branchId) where.branchId = ctx.branchId;
    return where;
  }

  private async byCategory(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const grouped = await this.prisma.expense.groupBy({
      by: ['category'],
      where: this.expenseWhere(ctx),
      _count: { id: true },
      _sum: { amountUzs: true, amountUsd: true },
    });

    let rows = grouped.map((g) => ({
      category: g.category,
      count: g._count.id,
      totalUzs: formatMoney(g._sum.amountUzs),
      totalUsd: formatMoney(g._sum.amountUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['category', 'totalUzs'], 'totalUzs');
    rows = applySearch(rows, ctx.q, ['category']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    const totalUzs = sumDecimal(grouped.map((g) => g._sum.amountUzs ?? new Decimal(0)));

    return {
      data,
      total,
      summary: { categoryCount: grouped.length },
      totals: { categoryCount: grouped.length, totalUzs: formatMoney(totalUzs) },
      kpi: [
        { id: 'kpi_categories', label: 'Kategoriyalar', value: String(grouped.length) },
        { id: 'kpi_total', label: 'Jami xarajat UZS', value: formatMoney(totalUzs) },
      ],
    };
  }

  private async detail(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where = this.expenseWhere(ctx);
    if (ctx.q) {
      where.OR = [
        { description: { contains: ctx.q, mode: 'insensitive' } },
        { notes: { contains: ctx.q, mode: 'insensitive' } },
      ];
    }

    const [total, expenses] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        include: {
          recorder: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } },
        },
        orderBy: { expenseDate: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.expense.aggregate({
      where,
      _sum: { amountUzs: true, amountUsd: true },
      _count: { id: true },
    });

    const data = expenses.map((e) => ({
      date: e.expenseDate.toISOString().slice(0, 10),
      category: e.category,
      description: e.description,
      amountUzs: formatMoney(e.amountUzs),
      amountUsd: formatMoney(e.amountUsd),
      branch: e.branch?.name ?? '—',
      recordedBy: `${e.recorder.firstName} ${e.recorder.lastName}`,
    }));

    return {
      data,
      total,
      summary: { expenseCount: agg._count.id },
      totals: {
        expenseCount: agg._count.id,
        ...moneyFields(agg._sum.amountUzs ?? 0, agg._sum.amountUsd ?? 0, ctx.currency),
      },
      kpi: [{ id: 'kpi_expenses', label: 'Xarajatlar', value: String(agg._count.id) }],
    };
  }

  private async monthlyTrend(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const expenses = await this.prisma.expense.findMany({
      where: this.expenseWhere(ctx),
      select: { expenseDate: true, amountUzs: true, amountUsd: true },
    });

    const map = new Map<string, { month: string; totalUzs: Decimal; totalUsd: Decimal; count: number }>();
    for (const e of expenses) {
      const key = e.expenseDate.toISOString().slice(0, 7);
      const row = map.get(key) ?? { month: key, totalUzs: new Decimal(0), totalUsd: new Decimal(0), count: 0 };
      row.totalUzs = row.totalUzs.add(e.amountUzs);
      row.totalUsd = row.totalUsd.add(e.amountUsd);
      row.count += 1;
      map.set(key, row);
    }

    let rows = Array.from(map.values()).map((v) => ({
      month: v.month,
      count: v.count,
      totalUzs: formatMoney(v.totalUzs),
      totalUsd: formatMoney(v.totalUsd),
    }));

    rows = sortRows(rows, ctx.sort, ['month', 'totalUzs'], 'month');
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { monthCount: map.size },
      totals: { monthCount: map.size },
      kpi: [{ id: 'kpi_months', label: 'Oylar', value: String(map.size) }],
    };
  }
}
