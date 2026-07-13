import { create } from 'zustand';
import { salesApi } from '@/api/services';
import { refreshAfterReturnMutation, refreshAfterSaleMutation } from '@/utils/domainRefresh';
import type { SaleReturn } from '@/types/entities';
import type { SaleDetail } from '@/types/sales';

export interface CreateReturnInput {
  saleId: string;
  reason: string;
  lineItems: Array<{ productId: string; productName: string; quantity: number; amountUzs: number }>;
  recordedBy: string;
}

interface SalesState {
  sales: SaleDetail[];
  returns: SaleReturn[];
  lastCompletedSaleId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchSales: () => Promise<void>;
  fetchReturns: () => Promise<void>;
  fetchSaleById: (id: string) => Promise<SaleDetail | undefined>;
  fetchReturnById: (id: string) => Promise<SaleReturn | undefined>;

  getSaleById: (id: string) => SaleDetail | undefined;
  getSaleByNumber: (number: string) => SaleDetail | undefined;
  getSalesByCustomerId: (customerId: string) => SaleDetail[];
  voidSale: (id: string, note?: string) => Promise<SaleDetail>;
  createReturn: (input: CreateReturnInput) => Promise<SaleReturn>;
  approveReturn: (id: string, note?: string) => Promise<SaleReturn>;
  rejectReturn: (id: string, note?: string) => Promise<SaleReturn>;
  getReturnById: (id: string) => SaleReturn | undefined;
  clearLastCompleted: () => void;
  setLastCompletedSaleId: (id: string) => void;
}

export const useSalesStore = create<SalesState>()((set, get) => ({
  sales: [],
  returns: [],
  lastCompletedSaleId: null,
  isLoading: false,
  error: null,

  fetchSales: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await salesApi.list();
      set({ sales: list as any, isLoading: false });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as { message?: string }).message ?? 'Sotuvlar yuklanmadi',
      });
    }
  },

  fetchReturns: async () => {
    const returns = await salesApi.listReturns();
    set({ returns });
  },

  fetchSaleById: async (id) => {
    try {
      const sale = await salesApi.getById(id);
      set((s) => ({
        sales: s.sales.some((x) => x.id === id)
          ? s.sales.map((x) => (x.id === id ? sale : x))
          : [...s.sales, sale],
      }));
      return sale;
    } catch {
      return undefined;
    }
  },

  fetchReturnById: async (id) => {
    try {
      const ret = await salesApi.getReturnById(id);
      set((s) => ({
        returns: s.returns.some((x) => x.id === id)
          ? s.returns.map((x) => (x.id === id ? ret : x))
          : [...s.returns, ret],
      }));
      return ret;
    } catch {
      return undefined;
    }
  },

  getSaleById: (id) => get().sales.find((s) => s.id === id),

  getSaleByNumber: (number) => get().sales.find((s) => s.number === number),

  getSalesByCustomerId: (customerId) =>
    get().sales.filter((s) => s.customerId === customerId),

  voidSale: async (id, note) => {
    const sale = await salesApi.void(id, note);
    set((s) => ({
      sales: s.sales.map((x) => (x.id === id ? sale : x)),
    }));
    await refreshAfterSaleMutation();
    return sale;
  },

  createReturn: async (input) => {
    const ret = await salesApi.createReturn(input.saleId, {
      reason: input.reason,
      lineItems: input.lineItems.map((li) => ({
        productId: li.productId,
        quantity: li.quantity,
      })),
    });
    set((s) => ({ returns: [ret, ...s.returns] }));
    return ret;
  },

  approveReturn: async (id, note) => {
    const ret = await salesApi.approveReturn(id, note);
    set((s) => ({
      returns: s.returns.map((x) => (x.id === id ? ret : x)),
    }));
    await refreshAfterReturnMutation();
    return ret;
  },

  rejectReturn: async (id, note) => {
    const ret = await salesApi.rejectReturn(id, note);
    set((s) => ({
      returns: s.returns.map((x) => (x.id === id ? ret : x)),
    }));
    await refreshAfterReturnMutation();
    return ret;
  },

  getReturnById: (id) => get().returns.find((r) => r.id === id),

  clearLastCompleted: () => set({ lastCompletedSaleId: null }),

  setLastCompletedSaleId: (id) => set({ lastCompletedSaleId: id }),
}));

/** Credit portion for display only — server computes debt. */
export function getSaleCreditUzs(sale: SaleDetail): number {
  if (sale.paymentType === 'credit') return sale.totalUzs;
  if (sale.paymentType === 'mixed') {
    const receivedUzs = sale.payments[0]?.receivedUzs ?? 0;
    return Math.max(0, sale.totalUzs - receivedUzs);
  }
  return 0;
}
