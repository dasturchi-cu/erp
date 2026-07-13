import { create } from 'zustand';
import type { Customer, Product } from '@/types/entities';
import type { CartLine, PaymentMethod, SaleCurrency } from '@/types/sales';
import { cartLineBaseQuantity } from '@/constants/productUnits';
import { useCurrencyStore } from '@/stores/currencyStore';
import { lineTotalUsd } from '@/utils/currency';

interface PosCartState {
  items: CartLine[];
  customer: Customer | null;
  currency: SaleCurrency;
  isProcessing: boolean;

  addProduct: (product: Product, qty?: number, saleUnit?: CartLine['saleUnit']) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  setSaleUnit: (productId: string, saleUnit: CartLine['saleUnit']) => void;
  setUnitPrice: (productId: string, unitPriceUzs: number) => void;
  removeLine: (productId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setCurrency: (currency: SaleCurrency) => void;
  clearCart: () => void;
  setProcessing: (v: boolean) => void;

  getTotals: () => { totalUzs: number; totalUsd: number; itemCount: number };
  getBelowCostLines: () => CartLine[];
}

function lineStockQty(line: CartLine): number {
  return cartLineBaseQuantity(line.quantity, line.saleUnit, line.product.unitsPerBox);
}

function currentBaseQty(items: CartLine[], productId: string): number {
  const line = items.find((i) => i.product.id === productId);
  return line ? lineStockQty(line) : 0;
}

export const usePosCartStore = create<PosCartState>((set, get) => ({
  items: [],
  customer: null,
  currency: 'UZS',
  isProcessing: false,

  addProduct: (product, qty = 1, saleUnit = 'piece') => {
    const { items } = get();
    const existing = items.find((i) => i.product.id === product.id);
    const existingBase = existing ? lineStockQty(existing) : 0;
    const addBase = cartLineBaseQuantity(qty, saleUnit, product.unitsPerBox);
    if (existingBase + addBase > product.stock) return false;

    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                saleUnit,
                quantity: existing.saleUnit === saleUnit ? i.quantity + qty : qty,
              }
            : i,
        ),
      });
    } else {
      set({
        items: [
          ...items,
          { product, quantity: qty, saleUnit, unitPriceUzs: product.priceUzs },
        ],
      });
    }
    return true;
  },

  setQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeLine(productId);
      return;
    }
    set({
      items: get().items.map((i) => {
        if (i.product.id !== productId) return i;
        const mult =
          i.saleUnit === 'box' ? Math.max(1, i.product.unitsPerBox) : 1;
        const maxQty = Math.floor(i.product.stock / mult);
        return { ...i, quantity: Math.min(quantity, Math.max(1, maxQty)) };
      }),
    });
  },

  setSaleUnit: (productId, saleUnit) => {
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, saleUnit, quantity: 1 } : i,
      ),
    });
  },

  setUnitPrice: (productId, unitPriceUzs) => {
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, unitPriceUzs: Math.max(0, unitPriceUzs) } : i,
      ),
    });
  },

  removeLine: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) });
  },

  setCustomer: (customer) => set({ customer }),
  setCurrency: (currency) => set({ currency }),
  clearCart: () => set({ items: [], customer: null }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  getTotals: () => {
    const { items } = get();
    const rate = useCurrencyStore.getState().getActiveRate();
    const totalUzs = items.reduce(
      (s, i) => s + lineStockQty(i) * i.unitPriceUzs,
      0,
    );
    return {
      totalUzs,
      totalUsd: lineTotalUsd(totalUzs, rate),
      itemCount: items.reduce((s, i) => s + lineStockQty(i), 0),
    };
  },

  getBelowCostLines: () =>
    get().items.filter(
      (i) => i.product.purchasePriceUzs > 0 && i.unitPriceUzs <= i.product.purchasePriceUzs,
    ),
}));

export function calcChange(received: number, total: number) {
  return Math.max(0, received - total);
}

export function inferPaymentMethod(
  receivedUzs: number,
  totalUzs: number,
  hasCustomer: boolean,
): PaymentMethod {
  if (receivedUzs >= totalUzs) return 'cash';
  if (receivedUzs <= 0 && hasCustomer) return 'credit';
  if (receivedUzs > 0 && receivedUzs < totalUzs) return 'mixed';
  return 'cash';
}

export { lineStockQty };
