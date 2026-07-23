import { Decimal } from '@prisma/client/runtime/library';

export function toDecimal(value: Decimal | number | string | null | undefined): Decimal {
  if (value == null) {
    return new Decimal(0);
  }
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value.toString());
}

export function formatMoney(value: Decimal | number | string | null | undefined): string {
  return toDecimal(value).toFixed(4);
}

export function parseMoney(value: string): Decimal {
  const d = new Decimal(value);
  if (!d.isFinite()) {
    throw new Error('Invalid money value');
  }
  return d.toDecimalPlaces(4);
}

export function uzsToUsd(uzs: Decimal, rate: Decimal): Decimal {
  if (rate.lte(0)) {
    throw new Error('Exchange rate must be positive');
  }
  return uzs.div(rate).toDecimalPlaces(4);
}

export function usdToUzs(usd: Decimal, rate: Decimal): Decimal {
  if (rate.lte(0)) {
    throw new Error('Exchange rate must be positive');
  }
  return usd.mul(rate).toDecimalPlaces(4);
}

export function isPositiveMoney(value: Decimal): boolean {
  return value.gt(0);
}

export function isNonNegativeMoney(value: Decimal): boolean {
  return value.gte(0);
}
