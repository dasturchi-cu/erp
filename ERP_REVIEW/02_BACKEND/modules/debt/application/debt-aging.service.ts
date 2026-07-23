import { Injectable } from '@nestjs/common';
import {
  DebtHistoryType,
  Prisma,
  ReportExportFormat,
  SupplierDebtHistoryType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import {
  buildPaginationMeta,
  paginationSkip,
} from '../../../core/utils/pagination.util';
import { formatMoney } from '../../../core/utils/money.util';
import { exportReport } from '../../reports/application/export/report-exporter';
import {
  AgingBucketDto,
  AgingEntityRowDto,
  DebtAgingQueryDto,
  DebtAgingReportDto,
  DebtAgingResponseDto,
  DebtAgingSummaryDto,
} from '../api/dto/debt-aging.dto';
import {
  AGING_BUCKET_DEFS,
  ageDaysFrom,
  matchesBucketFilter,
  resolveAgingBucket,
} from './debt-aging.util';

interface AgingFilters {
  bucket?: string;
  q?: string;
  customerId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

interface InternalAgingRow {
  id: string;
  entityType: 'customer' | 'supplier';
  name: string;
  phone: string;
  debtUzs: Decimal;
  debtUsd: Decimal;
  ageDays: number;
  bucket: string;
  oldestCreditDate: Date | null;
}

@Injectable()
export class DebtAgingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getLegacyAging(companyId: string): Promise<DebtAgingResponseDto> {
    const summary = await this.getSummary(companyId, {});
    const customerBuckets = summary.customers.buckets.map((b) => ({
      label: b.label,
      debtUzs: b.debtUzs,
      debtUsd: b.debtUsd ?? '0',
      customerCount: b.entityCount,
    }));
    return {
      asOf: summary.asOf,
      buckets: customerBuckets,
      suppliers: summary.suppliers.buckets,
    };
  }

  async getSummary(
    companyId: string,
    query: Pick<DebtAgingQueryDto, 'q' | 'customerId' | 'supplierId' | 'asOf'>,
  ): Promise<DebtAgingSummaryDto> {
    const asOf = this.resolveAsOf(query.asOf);
    const customerRows = await this.buildCustomerRows(companyId, asOf, {
      q: query.q,
      customerId: query.customerId,
    });
    const supplierRows = await this.buildSupplierRows(companyId, asOf, {
      q: query.q,
      supplierId: query.supplierId,
    });

    return {
      asOf: asOf.toISOString(),
      customers: this.summarizeCustomers(customerRows),
      suppliers: this.summarizeSuppliers(supplierRows),
    };
  }

  async getCustomerAging(companyId: string, query: DebtAgingQueryDto) {
    const asOf = this.resolveAsOf(query.asOf);
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    let rows = await this.buildCustomerRows(companyId, asOf, query);
    if (query.bucket) {
      rows = rows.filter((r) => matchesBucketFilter(r.bucket, query.bucket));
    }
    const total = rows.length;
    const data = rows
      .slice(paginationSkip(page, limit), paginationSkip(page, limit) + limit)
      .map((r) => this.toDto(r));
    return {
      asOf: asOf.toISOString(),
      buckets: this.aggregateBuckets(rows, true),
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getSupplierAging(companyId: string, query: DebtAgingQueryDto) {
    const asOf = this.resolveAsOf(query.asOf);
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    let rows = await this.buildSupplierRows(companyId, asOf, query);
    if (query.bucket) {
      rows = rows.filter((r) => matchesBucketFilter(r.bucket, query.bucket));
    }
    const total = rows.length;
    const data = rows
      .slice(paginationSkip(page, limit), paginationSkip(page, limit) + limit)
      .map((r) => this.toDto(r));
    return {
      asOf: asOf.toISOString(),
      buckets: this.aggregateBuckets(rows, false),
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getReport(companyId: string, query: DebtAgingQueryDto): Promise<DebtAgingReportDto> {
    const asOf = this.resolveAsOf(query.asOf);
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const entityType = query.entityType ?? 'all';

    let rows: InternalAgingRow[] = [];
    if (entityType === 'customer' || entityType === 'all') {
      rows = rows.concat(await this.buildCustomerRows(companyId, asOf, query));
    }
    if (entityType === 'supplier' || entityType === 'all') {
      rows = rows.concat(await this.buildSupplierRows(companyId, asOf, query));
    }

    if (query.bucket) {
      rows = rows.filter((r) => matchesBucketFilter(r.bucket, query.bucket));
    }

    rows.sort((a, b) => b.ageDays - a.ageDays || a.name.localeCompare(b.name));

    const total = rows.length;
    const data = rows
      .slice(paginationSkip(page, limit), paginationSkip(page, limit) + limit)
      .map((r) => this.toDto(r));
    const summary = await this.getSummary(companyId, query);

    return {
      asOf: asOf.toISOString(),
      summary,
      buckets: this.aggregateBuckets(rows, entityType !== 'supplier'),
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async exportAging(
    companyId: string,
    userId: string,
    query: DebtAgingQueryDto & { format: ReportExportFormat },
    ip?: string,
    requestId?: string,
  ) {
    const report = await this.getReport(companyId, Object.assign(new DebtAgingQueryDto(), {
      ...query,
      page: 1,
      limit: 10000,
    }));
    const exported = await exportReport({
      title: 'Debt Aging Report',
      format: query.format,
      columns: [
        { header: 'Type', key: 'entityType' },
        { header: 'Name', key: 'name' },
        { header: 'Phone', key: 'phone' },
        { header: 'Debt UZS', key: 'debtUzs' },
        { header: 'Debt USD', key: 'debtUsd' },
        { header: 'Age Days', key: 'ageDays' },
        { header: 'Bucket', key: 'bucket' },
        { header: 'Oldest Credit', key: 'oldestCreditDate' },
      ],
      rows: report.data as unknown as Record<string, unknown>[],
      summary: report.summary as unknown as Record<string, unknown>,
      totals: {
        totalRows: report.meta.total,
        totalDebtUzs: report.summary.customers.totalDebtUzs,
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'EXPORT',
      entityType: 'debt_aging',
      newValue: {
        format: query.format,
        entityType: query.entityType ?? 'all',
        rowCount: report.meta.total,
      },
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });

    return {
      fileName: `debt_aging_${Date.now()}.${exported.extension}`,
      mimeType: exported.mimeType,
      buffer: exported.buffer,
    };
  }

  private resolveAsOf(asOf?: string): Date {
    if (!asOf) return new Date();
    const d = new Date(asOf);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private async buildCustomerRows(
    companyId: string,
    asOf: Date,
    filters: AgingFilters,
  ): Promise<InternalAgingRow[]> {
    const where: Prisma.CustomerWhereInput = {
      companyId,
      deletedAt: null,
      OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
    };
    if (filters.customerId) where.id = filters.customerId;
    if (filters.q) {
      where.AND = [
        {
          OR: [
            { name: { contains: filters.q, mode: 'insensitive' } },
            { phone: { contains: filters.q } },
          ],
        },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        totalDebtUzs: true,
        totalDebtUsd: true,
      },
    });

    if (customers.length === 0) return [];

    const oldestCredits = await this.prisma.debtHistory.groupBy({
      by: ['customerId'],
      where: {
        companyId,
        customerId: { in: customers.map((c) => c.id) },
        type: DebtHistoryType.sale_credit,
      },
      _min: { createdAt: true },
    });

    const creditMap = new Map(
      oldestCredits.map((r) => [r.customerId, r._min.createdAt]),
    );

    return customers.map((c) => {
      const oldest = creditMap.get(c.id) ?? null;
      const ageDays = oldest ? ageDaysFrom(asOf, oldest) : 0;
      return {
        id: c.id,
        entityType: 'customer' as const,
        name: c.name,
        phone: c.phone,
        debtUzs: c.totalDebtUzs,
        debtUsd: c.totalDebtUsd,
        ageDays,
        bucket: resolveAgingBucket(ageDays),
        oldestCreditDate: oldest,
      };
    });
  }

  private async buildSupplierRows(
    companyId: string,
    asOf: Date,
    filters: AgingFilters,
  ): Promise<InternalAgingRow[]> {
    const where: Prisma.SupplierWhereInput = {
      companyId,
      deletedAt: null,
      totalDebtUzs: { gt: 0 },
    };
    if (filters.supplierId) where.id = filters.supplierId;
    if (filters.q) {
      where.AND = [
        {
          OR: [
            { name: { contains: filters.q, mode: 'insensitive' } },
            { phone: { contains: filters.q } },
          ],
        },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      select: { id: true, name: true, phone: true, totalDebtUzs: true },
    });

    if (suppliers.length === 0) return [];

    const oldestCredits = await this.prisma.supplierDebtHistory.groupBy({
      by: ['supplierId'],
      where: {
        companyId,
        supplierId: { in: suppliers.map((s) => s.id) },
        type: SupplierDebtHistoryType.receipt_credit,
      },
      _min: { createdAt: true },
    });

    const creditMap = new Map(
      oldestCredits.map((r) => [r.supplierId, r._min.createdAt]),
    );

    return suppliers.map((s) => {
      const oldest = creditMap.get(s.id) ?? null;
      const ageDays = oldest ? ageDaysFrom(asOf, oldest) : 0;
      return {
        id: s.id,
        entityType: 'supplier' as const,
        name: s.name,
        phone: s.phone,
        debtUzs: s.totalDebtUzs,
        debtUsd: new Decimal(0),
        ageDays,
        bucket: resolveAgingBucket(ageDays),
        oldestCreditDate: oldest,
      };
    });
  }

  private toDto(row: InternalAgingRow): AgingEntityRowDto {
    return {
      id: row.id,
      entityType: row.entityType,
      name: row.name,
      phone: row.phone,
      debtUzs: formatMoney(row.debtUzs),
      debtUsd: formatMoney(row.debtUsd),
      ageDays: row.ageDays,
      bucket: row.bucket,
      oldestCreditDate: row.oldestCreditDate?.toISOString() ?? null,
    };
  }

  private aggregateBuckets(rows: InternalAgingRow[], includeUsd: boolean): AgingBucketDto[] {
    return AGING_BUCKET_DEFS.map((def) => {
      const matched = rows.filter((r) => r.bucket === def.label);
      const debtUzs = matched.reduce((sum, r) => sum.add(r.debtUzs), new Decimal(0));
      const debtUsd = includeUsd
        ? matched.reduce((sum, r) => sum.add(r.debtUsd), new Decimal(0))
        : undefined;
      return {
        label: def.label,
        debtUzs: formatMoney(debtUzs),
        debtUsd: debtUsd ? formatMoney(debtUsd) : undefined,
        entityCount: matched.length,
      };
    });
  }

  private summarizeCustomers(rows: InternalAgingRow[]): DebtAgingSummaryDto['customers'] {
    const debtUzs = rows.reduce((sum, r) => sum.add(r.debtUzs), new Decimal(0));
    const debtUsd = rows.reduce((sum, r) => sum.add(r.debtUsd), new Decimal(0));
    return {
      totalDebtUzs: formatMoney(debtUzs),
      totalDebtUsd: formatMoney(debtUsd),
      entityCount: rows.length,
      buckets: this.aggregateBuckets(rows, true),
    };
  }

  private summarizeSuppliers(rows: InternalAgingRow[]): DebtAgingSummaryDto['suppliers'] {
    const debtUzs = rows.reduce((sum, r) => sum.add(r.debtUzs), new Decimal(0));
    return {
      totalDebtUzs: formatMoney(debtUzs),
      entityCount: rows.length,
      buckets: this.aggregateBuckets(rows, false),
    };
  }
}
