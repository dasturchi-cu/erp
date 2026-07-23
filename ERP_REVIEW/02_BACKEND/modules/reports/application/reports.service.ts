import { Injectable } from '@nestjs/common';
import { ReportPeriod } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { buildPaginationMeta, paginationSkip } from '../../../core/utils/pagination.util';
import { AuditService } from '../../../core/audit/audit.service';
import {
  CATEGORY_PERMISSION_MAP,
  findCatalogEntry,
  REPORT_CATALOG,
} from './report-catalog';
import { resolveReportPeriod } from './report-period.util';
import { ReportExportService } from './report-export.service';
import { GenerateReportInput, ReportQueryContext } from './report.types';
import { SalesReportProvider } from './providers/sales-report.provider';
import { ProductReportProvider } from './providers/product-report.provider';
import { InventoryReportProvider } from './providers/inventory-report.provider';
import { CustomerReportProvider } from './providers/customer-report.provider';
import { SupplierReportProvider } from './providers/supplier-report.provider';
import { DebtReportProvider } from './providers/debt-report.provider';
import { ExpenseReportProvider } from './providers/expense-report.provider';
import { ProfitReportProvider } from './providers/profit-report.provider';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly exportService: ReportExportService,
    private readonly salesProvider: SalesReportProvider,
    private readonly productProvider: ProductReportProvider,
    private readonly inventoryProvider: InventoryReportProvider,
    private readonly customerProvider: CustomerReportProvider,
    private readonly supplierProvider: SupplierReportProvider,
    private readonly debtProvider: DebtReportProvider,
    private readonly expenseProvider: ExpenseReportProvider,
    private readonly profitProvider: ProfitReportProvider,
  ) {}

  async getCatalog(
    companyId: string,
    params: { page: number; limit: number; q?: string; category?: string; sort?: string },
  ) {
    let entries = [...REPORT_CATALOG];

    if (params.category && params.category !== 'all') {
      entries = entries.filter(
        (e) => e.category === params.category || e.categoryCode === params.category,
      );
    }

    if (params.q?.trim()) {
      const needle = params.q.trim().toLowerCase();
      entries = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(needle) ||
          e.category.toLowerCase().includes(needle) ||
          e.description.toLowerCase().includes(needle),
      );
    }

    const lastJobs = await this.prisma.reportJob.findMany({
      where: { companyId, status: 'COMPLETED' },
      orderBy: [{ category: 'asc' }, { template: 'asc' }, { completedAt: 'desc' }],
      distinct: ['category', 'template'],
      select: { template: true, category: true, completedAt: true },
    });
    const lastMap = new Map(lastJobs.map((j) => [`${j.category}:${j.template}`, j.completedAt]));

    const items = entries.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      description: e.description,
      lastGenerated: lastMap.get(`${e.categoryCode}:${e.template}`)?.toISOString(),
    }));

    if (params.sort) {
      const [field, dir] = params.sort.split(':');
      items.sort((a, b) => {
        const av = String((a as Record<string, unknown>)[field] ?? '');
        const bv = String((b as Record<string, unknown>)[field] ?? '');
        const cmp = av.localeCompare(bv);
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    const total = items.length;
    const skip = paginationSkip(params.page, params.limit);
    const data = items.slice(skip, skip + params.limit);

    return { data, meta: buildPaginationMeta(params.page, params.limit, total) };
  }

  async runCategoryReport(
    category: string,
    userId: string,
    companyId: string,
    permissions: string[],
    query: {
      template?: string;
      period?: ReportPeriod;
      date_from?: string;
      date_to?: string;
      branch_id?: string;
      warehouse_id?: string;
      currency?: 'UZS' | 'USD' | 'BOTH';
      page?: number;
      limit?: number;
      sort?: string;
      q?: string;
    },
    canViewAllSales: boolean,
  ) {
    const template = query.template ?? this.defaultTemplate(category);
    this.assertCategoryAccess(category, permissions);

    const entry = findCatalogEntry(category, template);
    if (!entry) {
      throw AppException.validation('Invalid report template', [
        { field: 'template', message: `Unknown template for ${category}`, code: 'INVALID_TEMPLATE' },
      ]);
    }

    const { dateFrom, dateTo, period } = resolveReportPeriod(
      query.period,
      query.date_from,
      query.date_to,
    );

    const ctx: ReportQueryContext = {
      companyId,
      userId,
      template,
      period,
      dateFrom,
      dateTo,
      branchId: query.branch_id,
      warehouseId: query.warehouse_id,
      currency: query.currency ?? 'BOTH',
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: query.sort,
      q: query.q,
      canViewAllSales,
    };

    const result = await this.executeProvider(category, ctx);

    return {
      data: result.data,
      meta: buildPaginationMeta(ctx.page, ctx.limit, result.total),
      summary: result.summary,
      totals: result.totals,
      kpi: result.kpi,
    };
  }

  async generate(
    companyId: string,
    userId: string,
    permissions: string[],
    dto: GenerateReportInput,
    canViewAllSales: boolean,
    ip?: string,
    requestId?: string,
  ) {
    this.assertCategoryAccess(dto.category, permissions);

    const entry = findCatalogEntry(dto.category, dto.template);
    if (!entry) {
      throw AppException.validation('Invalid report template', [
        { field: 'template', message: 'Unknown template', code: 'INVALID_TEMPLATE' },
      ]);
    }

    const { dateFrom, dateTo, period } = resolveReportPeriod(dto.period, dto.dateFrom, dto.dateTo);

    const ctx: ReportQueryContext = {
      companyId,
      userId,
      template: dto.template,
      period,
      dateFrom,
      dateTo,
      branchId: dto.branchId,
      warehouseId: dto.warehouseId,
      currency: dto.currency ?? 'BOTH',
      page: 1,
      limit: 100000,
      sort: dto.sort,
      q: dto.q,
      canViewAllSales,
    };

    const result = await this.executeProvider(dto.category, ctx);

    return this.exportService.generate(
      companyId,
      userId,
      {
        template: dto.template,
        category: dto.category,
        format: dto.format,
        period: dto.period,
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        currency: dto.currency,
        q: dto.q,
        sort: dto.sort,
      },
      result,
      ip,
      requestId,
    );
  }

  getJob(companyId: string, jobId: string) {
    return this.exportService.getJob(companyId, jobId);
  }

  getDownload(companyId: string, userId: string, jobId: string, ip?: string, requestId?: string) {
    return this.exportService.getDownload(companyId, userId, jobId, ip, requestId);
  }

  getHistory(companyId: string, userId: string, page: number, limit: number) {
    return this.exportService.listHistory(companyId, userId, page, limit);
  }

  async getCogs(
    companyId: string,
    userId: string,
    permissions: string[],
    query: Record<string, unknown>,
    canViewAllSales: boolean,
  ) {
    return this.runCategoryReport(
      'profit',
      userId,
      companyId,
      permissions,
      { ...query, template: 'cogs_detail' } as never,
      canViewAllSales,
    );
  }

  private async executeProvider(category: string, ctx: ReportQueryContext) {
    switch (category) {
      case 'sales':
        return this.salesProvider.run(ctx);
      case 'products':
        return this.productProvider.run(ctx);
      case 'inventory':
        return this.inventoryProvider.run(ctx);
      case 'customers':
        return this.customerProvider.run(ctx);
      case 'suppliers':
        return this.supplierProvider.run(ctx);
      case 'debt':
        return this.debtProvider.run(ctx);
      case 'expenses':
        return this.expenseProvider.run(ctx);
      case 'profit':
        return this.profitProvider.run(ctx);
      default:
        throw AppException.validation('Invalid category', [
          { field: 'category', message: 'Unknown report category', code: 'INVALID_CATEGORY' },
        ]);
    }
  }

  private defaultTemplate(category: string): string {
    const defaults: Record<string, string> = {
      sales: 'daily_summary',
      products: 'turnover',
      inventory: 'stock_level',
      customers: 'summary',
      suppliers: 'summary',
      debt: 'summary',
      expenses: 'by_category',
      profit: 'gross_profit',
    };
    return defaults[category] ?? 'summary';
  }

  private assertCategoryAccess(category: string, permissions: string[]): void {
    const required = CATEGORY_PERMISSION_MAP[category] ?? 'reports.view';
    const hasAccess =
      permissions.includes(required) ||
      permissions.includes('admin.*') ||
      permissions.includes('reports.*') ||
      permissions.includes(required.replace(/\.[^.]+$/, '.*'));

    if (!hasAccess && !permissions.includes('reports.view')) {
      throw AppException.forbidden('PERMISSION_DENIED', `Missing permission: ${required}`);
    }
  }
}
