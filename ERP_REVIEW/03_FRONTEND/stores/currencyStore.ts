import { create } from 'zustand';
import { currencyApi } from '@/api/services';
import type { ExchangeRate } from '@/types/entities';

interface CurrencyState {
  rates: ExchangeRate[];
  activeRate: number;
  isLoading: boolean;
  error: string | null;

  fetchRates: () => Promise<void>;
  getActiveRate: () => number;
  getActiveRateRecord: () => ExchangeRate | undefined;
  setRate: (rate: number, setBy: string) => Promise<ExchangeRate>;
  listRates: () => ExchangeRate[];
}

export const useCurrencyStore = create<CurrencyState>()((set, get) => ({
  rates: [],
  activeRate: 0,
  isLoading: false,
  error: null,

  fetchRates: async () => {
    set({ isLoading: true, error: null });
    try {
      const [current, history] = await Promise.all([
        currencyApi.getCurrentRate(),
        currencyApi.listRates({ limit: 50 }),
      ]);
      const merged = [
        current,
        ...history.filter((r) => r.id !== current.id),
      ];
      set({
        rates: merged,
        activeRate: current.rate,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as { message?: string }).message ?? 'Kurs yuklanmadi',
      });
    }
  },

  getActiveRate: () => get().activeRate || get().rates.find((r) => r.status === 'active')?.rate || 0,

  getActiveRateRecord: () => get().rates.find((r) => r.status === 'active'),

  setRate: async (rate, setBy) => {
    const entry = await currencyApi.setRate(rate, `Set by ${setBy}`);
    await get().fetchRates();
    return entry;
  },

  listRates: () =>
    [...get().rates].sort(
      (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
    ),
}));
