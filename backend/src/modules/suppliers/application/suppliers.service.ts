import { Injectable } from '@nestjs/common';
import { Prisma, SupplierStatus, OriginalCurrency } from '@prisma/client';
import { CurrencyService } from '../../currency/application/currency.service';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { formatMoney, parseMoney } from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
  toPrismaOrderBy,
} from '../../../core/utils/pagination.util';
import {
  CreateSupplierPaymentRequestDto,
  CreateSupplierRequestDto,
  SupplierDebtHistoryEntryDto,
  SupplierListQueryDto,
  SupplierPaymentListQueryDto,
  SupplierPaymentResponseDto,
  SupplierReceiptListQueryDto,
  SupplierReceiptResponseDto,
  SupplierResponseDto,
  SupplierSearchQueryDto,
  SupplierSummaryResponseDto,
  UpdateSupplierRequestDto,
} from '../api/dto/suppliers.dto';
import { SupplierDebtService } from './supplier-debt.service';

function periodDateRange(period: 'day' | 'month' | 'year'): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (period === 'month') {
    from.setDate(1);
  } else if (period === 'year') {
    from.setMonth(0, 1);
  }

  return { from, to };
}

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly supplierDebt: SupplierDebtService,
    private readonly currencyService: CurrencyService,
  ) {}

  async list(companyId: string, query: SupplierListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SupplierWhereInput = { companyId };

    if (query.status) {
      where.status = query.status;
      if (query.status === SupplierStatus.ACTIVE) {
        where.deletedAt = null;
      }
    }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
        { contactPerson: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const sort = parseSort(query.sort, ['name', 'createdAt', 'totalDebtUzs'], [
      { field: 'name', direction: 'asc' },
    ]);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({
        where,
        orderBy: toPrismaOrderBy(sort),
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toSupplierResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async search(companyId: string, query: SupplierSearchQueryDto) {
    const rows = await this.prisma.supplier.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: SupplierStatus.ACTIVE,
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return { data: rows.map((row) => this.toSupplierResponse(row)) };
  }

  async getSummary(companyId: string): Promise<SupplierSummaryResponseDto> {
    const [supplierCount, aggregates, topSupplier, recentRows] = await Promise.all([
      this.prisma.supplier.count({
        where: { companyId, deletedAt: null, status: SupplierStatus.ACTIVE },
      }),
      this.prisma.supplier.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalDebtUzs: true, totalDebtUsd: true, totalPaidUzs: true, totalPaidUsd: true },
      }),
      this.prisma.supplier.findFirst({
        where: { companyId, deletedAt: null, status: SupplierStatus.ACTIVE },
        orderBy: { totalDebtUzs: 'desc' },
      }),
      this.prisma.supplierPayment.findMany({
        where: { companyId },
        include: { supplier: true, recorder: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalDebtUzs = aggregates._sum.totalDebtUzs ?? new Decimal(0);
    const totalDebtUsd = aggregates._sum.totalDebtUsd ?? new Decimal(0);
    const totalPaidUzs = aggregates._sum.totalPaidUzs ?? new Decimal(0);
    const totalPaidUsd = aggregates._sum.totalPaidUsd ?? new Decimal(0);

    return {
      supplierCount,
      totalDebtUzs: formatMoney(totalDebtUzs),
      totalDebtUsd: formatMoney(totalDebtUsd),
      totalPaidUzs: formatMoney(totalPaidUzs),
      totalPaidUsd: formatMoney(totalPaidUsd),
      remainingDebtUzs: formatMoney(totalDebtUzs.sub(totalPaidUzs)),
      remainingDebtUsd: formatMoney(totalDebtUsd.sub(totalPaidUsd)),
      topSupplierName: topSupplier?.name ?? null,
      topSupplierDebtUzs: topSupplier
        ? formatMoney(topSupplier.totalDebtUzs.sub(topSupplier.totalPaidUzs))
        : '0',
      recentPayments: recentRows.map((row) => this.toPaymentResponse(row as any)),
    };
  }

  async listPayments(companyId: string, query: SupplierPaymentListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SupplierPaymentWhereInput = { companyId };
    if (query.supplierId) where.supplierId = query.supplierId;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplierPayment.count({ where }),
      this.prisma.supplierPayment.findMany({
        where,
        include: { supplier: true, recorder: true },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toPaymentResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(companyId: string, id: string): Promise<SupplierResponseDto> {
    const supplier = await this.findSupplierOrThrow(companyId, id);
    return this.toSupplierResponse(supplier);
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateSupplierRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SupplierResponseDto> {
    const created = await this.prisma.supplier.create({
      data: {
        companyId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        contactPerson: dto.contactPerson?.trim() ?? null,
        notes: dto.notes ?? null,
        status: SupplierStatus.ACTIVE,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'supplier',
      entityId: created.id,
      newValue: { name: created.name, phone: created.phone },
      ipAddress: ip,
      requestId,
    });

    return this.toSupplierResponse(created);
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateSupplierRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SupplierResponseDto> {
    const existing = await this.findSupplierOrThrow(companyId, id);

    const updated = await this.prisma.supplier.update({
      where: { id, companyId },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone?.trim(),
        contactPerson: dto.contactPerson === undefined ? undefined : dto.contactPerson,
        notes: dto.notes === undefined ? undefined : dto.notes,
        status: dto.status,
        deletedAt: dto.status === SupplierStatus.ARCHIVED ? new Date() : dto.status === SupplierStatus.ACTIVE ? null : undefined,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'supplier',
      entityId: id,
      oldValue: { name: existing.name, status: existing.status },
      newValue: { name: updated.name, status: updated.status },
      ipAddress: ip,
      requestId,
    });

    return this.toSupplierResponse(updated);
  }

  async archive(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<SupplierResponseDto> {
    return this.update(
      companyId,
      id,
      userId,
      { status: SupplierStatus.ARCHIVED },
      ip,
      requestId,
    );
  }

  async restore(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
    });
    if (!supplier) {
      throw AppException.notFound('Supplier', id);
    }

    const updated = await this.prisma.supplier.update({
      where: { id, companyId },
      data: { status: SupplierStatus.ACTIVE, deletedAt: null },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'supplier',
      entityId: id,
      newValue: { status: SupplierStatus.ACTIVE },
      ipAddress: ip,
      requestId,
    });

    return this.toSupplierResponse(updated);
  }

  async getReceipts(companyId: string, id: string, query: SupplierReceiptListQueryDto) {
    await this.findSupplierOrThrow(companyId, id);

    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SupplierReceiptWhereInput = { companyId, supplierId: id };

    if (query.period) {
      const range = periodDateRange(query.period);
      where.createdAt = { gte: range.from, lte: range.to };
    } else if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplierReceipt.count({ where }),
      this.prisma.supplierReceipt.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    const data: SupplierReceiptResponseDto[] = rows.map((row) => ({
      id: row.id,
      supplierId: row.supplierId,
      productId: row.productId,
      productName: row.product.name,
      sku: row.product.sku,
      quantity: formatMoney(row.quantity),
      unitCostUzs: formatMoney(row.unitCostUzs),
      totalCostUzs: formatMoney(row.totalCostUzs),
      paymentType: row.paymentType,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async getDebtHistory(companyId: string, id: string, query: SupplierReceiptListQueryDto) {
    await this.findSupplierOrThrow(companyId, id);

    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SupplierDebtHistoryWhereInput = { companyId, supplierId: id };

    if (query.period) {
      const range = periodDateRange(query.period);
      where.createdAt = { gte: range.from, lte: range.to };
    } else if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supplierDebtHistory.count({ where }),
      this.prisma.supplierDebtHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    const userIds = [...new Set(rows.map((r) => r.recordedBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));

    const data: SupplierDebtHistoryEntryDto[] = rows.map((row) => ({
      id: row.id,
      type: row.type,
      amountUzs: formatMoney(row.amountUzs),
      balanceAfterUzs: formatMoney(row.balanceAfterUzs),
      amountUsd: formatMoney(row.amountUsd),
      balanceAfterUsd: formatMoney(row.balanceAfterUsd),
      reference: row.reference,
      createdAt: row.createdAt.toISOString(),
      recordedBy: userMap.get(row.recordedBy) ?? row.recordedBy,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async recordPayment(
    companyId: string,
    supplierId: string,
    userId: string,
    dto: CreateSupplierPaymentRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SupplierPaymentResponseDto> {
    await this.findSupplierOrThrow(companyId, supplierId);
    const amount = parseMoney(dto.amount);
    this.supplierDebt.validatePaymentAmount(amount);

    const rate = await this.currencyService.getActiveRateOrThrow(companyId);
    const exchangeRate = rate.rate;

    const amountUzs = dto.currency === OriginalCurrency.UZS ? amount : amount.mul(exchangeRate);
    const amountUsd = dto.currency === OriginalCurrency.USD ? amount : amount.div(exchangeRate);

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierPayment.create({
        data: {
          companyId,
          supplierId,
          amount,
          currency: dto.currency,
          amountUzs,
          amountUsd,
          exchangeRateUsed: exchangeRate,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes ?? null,
          recordedBy: userId,
        },
        include: { supplier: true, recorder: true },
      });

      await this.supplierDebt.applyPayment(companyId, supplierId, amount, dto.currency, exchangeRate, userId, created.id, tx);
      return created;
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'supplier_payment',
      entityId: payment.id,
      newValue: { 
        supplierId, 
        amount: formatMoney(amount), 
        currency: dto.currency, 
        exchangeRateUsed: formatMoney(exchangeRate),
        amountUzs: formatMoney(amountUzs),
        amountUsd: formatMoney(amountUsd)
      },
      ipAddress: ip,
      requestId,
    });

    return this.toPaymentResponse(payment as any);
  }

  async listDebtsForExport(companyId: string) {
    const rows = await this.prisma.supplier.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return rows.map((row) => ({
      name: row.name,
      phone: row.phone,
      contactPerson: row.contactPerson ?? '',
      totalDebtUzs: formatMoney(row.totalDebtUzs),
      totalPaidUzs: formatMoney(row.totalPaidUzs),
      remainingDebtUzs: formatMoney(row.totalDebtUzs.sub(row.totalPaidUzs)),
      status: row.status,
    }));
  }

  private async findSupplierOrThrow(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
    });
    if (!supplier) {
      throw AppException.notFound('Supplier', id);
    }
    return supplier;
  }

  private toSupplierResponse(supplier: {
    id: string;
    name: string;
    phone: string;
    contactPerson: string | null;
    notes: string | null;
    status: SupplierStatus;
    totalDebtUzs: Prisma.Decimal;
    totalDebtUsd: Prisma.Decimal;
    totalPaidUzs: Prisma.Decimal;
    totalPaidUsd: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }): SupplierResponseDto {
    return {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      contactPerson: supplier.contactPerson,
      notes: supplier.notes,
      status: supplier.status,
      totalDebtUzs: formatMoney(supplier.totalDebtUzs),
      totalDebtUsd: formatMoney(supplier.totalDebtUsd),
      totalPaidUzs: formatMoney(supplier.totalPaidUzs),
      totalPaidUsd: formatMoney(supplier.totalPaidUsd),
      remainingDebtUzs: formatMoney(supplier.totalDebtUzs.sub(supplier.totalPaidUzs)),
      remainingDebtUsd: formatMoney(supplier.totalDebtUsd.sub(supplier.totalPaidUsd)),
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }

  private toPaymentResponse(row: {
    id: string;
    supplierId: string;
    amount: Prisma.Decimal;
    currency: OriginalCurrency;
    amountUzs: Prisma.Decimal;
    amountUsd: Prisma.Decimal;
    exchangeRateUsed: Prisma.Decimal;
    paymentMethod: string;
    notes: string | null;
    createdAt: Date;
    supplier: { name: string };
    recorder: { firstName: string; lastName: string };
  }): SupplierPaymentResponseDto {
    return {
      id: row.id,
      supplierId: row.supplierId,
      supplierName: row.supplier.name,
      amount: formatMoney(row.amount),
      currency: row.currency,
      amountUzs: formatMoney(row.amountUzs),
      amountUsd: formatMoney(row.amountUsd),
      exchangeRateUsed: formatMoney(row.exchangeRateUsed),
      paymentMethod: row.paymentMethod,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      recordedBy: `${row.recorder.firstName} ${row.recorder.lastName}`.trim(),
    };
  }
}
