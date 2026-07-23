/** Parse API money string to number for display. */
export function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Format number to API money string (4 decimal places). */
export function toMoneyString(value: number): string {
  return value.toFixed(4);
}
