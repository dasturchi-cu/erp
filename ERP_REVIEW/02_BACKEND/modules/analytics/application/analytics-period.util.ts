import { ReportPeriod } from '@prisma/client';
import { AppException } from '../../../core/exceptions/app.exception';

export interface ResolvedAnalyticsPeriod {
  dateFrom: Date;
  dateTo: Date;
  prevFrom: Date;
  prevTo: Date;
  period: ReportPeriod;
  label: string;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  return r;
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function startOfYear(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), 0, 1));
}

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const UZ_MONTH_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

export function formatPeriodLabel(d: Date): string {
  return `${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthShort(d: Date): string {
  return UZ_MONTH_SHORT[d.getMonth()];
}

export function resolveAnalyticsPeriod(
  period?: ReportPeriod,
  dateFromStr?: string,
  dateToStr?: string,
  now = new Date(),
): ResolvedAnalyticsPeriod {
  const effective = period ?? ReportPeriod.monthly;

  if (effective === ReportPeriod.custom) {
    if (!dateFromStr || !dateToStr) {
      throw AppException.validation('Custom period requires date_from and date_to', [
        { field: 'date_from', message: 'Required', code: 'REQUIRED' },
        { field: 'date_to', message: 'Required', code: 'REQUIRED' },
      ]);
    }
    const dateFrom = startOfDay(new Date(dateFromStr));
    const dateTo = endOfDay(new Date(dateToStr));
    const spanMs = dateTo.getTime() - dateFrom.getTime();
    const prevTo = new Date(dateFrom.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - spanMs);
    return {
      dateFrom,
      dateTo,
      prevFrom: startOfDay(prevFrom),
      prevTo: endOfDay(prevTo),
      period: effective,
      label: `${dateFromStr} — ${dateToStr}`,
    };
  }

  const dateTo = endOfDay(now);
  let dateFrom: Date;
  let prevFrom: Date;
  let prevTo: Date;

  switch (effective) {
    case ReportPeriod.daily:
      dateFrom = startOfDay(now);
      prevFrom = startOfDay(new Date(now.getTime() - 86400000));
      prevTo = endOfDay(new Date(now.getTime() - 86400000));
      break;
    case ReportPeriod.weekly:
      dateFrom = startOfWeek(now);
      prevTo = endOfDay(new Date(dateFrom.getTime() - 1));
      prevFrom = startOfWeek(prevTo);
      break;
    case ReportPeriod.yearly:
      dateFrom = startOfYear(now);
      prevFrom = startOfYear(new Date(now.getFullYear() - 1, 0, 1));
      prevTo = endOfDay(new Date(now.getFullYear(), 0, 0));
      break;
    case ReportPeriod.monthly:
    default:
      dateFrom = startOfMonth(now);
      prevFrom = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      prevTo = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
  }

  return {
    dateFrom,
    dateTo,
    prevFrom,
    prevTo,
    period: effective,
    label: formatPeriodLabel(now),
  };
}

export function cacheTtlForPeriod(period: ReportPeriod): number {
  switch (period) {
    case ReportPeriod.daily:
      return 60;
    case ReportPeriod.weekly:
      return 120;
    case ReportPeriod.monthly:
      return 300;
    case ReportPeriod.yearly:
      return 600;
    default:
      return 180;
  }
}

export function chartBucketSql(period: ReportPeriod): string {
  switch (period) {
    case ReportPeriod.daily:
      return 'day';
    case ReportPeriod.weekly:
      return 'week';
    case ReportPeriod.yearly:
      return 'year';
    case ReportPeriod.monthly:
    default:
      return 'month';
  }
}

export function defaultChartPoints(period: ReportPeriod): number {
  switch (period) {
    case ReportPeriod.daily:
      return 14;
    case ReportPeriod.weekly:
      return 8;
    case ReportPeriod.yearly:
      return 5;
    case ReportPeriod.monthly:
    default:
      return 6;
  }
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
