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

// Small epsilon so float noise (e.g. 3.9600000001) doesn't push a value to
// the next cent.
const CENT_EPS = 1e-7;

/** USD amount, rounded UP to the cent, that covers `amountUzs` (cash due). */
export function uzsToUsdCeil(amountUzs: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.ceil((amountUzs / rate) * 100 - CENT_EPS) / 100;
}

/** USD amount, rounded DOWN to the cent, that never exceeds `amountUzs` (debt payoff). */
export function uzsToUsdFloor(amountUzs: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.floor((amountUzs / rate) * 100 + CENT_EPS) / 100;
}
