/** UZS is the canonical product/debt amount; USD is derived from the active exchange rate. */

export function uzsToUsd(amountUzs: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((amountUzs / rate) * 100) / 100;
}

export function usdToUzs(amountUsd: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round(amountUsd * rate);
}

export function formatRate(rate: number): string {
  return `${rate.toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm`;
}

export function productUsdFromUzs(priceUzs: number, rate: number): number {
  return uzsToUsd(priceUzs, rate);
}

export function productUzsFromUsd(priceUsd: number, rate: number): number {
  return usdToUzs(priceUsd, rate);
}

export function lineTotalUsd(totalUzs: number, rate: number): number {
  return uzsToUsd(totalUzs, rate);
}
