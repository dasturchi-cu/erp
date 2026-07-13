import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateExpenseDto, ExpenseQueryDto } from './dto/expenses.dto';
import { AppException } from '../../core/exceptions/app.exception';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, userId: string, dto: CreateExpenseDto) {
    // 1. Get active exchange rate
    const rateRow = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: 'ACTIVE' },
    });
    const exchangeRate = rateRow ? Number(rateRow.rate) : 12620;

    let amountUzs: number;
    let amountUsd: number;

    if (dto.originalCurrency === 'UZS') {
      amountUzs = dto.amount;
      amountUsd = Number((dto.amount / exchangeRate).toFixed(4));
    } else {
      amountUsd = dto.amount;
      amountUzs = Math.round(dto.amount * exchangeRate);
    }

    return this.prisma.expense.create({
      data: {
        companyId,
        branchId: dto.branchId || null,
        category: dto.category,
        description: dto.description,
        originalCurrency: dto.originalCurrency,
        exchangeRateUsed: new Decimal(exchangeRate),
        amountUzs: new Decimal(amountUzs),
        amountUsd: new Decimal(amountUsd),
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
    const [salesAgg, customerPaymentsAgg, expensesAgg, supplierPaymentsAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { companyId, voidedAt: null },
        _sum: { amountPaidUzs: true, amountPaidUsd: true },
      }),
      this.prisma.debtPayment.aggregate({
        where: { companyId, reversedAt: null },
        _sum: { amountUzs: true, amountUsd: true },
      }),
      this.prisma.expense.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { amountUzs: true, amountUsd: true },
      }),
      this.prisma.supplierPayment.aggregate({
        where: { companyId },
        _sum: { amountUzs: true, amountUsd: true },
      }),
    ]);

    const salesUzs = salesAgg._sum.amountPaidUzs ? Number(salesAgg._sum.amountPaidUzs) : 0;
    const salesUsd = salesAgg._sum.amountPaidUsd ? Number(salesAgg._sum.amountPaidUsd) : 0;

    const customerUzs = customerPaymentsAgg._sum.amountUzs ? Number(customerPaymentsAgg._sum.amountUzs) : 0;
    const customerUsd = customerPaymentsAgg._sum.amountUsd ? Number(customerPaymentsAgg._sum.amountUsd) : 0;

    const expenseUzs = expensesAgg._sum.amountUzs ? Number(expensesAgg._sum.amountUzs) : 0;
    const expenseUsd = expensesAgg._sum.amountUsd ? Number(expensesAgg._sum.amountUsd) : 0;

    const supplierUzs = supplierPaymentsAgg._sum.amountUzs ? Number(supplierPaymentsAgg._sum.amountUzs) : 0;
    const supplierUsd = supplierPaymentsAgg._sum.amountUsd ? Number(supplierPaymentsAgg._sum.amountUsd) : 0;

    const balanceUzs = salesUzs + customerUzs - expenseUzs - supplierUzs;
    const balanceUsd = salesUsd + customerUsd - expenseUsd - supplierUsd;

    return {
      balanceUzs,
      balanceUsd,
      salesUzs,
      salesUsd,
      customerUzs,
      customerUsd,
      expenseUzs,
      expenseUsd,
      supplierUzs,
      supplierUsd,
    };
  }

  async getCashTransactions(companyId: string) {
    const [sales, customerPayments, expenses, supplierPayments] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          companyId,
          voidedAt: null,
          OR: [
            { amountPaidUzs: { gt: 0 } },
            { amountPaidUsd: { gt: 0 } },
          ],
        },
        select: {
          id: true,
          saleNumber: true,
          amountPaidUzs: true,
          amountPaidUsd: true,
          createdAt: true,
        },
      }),
      this.prisma.debtPayment.findMany({
        where: { companyId, reversedAt: null },
        select: {
          id: true,
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

    // Map Sales (Inflow)
    for (const s of sales) {
      txs.push({
        id: s.id,
        type: 'INFLOW',
        source: 'SALES',
        ref: s.saleNumber,
        amountUzs: Number(s.amountPaidUzs),
        amountUsd: Number(s.amountPaidUsd),
        description: 'Savdo tushumi',
        date: s.createdAt,
      });
    }

    // Map Customer Payments (Inflow)
    for (const p of customerPayments) {
      txs.push({
        id: p.id,
        type: 'INFLOW',
        source: 'CUSTOMER_PAYMENT',
        ref: p.customer?.name || 'Noma\'lum',
        amountUzs: Number(p.amountUzs),
        amountUsd: Number(p.amountUsd),
        description: `Mijozdan to'lov: ${p.customer?.name || ''}${p.notes ? ` (${p.notes})` : ''}`,
        date: p.createdAt,
      });
    }

    // Map Expenses (Outflow)
    for (const e of expenses) {
      txs.push({
        id: e.id,
        type: 'OUTFLOW',
        source: 'EXPENSE',
        ref: e.category,
        amountUzs: Number(e.amountUzs),
        amountUsd: Number(e.amountUsd),
        description: `${e.description}${e.notes ? ` (${e.notes})` : ''}`,
        date: e.expenseDate,
      });
    }

    // Map Supplier Payments (Outflow)
    for (const sp of supplierPayments) {
      txs.push({
        id: sp.id,
        type: 'OUTFLOW',
        source: 'SUPPLIER_PAYMENT',
        ref: sp.supplier?.name || 'Noma\'lum',
        amountUzs: Number(sp.amountUzs),
        amountUsd: Number(sp.amountUsd),
        description: `Firmaga to'landi: ${sp.supplier?.name || ''}${sp.notes ? ` (${sp.notes})` : ''}`,
        date: sp.createdAt,
      });
    }

    // Sort by date desc
    txs.sort((a, b) => b.date.getTime() - a.date.getTime());

    return txs;
  }
}
