import { ReportPeriod } from '@prisma/client';
import { AppException } from '../../../core/exceptions/app.exception';

export interface ResolvedPeriod {
  dateFrom: Date;
  dateTo: Date;
  period: ReportPeriod;
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

function parseDate(value: string, field: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw AppException.validation(`Invalid ${field}`, [
      { field, message: 'Must be a valid ISO date', code: 'INVALID_DATE' },
    ]);
  }
  return d;
}

export function resolveReportPeriod(
  period?: ReportPeriod,
  dateFromStr?: string,
  dateToStr?: string,
  now = new Date(),
): ResolvedPeriod {
  const effective = period ?? ReportPeriod.monthly;

  if (effective === ReportPeriod.custom) {
    if (!dateFromStr || !dateToStr) {
      throw AppException.validation('Custom period requires date_from and date_to', [
        { field: 'date_from', message: 'Required for custom period', code: 'REQUIRED' },
        { field: 'date_to', message: 'Required for custom period', code: 'REQUIRED' },
      ]);
    }
    const dateFrom = startOfDay(parseDate(dateFromStr, 'date_from'));
    const dateTo = endOfDay(parseDate(dateToStr, 'date_to'));
    if (dateFrom > dateTo) {
      throw AppException.validation('date_from must be before date_to', [
        { field: 'date_from', message: 'Must be before date_to', code: 'INVALID_RANGE' },
      ]);
    }
    return { dateFrom, dateTo, period: effective };
  }

  let dateFrom: Date;
  const dateTo = endOfDay(now);

  switch (effective) {
    case ReportPeriod.daily:
      dateFrom = startOfDay(now);
      break;
    case ReportPeriod.weekly:
      dateFrom = startOfWeek(now);
      break;
    case ReportPeriod.monthly:
      dateFrom = startOfMonth(now);
      break;
    case ReportPeriod.yearly:
      dateFrom = startOfYear(now);
      break;
    default:
      dateFrom = startOfMonth(now);
  }

  return { dateFrom, dateTo, period: effective };
}
