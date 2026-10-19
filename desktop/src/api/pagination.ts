import type { PaginatedResponse } from '@/types/api';

/** Backend PaginationQueryDto rejects limit > 1000. */
export const MAX_PAGE_LIMIT = 1000;

/**
 * Walk every page of a paginated list endpoint. Stops on the last page per
 * meta (or a short page when meta is missing); maxPages is a safety cap.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit = MAX_PAGE_LIMIT,
  maxPages = 50,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchPage(page, limit);
    all.push(...res.data);
    const totalPages = res.meta?.totalPages;
    if (totalPages != null ? page >= totalPages : res.data.length < limit) break;
  }
  return all;
}
