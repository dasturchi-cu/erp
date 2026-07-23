export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function normalizePage(page?: number): number {
  return Math.max(1, page ?? 1);
}

export function normalizeLimit(limit?: number, max = 100): number {
  return Math.min(max, Math.max(1, limit ?? 20));
}

export function paginationSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
}

export function parseSort(
  sort: string | undefined,
  allowedFields: string[],
  defaultSort: SortField[],
  maxFields = 3,
): SortField[] {
  if (!sort) {
    return defaultSort;
  }

  const parsed: SortField[] = [];
  for (const part of sort.split(',').slice(0, maxFields)) {
    const [field, direction = 'asc'] = part.split(':');
    if (!field || !allowedFields.includes(field)) {
      continue;
    }
    parsed.push({
      field,
      direction: direction.toLowerCase() === 'desc' ? 'desc' : 'asc',
    });
  }

  return parsed.length > 0 ? parsed : defaultSort;
}

export function toPrismaOrderBy(
  sortFields: SortField[],
): Array<Record<string, 'asc' | 'desc'>> {
  return sortFields.map((s) => ({ [s.field]: s.direction }));
}
