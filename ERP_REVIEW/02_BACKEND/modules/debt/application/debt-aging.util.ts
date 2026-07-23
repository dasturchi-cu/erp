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

export function matchesBucketFilter(bucket: string, filter?: string): boolean {
  if (!filter) return true;
  return bucket === filter;
}
