import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, paginateRows } from './report-query.helpers';

@Injectable()
export class SupplierReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'debt_list':
        return this.debtList(ctx);
      case 'summary':
      default:
        return this.summary(ctx);
    }
  }

  private async summary(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.SupplierWhereInput = {
      companyId: ctx.companyId,
      deletedAt: null,
    };
    if (ctx.q) {
      where.OR = [
        { name: { contains: ctx.q, mode: 'insensitive' } },
        { phone: { contains: ctx.q } },
      ];
    }

    const [total, suppliers] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { totalDebtUzs: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.supplier.aggregate({
      where,
      _sum: { totalDebtUzs: true, totalPaidUzs: true },
      _count: { id: true },
    });

    const data = suppliers.map((s) => ({
      name: s.name,
      phone: s.phone,
      status: s.status,
      debtUzs: formatMoney(s.totalDebtUzs),
      paidUzs: formatMoney(s.totalPaidUzs),
    }));

    return {
      data,
      total,
      summary: { supplierCount: agg._count.id },
      totals: {
        supplierCount: agg._count.id,
        totalDebtUzs: formatMoney(agg._sum.totalDebtUzs),
        totalPaidUzs: formatMoney(agg._sum.totalPaidUzs),
      },
      kpi: [
        { id: 'kpi_suppliers', label: 'Yetkazib beruvchilar', value: String(agg._count.id) },
        { id: 'kpi_debt', label: 'Jami qarz UZS', value: formatMoney(agg._sum.totalDebtUzs) },
      ],
    };
  }

  private async debtList(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.SupplierWhereInput = {
      companyId: ctx.companyId,
      deletedAt: null,
      totalDebtUzs: { gt: 0 },
    };
    if (ctx.q) {
      where.name = { contains: ctx.q, mode: 'insensitive' };
    }

    const [total, suppliers] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: { totalDebtUzs: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const data = suppliers.map((s) => ({
      name: s.name,
      phone: s.phone,
      debtUzs: formatMoney(s.totalDebtUzs),
      paidUzs: formatMoney(s.totalPaidUzs),
    }));

    const agg = await this.prisma.supplier.aggregate({
      where,
      _sum: { totalDebtUzs: true },
      _count: { id: true },
    });

    return {
      data,
      total,
      summary: { debtorCount: agg._count.id },
      totals: { debtorCount: agg._count.id, totalDebtUzs: formatMoney(agg._sum.totalDebtUzs) },
      kpi: [{ id: 'kpi_debtors', label: 'Qarzdorlar', value: String(agg._count.id) }],
    };
  }
}
