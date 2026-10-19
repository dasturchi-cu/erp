export const AGING_BUCKET_DEFS = [
  { label: '0-30', minDays: 0, maxDays: 30 },
  { label: '31-60', minDays: 31, maxDays: 60 },
  { label: '61-90', minDays: 61, maxDays: 90 },
  { label: '91-120', minDays: 91, maxDays: 120 },
  { label: '120+', minDays: 121, maxDays: Number.POSITIVE_INFINITY },
] as const;

export type AgingBucketLabel = (typeof AGING_BUCKET_DEFS)[number]['label'];

export function ageDaysFrom(asOf: Date, referenceDate: Date): number {
  return Math.max(0, Math.floor((asOf.getTime() - referenceDate.getTime()) / 86400000));
}

export function resolveAgingBucket(ageDays: number): AgingBucketLabel {
  for (const bucket of AGING_BUCKET_DEFS) {
    if (ageDays >= bucket.minDays && ageDays <= bucket.maxDays) {
      return bucket.label;
    }
  }
  return '120+';
}

/**
 * Normalizes the bucket query param. An unencoded '+' in "?bucket=120+"
 * arrives as a space ("120 "), so the filter never matched and the 120+
 * view came back empty; accept "120", "120 " and "120+".
 */
export function normalizeBucketFilter(filter?: string): string | undefined {
  const trimmed = filter?.trim();
  if (!trimmed) return undefined;
  if (trimmed === '120' || trimmed === '120+') return '120+';
  return trimmed;
}

export function matchesBucketFilter(bucket: string, filter?: string): boolean {
  const normalized = normalizeBucketFilter(filter);
  if (!normalized) return true;
  return bucket === normalized;
}
