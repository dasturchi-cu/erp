export const PRODUCT_UNITS = [
  { value: 'pcs', label: 'Dona' },
  { value: 'box', label: 'Karobka' },
  { value: 'kg', label: 'Kg' },
  { value: 'm', label: 'Metr' },
  { value: 'l', label: 'Litr' },
  { value: 'bag', label: 'Qop' },
  { value: 'pack', label: 'Pachka' },
  { value: 'roll', label: 'Rulon' },
  { value: 'set', label: 'Komplekt' },
] as const;

export type ProductUnitCode = (typeof PRODUCT_UNITS)[number]['value'];

export function productUnitLabel(code: string): string {
  return PRODUCT_UNITS.find((u) => u.value === code)?.label ?? code;
}

/** Base quantity in storage units (pieces) for a cart line. */
export function cartLineBaseQuantity(
  quantity: number,
  saleUnit: 'piece' | 'box',
  unitsPerBox: number,
): number {
  const mult = saleUnit === 'box' ? Math.max(1, unitsPerBox) : 1;
  return quantity * mult;
}
