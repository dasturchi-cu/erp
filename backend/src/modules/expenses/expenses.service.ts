import { Inject, Injectable } from '@nestjs/common';
import { OriginalCurrency } from '@prisma/client';
import { RLS_PRISMA, RlsPrismaClient } from '../../core/database/rls-prisma.service';
import { CreateExpenseDto, ExpenseQueryDto } from './dto/expenses.dto';
import { AppException } from '../../core/exceptions/app.exception';
import { Decimal } from '@prisma/client/runtime/library';
import { toDecimal, usdToUzs, uzsToUsd } from '../../core/utils/money.util';
import { CurrencyService } from '../currency/application/currency.service';

type CurrencyTotals = { uzs: Decimal; usd: Decimal };

/**
 * Cash a sale actually left in the drawer, per currency. The customer can
 * hand over more than the total (change is given back), so the tender is
 * capped at the sale total; change is assumed to be paid out in UZS first,
 * then from the USD tender.
 */
function keptSaleTender(sale: {
  totalUzs: Decimal;
  amountPaidUzs: Decimal;
  amountPaidUsd: Decimal;
  exchangeRateUsed: Decimal;
}): CurrencyTotals {
  const paidUsdInUzs = sale.exchangeRateUsed.gt(0)
    ? usdToUzs(sale.amountPaidUsd, sale.exchangeRateUsed)
    : new Decimal(0);
  const change = Decimal.max(0, sale.amountPaidUzs.add(paidUsdInUzs).sub(sale.totalUzs));
  const uzs = Decimal.max(0, sale.amountPaidUzs.sub(change));
  const changeFromUsdInUzs = Decimal.max(0, change.sub(sale.amountPaidUzs));
  const usd = sale.exchangeRateUsed.gt(0)
    ? Decimal.max(0, sale.amountPaidUsd.sub(uzsToUsd(changeFromUsdInUzs, sale.exchangeRateUsed)))
    : new Decimal(0);
  return { uzs, usd };
}

/**
 * A record booked in one currency moves only that currency's cash: the
 * stored amountUzs/amountUsd pair is the same money expressed twice, so
 * adding both double-counted every payment and expense.
 */
function tenderedColumns(
  currency: OriginalCurrency,
  amountUzs: Decimal,
  amountUsd: Decimal,
): CurrencyTotals {
  return currency === OriginalCurrency.USD
    ? { uzs: new Decimal(0), usd: amountUsd }
    : { uzs: amountUzs, usd: new Decimal(0) };
}

