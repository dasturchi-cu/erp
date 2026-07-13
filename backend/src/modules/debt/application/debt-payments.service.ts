import { Injectable } from '@nestjs/common';
import { OriginalCurrency, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { IdempotencyService } from '../../../core/idempotency/idempotency.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  formatMoney,
  isPositiveMoney,
  parseMoney,
  usdToUzs,
  uzsToUsd,
} from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
} from '../../../core/utils/pagination.util';
import { CurrencyService } from '../../currency/application/currency.service';
import { DebtService } from '../application/debt.service';
import {
  CreateDebtPaymentRequestDto,
  CustomerDebtListItemDto,
  DebtPaymentListQueryDto,
  DebtPaymentResponseDto,
  DebtSummaryResponseDto,
  ReverseDebtPaymentRequestDto,
} from '../api/dto/debt.dto';

type PaymentWithRelations = Prisma.DebtPaymentGetPayload<{
  include: { customer: true; receiver: true };
}>;

@Injectable()
export class DebtPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly currencyService: CurrencyService,
    private readonly debtService: DebtService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async list(companyId: string, query: DebtPaymentListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.DebtPaymentWhereInput = { companyId, reversedAt: null };

    if (query.customerId) where.customerId = query.customerId;
    if (query.currency) where.currency = query.currency;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const sort = parseSort(query.sort, ['createdAt'], [
      { field: 'createdAt', direction: 'desc' },
    ]);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.debtPayment.count({ where }),
      this.prisma.debtPayment.findMany({
        where,
        include: { customer: true, receiver: true },
        orderBy: [{ createdAt: sort[0]?.direction ?? 'desc' }],
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toPaymentResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateDebtPaymentRequestDto,
    idempotencyKey: string,
    ip?: string,
    requestId?: string,
  ): Promise<DebtPaymentResponseDto> {
    const endpoint = 'POST /debt-payments';
    const requestHash = this.idempotency.hashRequest(dto);

    const result = await this.idempotency.execute({
      companyId,
      key: idempotencyKey,
      endpoint,
      requestHash,
      handler: async () => {
        const body = await this.executeCreatePayment(companyId, userId, dto, ip, requestId);
        return { status: 201, body };
      },
    });

    return result.body;
  }

  async reverse(
    companyId: string,
    userId: string,
    paymentId: string,
    dto: ReverseDebtPaymentRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<DebtPaymentResponseDto> {
    const payment = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.debtPayment.findFirst({
        where: { id: paymentId, companyId },
      });
      if (!existing) {
        throw AppException.notFound('DebtPayment', paymentId);
      }
      if (existing.reversedAt) {
        throw AppException.businessRule('Payment already reversed');
      }

      await this.debtService.reversePayment(tx, {
        companyId,
        customerId: existing.customerId,
        amount: existing.amount,
        currency: existing.currency,
        exchangeRate: existing.exchangeRateUsed,
        referenceType: 'debt_payment_reverse',
        referenceId: existing.id,
        referenceLabel: `reverse:${existing.id}`,
        recordedBy: userId,
      });

      return tx.debtPayment.update({
        where: { id: paymentId, companyId },
        data: {
          reversedAt: new Date(),
          reversalReason: dto.reason ?? null,
        },
        include: { customer: true, receiver: true },
      });
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'debt_payment_reverse',
      entityId: paymentId,
      newValue: { reversed: true, reason: dto.reason ?? null },
      ipAddress: ip,
      requestId,
    });

    return this.toPaymentResponse(payment);
  }

  async getSummary(companyId: string): Promise<DebtSummaryResponseDto> {
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
      },
    });

    const activeRate = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { effectiveFrom: 'desc' },
    });
    const rate = activeRate?.rate ?? new Decimal(12620);

    const totalDebtUzs = customers.reduce(
      (sum, c) => sum.add(c.totalDebtUzs),
      new Decimal(0),
    );
    const totalDebtUsd = totalDebtUzs.div(rate);

    const now = Date.now();
    const overdueMs = 30 * 24 * 60 * 60 * 1000;
    const overdueCustomerCount = customers.filter((c) => {
      const referenceDate = c.lastPaymentAt ?? c.lastPurchaseAt ?? c.createdAt;
      return now - referenceDate.getTime() > overdueMs;
    }).length;

    return {
      totalDebtUzs: formatMoney(totalDebtUzs),
      totalDebtUsd: formatMoney(totalDebtUsd),
      customerCount: customers.length,
      overdueCustomerCount,
    };
  }

  async listDebtCustomers(companyId: string, page: number, limit: number) {
    const where: Prisma.CustomerWhereInput = {
      companyId,
      deletedAt: null,
      OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
    };

    const activeRate = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { effectiveFrom: 'desc' },
    });
    const rate = activeRate?.rate ?? new Decimal(12620);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: [{ totalDebtUzs: 'desc' }],
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    const data: CustomerDebtListItemDto[] = rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      debtUzs: formatMoney(c.totalDebtUzs),
      debtUsd: formatMoney(c.totalDebtUzs.div(rate)),
      lastPurchaseAt: c.lastPurchaseAt?.toISOString() ?? null,
      lastPaymentAt: c.lastPaymentAt?.toISOString() ?? null,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  private async executeCreatePayment(
    companyId: string,
    userId: string,
    dto: CreateDebtPaymentRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<DebtPaymentResponseDto> {
    const amount = parseMoney(dto.amount);
    if (!isPositiveMoney(amount)) {
      throw AppException.validation('Validation failed', [
        { field: 'amount', message: 'Amount must be > 0', code: 'INVALID_AMOUNT' },
      ]);
    }

    const activeRate = await this.currencyService.getActiveRateOrThrow(companyId);
    const exchangeRate = activeRate.rate;

    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM customers
        WHERE id = ${dto.customerId}::uuid AND company_id = ${companyId}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `;
      const customer = await tx.customer.findFirst({
        where: { id: dto.customerId, companyId, deletedAt: null },
      });
      if (!customer) {
        throw AppException.notFound('Customer', dto.customerId);
      }

      if (dto.currency === OriginalCurrency.UZS && customer.totalDebtUzs.lt(amount)) {
        throw AppException.businessRule('Payment exceeds UZS debt balance', {
          debtUzs: formatMoney(customer.totalDebtUzs),
          amount: formatMoney(amount),
        });
      }
      if (dto.currency === OriginalCurrency.USD && customer.totalDebtUsd.lt(amount)) {
        throw AppException.businessRule('Payment exceeds USD debt balance', {
          debtUsd: formatMoney(customer.totalDebtUsd),
          amount: formatMoney(amount),
        });
      }

      const amountUzs =
        dto.currency === OriginalCurrency.UZS ? amount : usdToUzs(amount, exchangeRate);
      const amountUsd =
        dto.currency === OriginalCurrency.USD ? amount : uzsToUsd(amount, exchangeRate);

      const created = await tx.debtPayment.create({
        data: {
          companyId,
          customerId: dto.customerId,
          amount,
          currency: dto.currency,
          amountUzs,
          amountUsd,
          exchangeRateUsed: exchangeRate,
          paymentType: dto.paymentType,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes ?? null,
          receivedBy: userId,
        },
      });

      await this.debtService.applyPayment(tx, {
        companyId,
        customerId: dto.customerId,
        amount,
        currency: dto.currency,
        exchangeRate,
        referenceType: 'debt_payment',
        referenceId: created.id,
        referenceLabel: created.id,
        recordedBy: userId,
      });

      return tx.debtPayment.findFirstOrThrow({
        where: { id: created.id },
        include: { customer: true, receiver: true },
      });
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'debt_payment',
      entityId: payment.id,
      newValue: {
        customerId: dto.customerId,
        amount: formatMoney(amount),
        currency: dto.currency,
      },
      ipAddress: ip,
      requestId,
    });

    return this.toPaymentResponse(payment);
  }

  private toPaymentResponse(payment: PaymentWithRelations): DebtPaymentResponseDto {
    return {
      id: payment.id,
      customerId: payment.customerId,
      customerName: payment.customer.name,
      amount: formatMoney(payment.amount),
      currency: payment.currency,
      amountUzs: formatMoney(payment.amountUzs),
      amountUsd: formatMoney(payment.amountUsd),
      exchangeRateUsed: formatMoney(payment.exchangeRateUsed),
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt.toISOString(),
      recordedBy: `${payment.receiver.firstName} ${payment.receiver.lastName}`.trim(),
      notes: payment.notes,
    };
  }
}
