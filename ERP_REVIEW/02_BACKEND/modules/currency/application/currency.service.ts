import { Injectable } from '@nestjs/common';
import { ExchangeRateStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  formatMoney,
  isPositiveMoney,
  parseMoney,
  uzsToUsd,
  usdToUzs,
} from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
  toPrismaOrderBy,
} from '../../../core/utils/pagination.util';
import {
  ConvertCurrencyRequestDto,
  ConvertCurrencyResponseDto,
  CurrencyCodeDto,
  CurrentRateResponseDto,
  ExchangeRateResponseDto,
  RateHistoryQueryDto,
  SetExchangeRateRequestDto,
} from '../api/dto/currency.dto';

@Injectable()
export class CurrencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCurrentRate(companyId: string): Promise<CurrentRateResponseDto> {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: ExchangeRateStatus.ACTIVE },
      include: { setter: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rate) {
      throw AppException.notFound('ExchangeRate');
    }

    return this.toCurrentRateResponse(rate);
  }

  async getActiveRateOrThrow(companyId: string) {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { companyId, status: ExchangeRateStatus.ACTIVE },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!rate) {
      throw AppException.businessRule('No active exchange rate configured');
    }
    return rate;
  }

  async listRates(companyId: string, query: RateHistoryQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.ExchangeRateWhereInput = { companyId };

    if (query.from || query.to) {
      where.effectiveFrom = {};
      if (query.from) {
        where.effectiveFrom.gte = new Date(query.from);
      }
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.effectiveFrom.lte = toDate;
      }
    }

    const sort = parseSort(query.sort, ['effectiveFrom'], [
      { field: 'effectiveFrom', direction: 'desc' },
    ]);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.exchangeRate.count({ where }),
      this.prisma.exchangeRate.findMany({
        where,
        include: { setter: true },
        orderBy: toPrismaOrderBy(sort),
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toExchangeRateResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async setRate(
    companyId: string,
    userId: string,
    dto: SetExchangeRateRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<ExchangeRateResponseDto> {
    const rateValue = parseMoney(dto.rate);
    if (!isPositiveMoney(rateValue)) {
      throw AppException.validation('Validation failed', [
        { field: 'rate', message: 'Rate must be greater than 0', code: 'INVALID_RATE' },
      ]);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const previous = await tx.exchangeRate.findFirst({
        where: { companyId, status: ExchangeRateStatus.ACTIVE },
      });

      if (previous) {
        await tx.exchangeRate.update({
          where: { id: previous.id, companyId },
          data: { status: ExchangeRateStatus.ARCHIVED },
        });
      }

      return tx.exchangeRate.create({
        data: {
          companyId,
          rate: rateValue,
          status: ExchangeRateStatus.ACTIVE,
          notes: dto.notes ?? null,
          setBy: userId,
        },
        include: { setter: true },
      });
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'exchange_rate',
      entityId: created.id,
      oldValue: undefined,
      newValue: {
        rate: formatMoney(created.rate),
        status: created.status,
        notes: created.notes,
      },
      ipAddress: ip,
      requestId,
    });

    return this.toExchangeRateResponse(created);
  }

  async convert(
    companyId: string,
    dto: ConvertCurrencyRequestDto,
  ): Promise<ConvertCurrencyResponseDto> {
    if (dto.fromCurrency === dto.toCurrency) {
      throw AppException.invalidCurrency('fromCurrency and toCurrency must differ');
    }

    const amount = parseMoney(dto.amount);
    const activeRate = await this.getActiveRateOrThrow(companyId);
    const rate = activeRate.rate;

    let convertedAmount;
    if (dto.fromCurrency === CurrencyCodeDto.UZS && dto.toCurrency === CurrencyCodeDto.USD) {
      convertedAmount = uzsToUsd(amount, rate);
    } else if (dto.fromCurrency === CurrencyCodeDto.USD && dto.toCurrency === CurrencyCodeDto.UZS) {
      convertedAmount = usdToUzs(amount, rate);
    } else {
      throw AppException.invalidCurrency();
    }

    return {
      amount: formatMoney(amount),
      fromCurrency: dto.fromCurrency,
      convertedAmount: formatMoney(convertedAmount),
      toCurrency: dto.toCurrency,
      rateUsed: formatMoney(rate),
    };
  }

  private toCurrentRateResponse(rate: {
    id: string;
    rate: Prisma.Decimal;
    effectiveFrom: Date;
    status: ExchangeRateStatus;
    setter: { firstName: string; lastName: string };
  }): CurrentRateResponseDto {
    return {
      id: rate.id,
      rate: formatMoney(rate.rate),
      effectiveFrom: rate.effectiveFrom.toISOString(),
      setBy: `${rate.setter.firstName} ${rate.setter.lastName}`.trim(),
      status: rate.status,
    };
  }

  private toExchangeRateResponse(rate: {
    id: string;
    rate: Prisma.Decimal;
    effectiveFrom: Date;
    status: ExchangeRateStatus;
    notes: string | null;
    createdAt: Date;
    setter: { firstName: string; lastName: string };
  }): ExchangeRateResponseDto {
    return {
      id: rate.id,
      rate: formatMoney(rate.rate),
      effectiveFrom: rate.effectiveFrom.toISOString(),
      setBy: `${rate.setter.firstName} ${rate.setter.lastName}`.trim(),
      status: rate.status,
      notes: rate.notes,
      createdAt: rate.createdAt.toISOString(),
    };
  }
}