function toNumber(value: Decimal): number {
  return Number(value.toFixed(4));
}

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly currencyService: CurrencyService,
  ) {}

  async create(companyId: string, userId: string, dto: CreateExpenseDto) {
    // The company's current rate (latest ACTIVE). No silent 12620 fallback:
    // booking an expense at a made-up rate corrupts the other currency.
    const activeRate = await this.currencyService.getActiveRateOrThrow(companyId);
    const exchangeRate = activeRate.rate;

    const amount = new Decimal(dto.amount.toString()).toDecimalPlaces(4);
    const amountUzs =
      dto.originalCurrency === 'UZS' ? amount : usdToUzs(amount, exchangeRate);
    const amountUsd =
      dto.originalCurrency === 'UZS' ? uzsToUsd(amount, exchangeRate) : amount;

    return this.prisma.expense.create({
      data: {
        companyId,
        branchId: dto.branchId || null,
        category: dto.category,
        description: dto.description,
        originalCurrency: dto.originalCurrency,
        exchangeRateUsed: exchangeRate,
        amountUzs,
        amountUsd,
        expenseDate: new Date(dto.expenseDate),
        recordedBy: userId,
        notes: dto.notes || null,
      },
    });
  }

  async list(companyId: string, query: ExpenseQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.dateFrom || query.dateTo) {
      where.expenseDate = {};
      if (query.dateFrom) {
        where.expenseDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.expenseDate.lte = new Date(query.dateTo);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        orderBy: { expenseDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(companyId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!expense) {
      throw AppException.notFound('EXPENSE_NOT_FOUND', 'Xarajat topilmadi');
    }

    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getCashBalance(companyId: string) {
    const [salesRows, refundRows, customerPayments, expenses, supplierPayments] = await Promise.all([
      // Same capping rule as keptSaleTender(), done in SQL so the balance
      // doesn't load every sale.
      this.prisma.$queryRaw<Array<{ uzs: Decimal | null; usd: Decimal | null }>>`
        SELECT
          SUM(GREATEST(0, s.amount_paid_uzs - ex.change)) AS uzs,
          SUM(GREATEST(0, s.amount_paid_usd
            - GREATEST(0, ex.change - s.amount_paid_uzs) / NULLIF(s.exchange_rate_used, 0))) AS usd
        FROM sales s
        CROSS JOIN LATERAL (
          SELECT GREATEST(0, s.amount_paid_uzs + s.amount_paid_usd * s.exchange_rate_used - s.total_uzs) AS change
        ) ex
        WHERE s.company_id = ${companyId}::uuid
          AND s.voided_at IS NULL
          AND s.status != 'CANCELLED'
      `,
      // Approved returns on CASH sales were paid back out of the drawer.
      this.prisma.$queryRaw<Array<{ uzs: Decimal | null; usd: Decimal | null }>>`
        SELECT
          SUM(CASE WHEN sr.original_currency = 'USD' THEN 0 ELSE sr.amount_uzs END) AS uzs,
          SUM(CASE WHEN sr.original_currency = 'USD' THEN sr.amount_usd ELSE 0 END) AS usd
        FROM sale_returns sr
        JOIN sales s ON s.id = sr.sale_id
        WHERE sr.company_id = ${companyId}::uuid
          AND sr.status = 'APPROVED'
          AND s.payment_type = 'CASH'
      `,
      this.prisma.debtPayment.groupBy({
        by: ['currency'],
        where: { companyId, reversedAt: null },
        _sum: { amountUzs: true, amountUsd: true },
      }),
      this.prisma.expense.groupBy({
        by: ['originalCurrency'],
        where: { companyId, deletedAt: null },
        _sum: { amountUzs: true, amountUsd: true },
      }),
      this.prisma.supplierPayment.groupBy({
        by: ['currency'],
        where: { companyId },
        _sum: { amountUzs: true, amountUsd: true },
      }),
    ]);

    const sumByCurrency = (
      rows: Array<{ currency: OriginalCurrency; _sum: { amountUzs: Decimal | null; amountUsd: Decimal | null } }>,
    ): CurrencyTotals =>
      rows.reduce(
        (acc, r) => {
          const t = tenderedColumns(r.currency, toDecimal(r._sum.amountUzs), toDecimal(r._sum.amountUsd));
          return { uzs: acc.uzs.add(t.uzs), usd: acc.usd.add(t.usd) };
        },
        { uzs: new Decimal(0), usd: new Decimal(0) },
      );

    const refundUzs = toDecimal(refundRows[0]?.uzs);
    const refundUsd = toDecimal(refundRows[0]?.usd);
    // Sales figures are net of cash refunds.
    const salesUzs = toDecimal(salesRows[0]?.uzs).sub(refundUzs);
    const salesUsd = toDecimal(salesRows[0]?.usd).sub(refundUsd);
    const customer = sumByCurrency(customerPayments);
    const expense = sumByCurrency(
      expenses.map((e) => ({ currency: e.originalCurrency, _sum: e._sum })),
    );
    const supplier = sumByCurrency(supplierPayments);

    const balanceUzs = salesUzs.add(customer.uzs).sub(expense.uzs).sub(supplier.uzs);
    const balanceUsd = salesUsd.add(customer.usd).sub(expense.usd).sub(supplier.usd);

    return {
      balanceUzs: toNumber(balanceUzs),
      balanceUsd: toNumber(balanceUsd),
      salesUzs: toNumber(salesUzs),
      salesUsd: toNumber(salesUsd),
      refundUzs: toNumber(refundUzs),
      refundUsd: toNumber(refundUsd),
      customerUzs: toNumber(customer.uzs),
      customerUsd: toNumber(customer.usd),
      expenseUzs: toNumber(expense.uzs),
      expenseUsd: toNumber(expense.usd),
      supplierUzs: toNumber(supplier.uzs),
      supplierUsd: toNumber(supplier.usd),
    };
  }

  async getCashTransactions(companyId: string) {
    const [sales, refunds, customerPayments, expenses, supplierPayments] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          companyId,
          voidedAt: null,
          status: { not: 'CANCELLED' },
          OR: [
            { amountPaidUzs: { gt: 0 } },
            { amountPaidUsd: { gt: 0 } },
          ],
        },
        select: {
          id: true,
          saleNumber: true,
          totalUzs: true,
          amountPaidUzs: true,
          amountPaidUsd: true,
          exchangeRateUsed: true,
          createdAt: true,
        },
      }),
      this.prisma.saleReturn.findMany({
        where: { companyId, status: 'APPROVED', sale: { paymentType: 'CASH' } },
        select: {
          id: true,
          originalCurrency: true,
          amountUzs: true,
          amountUsd: true,
          decidedAt: true,
          createdAt: true,
          sale: { select: { saleNumber: true } },
        },
      }),
      this.prisma.debtPayment.findMany({
        where: { companyId, reversedAt: null },
        select: {
          id: true,
          currency: true,
          amountUzs: true,
          amountUsd: true,
          notes: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: { companyId, deletedAt: null },
        select: {
          id: true,
          category: true,
          description: true,
          originalCurrency: true,
          amountUzs: true,
          amountUsd: true,
          expenseDate: true,
          notes: true,
          createdAt: true,
        },
      }),
      this.prisma.supplierPayment.findMany({
        where: { companyId },
        select: {
          id: true,
          currency: true,
          amountUzs: true,
          amountUsd: true,
          notes: true,
          createdAt: true,
          supplier: { select: { name: true } },
        },
      }),
    ]);

    const txs: Array<{
      id: string;
      type: 'INFLOW' | 'OUTFLOW';
      source: 'SALES' | 'CUSTOMER_PAYMENT' | 'EXPENSE' | 'SUPPLIER_PAYMENT';
      ref: string;
      amountUzs: number;
      amountUsd: number;
      description: string;
      date: Date;
    }> = [];

    // Map Sales (Inflow) — only the tender kept after change.
    for (const s of sales) {
      const kept = keptSaleTender(s);
      txs.push({
        id: s.id,
        type: 'INFLOW',
        source: 'SALES',
        ref: s.saleNumber,
        amountUzs: toNumber(kept.uzs),
        amountUsd: toNumber(kept.usd),
        description: 'Savdo tushumi',
        date: s.createdAt,
      });
    }

    // Map cash refunds of approved returns (Outflow). Reported under the
    // SALES source so existing clients keep rendering them.
    for (const r of refunds) {
      const t = tenderedColumns(r.originalCurrency, r.amountUzs, r.amountUsd);
      txs.push({
        id: r.id,
        type: 'OUTFLOW',
        source: 'SALES',
        ref: r.sale.saleNumber,
        amountUzs: toNumber(t.uzs),
        amountUsd: toNumber(t.usd),
        description: `Savdo qaytarildi: ${r.sale.saleNumber}`,
        date: r.decidedAt ?? r.createdAt,
      });
    }

    // Map Customer Payments (Inflow)
    for (const p of customerPayments) {
      const t = tenderedColumns(p.currency, p.amountUzs, p.amountUsd);
      txs.push({
        id: p.id,
        type: 'INFLOW',
        source: 'CUSTOMER_PAYMENT',
        ref: p.customer?.name || 'Noma\'lum',
        amountUzs: toNumber(t.uzs),
        amountUsd: toNumber(t.usd),
        description: `Mijozdan to'lov: ${p.customer?.name || ''}${p.notes ? ` (${p.notes})` : ''}`,
        date: p.createdAt,
      });
    }

    // Map Expenses (Outflow)
    for (const e of expenses) {
      const t = tenderedColumns(e.originalCurrency, e.amountUzs, e.amountUsd);
      txs.push({
        id: e.id,
        type: 'OUTFLOW',
        source: 'EXPENSE',
        ref: e.category,
        amountUzs: toNumber(t.uzs),
        amountUsd: toNumber(t.usd),
        description: `${e.description}${e.notes ? ` (${e.notes})` : ''}`,
        date: e.expenseDate,
      });
    }

    // Map Supplier Payments (Outflow)
    for (const sp of supplierPayments) {
      const t = tenderedColumns(sp.currency, sp.amountUzs, sp.amountUsd);
      txs.push({
        id: sp.id,
        type: 'OUTFLOW',
        source: 'SUPPLIER_PAYMENT',
        ref: sp.supplier?.name || 'Noma\'lum',
        amountUzs: toNumber(t.uzs),
        amountUsd: toNumber(t.usd),
        description: `Firmaga to'landi: ${sp.supplier?.name || ''}${sp.notes ? ` (${sp.notes})` : ''}`,
        date: sp.createdAt,
      });
    }

    // Sort by date desc
    txs.sort((a, b) => b.date.getTime() - a.date.getTime());

    return txs;
  }
}

