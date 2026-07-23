import { ReportExportFormat, ReportPeriod } from '@prisma/client';

export interface ReportKpi {
  id: string;
  label: string;
  value: string;
  change?: number;
  period?: string;
}

export interface ReportQueryContext {
  companyId: string;
  userId: string;
  template: string;
  period?: ReportPeriod;
  dateFrom: Date;
  dateTo: Date;
  branchId?: string;
  warehouseId?: string;
  currency: 'UZS' | 'USD' | 'BOTH';
  page: number;
  limit: number;
  sort?: string;
  q?: string;
  canViewAllSales: boolean;
}

export interface ReportProviderResult {
  data: Record<string, unknown>[];
  total: number;
  summary: Record<string, unknown>;
  totals: Record<string, unknown>;
  kpi: ReportKpi[];
}

export interface ReportCatalogEntry {
  id: string;
  template: string;
  category: string;
  categoryCode: string;
  name: string;
  description: string;
  permission: string;
}

export interface GenerateReportInput {
  template: string;
  category: string;
  format: ReportExportFormat;
  period?: ReportPeriod;
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  warehouseId?: string;
  currency?: 'UZS' | 'USD' | 'BOTH';
  q?: string;
  sort?: string;
}

export interface ReportJobResponse {
  id: string;
  status: string;
  progress: number;
  template: string;
  category: string;
  format: string;
  rowCount?: number;
  fileName?: string;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}
