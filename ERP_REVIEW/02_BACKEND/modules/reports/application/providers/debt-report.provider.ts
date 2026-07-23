import { Injectable } from '@nestjs/common';
import { DebtHistoryType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../../core/database/prisma.service';
import { formatMoney } from '../../../../core/utils/money.util';
import { paginationSkip } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';
import { applySearch, moneyFields, paginateRows, sortRows } from './report-query.helpers';
import {
  ageDaysFrom,
  AGING_BUCKET_DEFS,
  resolveAgingBucket,
} from '../../../debt/application/debt-aging.util';

@Injectable()
export class DebtReportProvider {
  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    switch (ctx.template) {
      case 'aging':
        return this.aging(ctx);
      case 'payments':
        return this.payments(ctx);
      case 'top_debtors':
        return this.topDebtors(ctx);
      case 'summary':
      default:
        return this.summary(ctx);
    }
  }

  private async summary(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.CustomerWhereInput = {
      companyId: ctx.companyId,
      deletedAt: null,
      OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
    };
    if (ctx.q) {
      where.AND = [
        {
          OR: [
            { name: { contains: ctx.q, mode: 'insensitive' } },
            { phone: { contains: ctx.q } },
          ],
        },
      ];
    }

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { totalDebtUzs: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.customer.aggregate({
      where,
      _sum: { totalDebtUzs: true, totalDebtUsd: true },
      _count: { id: true },
    });

    const data = customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      debtUzs: formatMoney(c.totalDebtUzs),
      debtUsd: formatMoney(c.totalDebtUsd),
      lastPaymentAt: c.lastPaymentAt?.toISOString() ?? null,
    }));

    return {
      data,
      total,
      summary: { debtorCount: agg._count.id },
      totals: {
        debtorCount: agg._count.id,
        ...moneyFields(agg._sum.totalDebtUzs ?? 0, agg._sum.totalDebtUsd ?? 0, ctx.currency),
      },
      kpi: [
        { id: 'kpi_debtors', label: 'Qarzdor mijozlar', value: String(agg._count.id) },
        { id: 'kpi_debt_uzs', label: 'Jami qarz UZS', value: formatMoney(agg._sum.totalDebtUzs) },
      ],
    };
  }

  private async aging(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
      },
      select: { id: true, name: true, phone: true, totalDebtUzs: true, totalDebtUsd: true },
    });

    const asOf = ctx.dateTo;
    const bucketTotals = new Map<string, Decimal>(
      AGING_BUCKET_DEFS.map((b) => [b.label, new Decimal(0)]),
    );

    let rows: Record<string, unknown>[] = [];

    if (customers.length > 0) {
      const oldestCredits = await this.prisma.debtHistory.groupBy({
        by: ['customerId'],
        where: {
          companyId: ctx.companyId,
          customerId: { in: customers.map((c) => c.id) },
          type: DebtHistoryType.sale_credit,
        },
        _min: { createdAt: true },
      });
      const creditMap = new Map(
        oldestCredits.map((r) => [r.customerId, r._min.createdAt]),
      );

      for (const c of customers) {
        const oldest = creditMap.get(c.id) ?? null;
        const ageDays = oldest ? ageDaysFrom(asOf, oldest) : 0;
        const bucket = resolveAgingBucket(ageDays);
        bucketTotals.set(bucket, (bucketTotals.get(bucket) ?? new Decimal(0)).add(c.totalDebtUzs));

        rows.push({
          customer: c.name,
          phone: c.phone,
          debtUzs: formatMoney(c.totalDebtUzs),
          debtUsd: formatMoney(c.totalDebtUsd),
          ageDays,
          bucket,
          lastCreditDate: oldest?.toISOString() ?? null,
        });
      }
    }

    rows = sortRows(rows, ctx.sort, ['customer', 'debtUzs', 'ageDays'], 'debtUzs');
    rows = applySearch(rows, ctx.q, ['customer', 'phone']);
    const { data, total } = paginateRows(rows, ctx.page, ctx.limit);

    const summary: Record<string, string> = {};
    for (const def of AGING_BUCKET_DEFS) {
      summary[`bucket_${def.label.replace('+', 'plus').replace('-', '_')}`] = formatMoney(
        bucketTotals.get(def.label) ?? 0,
      );
    }

    return {
      data,
      total,
      summary,
      totals: {
        debtorCount: customers.length,
        totalDebtUzs: formatMoney(customers.reduce((s, c) => s.add(c.totalDebtUzs), new Decimal(0))),
      },
      kpi: [{ id: 'kpi_debtors', label: 'Qarzdorlar', value: String(customers.length) }],
    };
  }

  private async payments(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    const where: Prisma.DebtPaymentWhereInput = {
      companyId: ctx.companyId,
      reversedAt: null,
      createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
    };
    if (ctx.q) {
      where.customer = { name: { contains: ctx.q, mode: 'insensitive' } };
    }

    const [total, payments] = await this.prisma.$transaction([
      this.prisma.debtPayment.count({ where }),
      this.prisma.debtPayment.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          receiver: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(ctx.page, ctx.limit),
        take: ctx.limit,
      }),
    ]);

    const agg = await this.prisma.debtPayment.aggregate({
      where,
      _sum: { amountUzs: true, amountUsd: true },
      _count: { id: true },
    });

    const data = payments.map((p) => ({
      date: p.createdAt.toISOString(),
      customer: p.customer.name,
      amount: formatMoney(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      receivedBy: `${p.receiver.firstName} ${p.receiver.lastName}`,
    }));

    return {
      data,
      total,
      summary: { paymentCount: agg._count.id },
      totals: {
        paymentCount: agg._count.id,
        ...moneyFields(agg._sum.amountUzs ?? 0, agg._sum.amountUsd ?? 0, ctx.currency),
      },
      kpi: [{ id: 'kpi_payments', label: "To'lovlar", value: String(agg._count.id) }],
    };
  }

  private async topDebtors(ctx: ReportQueryContext): Promise<ReportProviderResult> {
    return this.summary({ ...ctx, sort: 'debtUzs:desc' });
  }
}
