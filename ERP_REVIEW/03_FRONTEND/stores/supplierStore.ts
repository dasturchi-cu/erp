import { create } from 'zustand';
import { suppliersApi } from '@/api/services';
import type {
  Supplier,
  SupplierDebtHistoryEntry,
  SupplierPayment,
  SupplierReceipt,
} from '@/types/entities';

export interface CreateSupplierInput {
  name: string;
  phone: string;
  contactPerson?: string;
  notes?: string;
}

interface SupplierState {
  suppliers: Supplier[];
  payments: SupplierPayment[];
  receipts: Record<string, SupplierReceipt[]>;
  debtHistory: Record<string, SupplierDebtHistoryEntry[]>;
  isLoading: boolean;
  error: string | null;

  fetchSuppliers: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchReceipts: (supplierId: string, period?: string) => Promise<void>;
  fetchDebtHistory: (supplierId: string) => Promise<void>;

  listSuppliers: (includeArchived?: boolean) => Supplier[];
  getSupplierById: (id: string) => Supplier | undefined;
  createSupplier: (input: CreateSupplierInput) => Promise<Supplier>;
  updateSupplier: (id: string, input: Partial<CreateSupplierInput>) => Promise<Supplier>;
  archiveSupplier: (id: string) => Promise<void>;
  restoreSupplier: (id: string) => Promise<void>;
  recordPayment: (
    supplierId: string,
    input: { amount: number; currency: 'UZS' | 'USD'; method: SupplierPayment['method']; note?: string },
  ) => Promise<SupplierPayment>;
  getPaymentsBySupplier: (supplierId: string) => SupplierPayment[];
  getReceipts: (supplierId: string) => SupplierReceipt[];
  getDebtHistory: (supplierId: string) => SupplierDebtHistoryEntry[];
}

const methodToApi = (m: SupplierPayment['method']): 'CASH' | 'CARD' | 'BANK_TRANSFER' => {
  if (m === 'card') return 'CARD';
  if (m === 'transfer') return 'BANK_TRANSFER';
  return 'CASH';
};

const EMPTY_RECEIPTS: SupplierReceipt[] = [];
const EMPTY_DEBT_HISTORY: SupplierDebtHistoryEntry[] = [];

export const useSupplierStore = create<SupplierState>()((set, get) => ({
  suppliers: [],
  payments: [],
  receipts: {},
  debtHistory: {},
  isLoading: false,
  error: null,

  fetchSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const suppliers = await suppliersApi.list({ limit: 500 });
      set({ suppliers, isLoading: false });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as { message?: string }).message ?? 'Firmalar yuklanmadi',
      });
    }
  },

  fetchPayments: async () => {
    const payments = await suppliersApi.listPayments({ limit: 200 });
    set({ payments });
  },

  fetchReceipts: async (supplierId, period) => {
    const receipts = await suppliersApi.getReceipts(supplierId, period ? { period } : undefined);
    set((s) => ({ receipts: { ...s.receipts, [supplierId]: receipts } }));
  },

  fetchDebtHistory: async (supplierId) => {
    const history = await suppliersApi.getDebtHistory(supplierId);
    set((s) => ({ debtHistory: { ...s.debtHistory, [supplierId]: history } }));
  },

  listSuppliers: (includeArchived = false) => {
    const list = get().suppliers;
    return includeArchived ? list : list.filter((s) => s.status !== 'archived');
  },

  getSupplierById: (id) => get().suppliers.find((s) => s.id === id),

  createSupplier: async (input) => {
    const supplier = await suppliersApi.create(input);
    await get().fetchSuppliers();
    return supplier;
  },

  updateSupplier: async (id, input) => {
    const supplier = await suppliersApi.update(id, input);
    await get().fetchSuppliers();
    return supplier;
  },

  archiveSupplier: async (id) => {
    await suppliersApi.archive(id);
    await get().fetchSuppliers();
  },

  restoreSupplier: async (id) => {
    await suppliersApi.restore(id);
    await get().fetchSuppliers();
  },

  recordPayment: async (supplierId, input) => {
    const payment = await suppliersApi.recordPayment(supplierId, {
      amount: input.amount,
      currency: input.currency,
      paymentMethod: methodToApi(input.method),
      notes: input.note,
    });
    await Promise.all([get().fetchSuppliers(), get().fetchPayments(), get().fetchDebtHistory(supplierId)]);
    return payment;
  },

  getPaymentsBySupplier: (supplierId) => get().payments.filter((p) => p.supplierId === supplierId),
  getReceipts: (supplierId) => get().receipts[supplierId] ?? EMPTY_RECEIPTS,
  getDebtHistory: (supplierId) => get().debtHistory[supplierId] ?? EMPTY_DEBT_HISTORY,
}));
