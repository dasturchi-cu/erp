import { Injectable } from '@nestjs/common';
import { CustomerStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { formatMoney } from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
  toPrismaOrderBy,
} from '../../../core/utils/pagination.util';
import {
  CreateCustomerRequestDto,
  CustomerDebtsResponseDto,
  CustomerListQueryDto,
  CustomerResponseDto,
  CustomerSearchQueryDto,
  DebtHistoryEntryDto,
  DebtHistoryQueryDto,
  UpdateCustomerRequestDto,
} from '../api/dto/customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(companyId: string, query: CustomerListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.CustomerWhereInput = { companyId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const sort = parseSort(
      query.sort,
      ['name', 'createdAt', 'debtUzs', 'lastPurchaseAt'],
      [{ field: 'name', direction: 'asc' }],
    );

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: toPrismaOrderBy(sort),
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toCustomerResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async search(companyId: string, query: CustomerSearchQueryDto) {
    const rows = await this.prisma.customer.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    return { data: rows.map((row) => this.toCustomerResponse(row)) };
  }

  async getById(companyId: string, id: string): Promise<CustomerResponseDto> {
    const customer = await this.findCustomerOrThrow(companyId, id);
    return this.toCustomerResponse(customer);
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateCustomerRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<CustomerResponseDto> {
    const created = await this.prisma.customer.create({
      data: {
        companyId,
        name: dto.name.trim(),
        phone: dto.phone,
        phoneSecondary: dto.phoneSecondary ?? null,
        email: dto.email ?? null,
        address: dto.address ?? null,
        partnershipStartDate: dto.partnershipStartDate
          ? new Date(dto.partnershipStartDate)
          : null,
        notes: dto.notes ?? null,
        status: dto.status ?? CustomerStatus.ACTIVE,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'customer',
      entityId: created.id,
      newValue: { name: created.name, phone: created.phone },
      ipAddress: ip,
      requestId,
    });

    return this.toCustomerResponse(created);
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateCustomerRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<CustomerResponseDto> {
    const existing = await this.findCustomerOrThrow(companyId, id);

    const updated = await this.prisma.customer.update({
      where: { id, companyId },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone,
        phoneSecondary: dto.phoneSecondary === undefined ? undefined : dto.phoneSecondary,
        email: dto.email === undefined ? undefined : dto.email,
        address: dto.address === undefined ? undefined : dto.address,
        partnershipStartDate:
          dto.partnershipStartDate === undefined
            ? undefined
            : dto.partnershipStartDate
              ? new Date(dto.partnershipStartDate)
              : null,
        notes: dto.notes === undefined ? undefined : dto.notes,
        status: dto.status,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'customer',
      entityId: id,
      oldValue: { name: existing.name, phone: existing.phone, status: existing.status },
      newValue: { name: updated.name, phone: updated.phone, status: updated.status },
      ipAddress: ip,
      requestId,
    });

    return this.toCustomerResponse(updated);
  }

  async remove(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<void> {
    const existing = await this.findCustomerOrThrow(companyId, id);

    await this.prisma.customer.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: CustomerStatus.ARCHIVED },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'customer',
      entityId: id,
      oldValue: { name: existing.name, phone: existing.phone },
      ipAddress: ip,
      requestId,
    });
  }

  async getDebts(companyId: string, id: string): Promise<CustomerDebtsResponseDto> {
    const customer = await this.findCustomerOrThrow(companyId, id);
    return {
      customerId: customer.id,
      debtUzs: formatMoney(customer.totalDebtUzs),
      debtUsd: formatMoney(customer.totalDebtUsd),
      lastPaymentAt: customer.lastPaymentAt?.toISOString() ?? null,
    };
  }

  async getDebtHistory(companyId: string, id: string, query: DebtHistoryQueryDto) {
    await this.findCustomerOrThrow(companyId, id);

    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.DebtHistoryWhereInput = { companyId, customerId: id };

    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const sort = parseSort(query.sort, ['createdAt'], [{ field: 'createdAt', direction: 'desc' }]);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.debtHistory.count({ where }),
      this.prisma.debtHistory.findMany({
        where,
        include: { recorder: true },
        orderBy: toPrismaOrderBy(sort),
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    const data: DebtHistoryEntryDto[] = rows.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      type: row.type,
      amountUzs: formatMoney(row.amountUzs),
      amountUsd: formatMoney(row.amountUsd),
      balanceAfterUzs: formatMoney(row.balanceAfterUzs),
      balanceAfterUsd: formatMoney(row.balanceAfterUsd),
      reference: row.referenceLabel,
      createdAt: row.createdAt.toISOString(),
      recordedBy: `${row.recorder.firstName} ${row.recorder.lastName}`.trim(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  private async findCustomerOrThrow(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!customer) {
      throw AppException.notFound('Customer', id);
    }
    return customer;
  }

  private toCustomerResponse(customer: {
    id: string;
    name: string;
    phone: string;
    phoneSecondary: string | null;
    email: string | null;
    address: string | null;
    partnershipStartDate: Date | null;
    notes: string | null;
    status: CustomerStatus;
    totalDebtUzs: Prisma.Decimal;
    totalDebtUsd: Prisma.Decimal;
    totalPurchasesUzs: Prisma.Decimal;
    lastPurchaseAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      phoneSecondary: customer.phoneSecondary,
      email: customer.email,
      address: customer.address,
      partnershipStartDate: customer.partnershipStartDate
        ? customer.partnershipStartDate.toISOString().slice(0, 10)
        : null,
      notes: customer.notes,
      status: customer.status,
      debtUzs: formatMoney(customer.totalDebtUzs),
      debtUsd: formatMoney(customer.totalDebtUsd),
      totalPurchasesUzs: formatMoney(customer.totalPurchasesUzs),
      lastPurchaseAt: customer.lastPurchaseAt?.toISOString() ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
