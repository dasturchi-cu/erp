import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { formatMoney } from '../../../../core/utils/money.util';
import { buildPaginationMeta, paginationSkip, parseSort } from '../../../../core/utils/pagination.util';
import { ReportQueryContext, ReportProviderResult } from '../report.types';

export function saleDateFilter(ctx: ReportQueryContext): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {
    companyId: ctx.companyId,
    status: { not: 'CANCELLED' },
    createdAt: { gte: ctx.dateFrom, lte: ctx.dateTo },
  };
  if (ctx.branchId) where.branchId = ctx.branchId;
  if (!ctx.canViewAllSales) where.cashierId = ctx.userId;
  return where;
}

export function sumDecimal(values: Decimal[]): Decimal {
  return values.reduce((acc, v) => acc.add(v), new Decimal(0));
}

export function moneyFields(
  uzs: Decimal | number | string,
  usd: Decimal | number | string,
  currency: 'UZS' | 'USD' | 'BOTH',
): Record<string, string> {
  if (currency === 'UZS') return { amountUzs: formatMoney(uzs) };
  if (currency === 'USD') return { amountUsd: formatMoney(usd) };
  return { amountUzs: formatMoney(uzs), amountUsd: formatMoney(usd) };
}

export function paginateRows<T extends Record<string, unknown>>(
  rows: T[],
  page: number,
  limit: number,
): { data: T[]; total: number } {
  const total = rows.length;
  const skip = paginationSkip(page, limit);
  return { data: rows.slice(skip, skip + limit), total };
}

export function applySearch<T extends Record<string, unknown>>(
  rows: T[],
  q: string | undefined,
  fields: string[],
): T[] {
  if (!q?.trim()) return rows;
  const needle = q.trim().toLowerCase();
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle)),
  );
}

export function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  sort: string | undefined,
  allowedFields: string[],
  defaultField: string,
): T[] {
  const sortFields = parseSort(sort, allowedFields, [{ field: defaultField, direction: 'desc' }]);
  const sorted = [...rows];
  sorted.sort((a, b) => {
    for (const { field, direction } of sortFields) {
      const av = a[field];
      const bv = b[field];
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
  return sorted;
}

export function buildReportResponse<T extends Record<string, unknown>>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  summary: Record<string, unknown>,
  totals: Record<string, unknown>,
  kpi: ReportProviderResult['kpi'],
) {
  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
    summary,
    totals,
    kpi,
  };
}
