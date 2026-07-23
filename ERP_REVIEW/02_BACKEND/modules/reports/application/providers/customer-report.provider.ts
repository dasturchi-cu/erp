import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, moneyFields, paginateRows, sortRows } from './report-query.helpers';

@Injectable()
export class CustomerReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'top_buyers':
        return this.topBuyers(ctx);
      case 'summary':
      default:
        return this.summary(ctx);
    }
  }

  private async summary(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.CustomerWhereInput = {
      companyId: ctx.companyId,
      deletedAt: null,
    };
    if (ctx.q) {
      where.OR = [
        { name: { contains: ctx.q, mode: 'insensitive' } },
        { phone: { contains: ctx.q } },
      ];
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { totalPurchasesUzs: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.customer.aggregate({
      where,
      _sum: { totalDebtUzs: true, totalDebtUsd: true, totalPurchasesUzs: true },
      _count: { id: true },
    });

    const data = customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      status: c.status,
      totalPurchasesUzs: formatMoney(c.totalPurchasesUzs),
      debtUzs: formatMoney(c.totalDebtUzs),
      debtUsd: formatMoney(c.totalDebtUsd),
      lastPurchaseAt: c.lastPurchaseAt?.toISOString() ?? null,
    }));

    return {
      data,
      total,
      summary: { customerCount: agg._count.id },
      totals: {
        customerCount: agg._count.id,
        ...moneyFields(agg._sum.totalDebtUzs ?? 0, agg._sum.totalDebtUsd ?? 0, ctx.currency),
        totalPurchasesUzs: formatMoney(agg._sum.totalPurchasesUzs),
      },
      kpi: [
        { id: 'kpi_customers', label: 'Mijozlar', value: String(agg._count.id) },
        { id: 'kpi_debt', label: 'Jami qarz UZS', value: formatMoney(agg._sum.totalDebtUzs) },
      ],
    };
  }

  private async topBuyers(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const sales = await this.prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        companyId: ctx.companyId,
        status: { not: 'CANCELLED' },
        customerId: { not: null },
        createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
      },
      _count: { id: true },
      _sum: { totalUzs: true, totalUsd: true },
      orderBy: { _sum: { totalUzs: 'desc' } },
    });

    const customerIds = sales.map((s) => s.customerId!).filter(Boolean);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true },
    });
    const nameMap = new Map(customers.map((c) => [c.id, c]));

    let rows = sales.map((s) => {
      const c = nameMap.get(s.customerId!);
      return {
        name: c?.name ?? '—',
        phone: c?.phone ?? '—',
        saleCount: s._count.id,
        totalUzs: formatMoney(s._sum.totalUzs),
        totalUsd: formatMoney(s._sum.totalUsd),
      };
    });

    rows = applySearch(rows, ctx.q, ['name', 'phone']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    return {
      data,
      total,
      summary: { buyerCount: rows.length },
      totals: { buyerCount: rows.length },
      kpi: [{ id: 'kpi_buyers', label: 'Xaridorlar', value: String(rows.length) }],
    };
  }
}
