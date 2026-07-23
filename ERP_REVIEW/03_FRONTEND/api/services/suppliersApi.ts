import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import {
  mapSupplier,
  mapSupplierDebtHistoryEntry,
  mapSupplierPayment,
  mapSupplierReceipt,
} from '@/api/mappers';
import { toMoneyString } from '@/utils/money';
import type { PaginatedResponse, ListParams } from '@/types/api';
import type {
  Supplier,
  SupplierDebtHistoryEntry,
  SupplierPayment,
  SupplierReceipt,
} from '@/types/entities';

export const suppliersApi = {
  list: async (params?: ListParams): Promise<Supplier[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.suppliers, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapSupplier(row as Parameters<typeof mapSupplier>[0]));
  },

  search: async (q: string): Promise<Supplier[]> => {
    const { data } = await apiClient.get<{ data: unknown[] }>(`${API_ENDPOINTS.suppliers}/search`, {
      params: { q },
    });
    return data.data.map((row) => mapSupplier(row as Parameters<typeof mapSupplier>[0]));
  },

  getById: async (id: string): Promise<Supplier> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.suppliers}/${id}`);
    return mapSupplier(data);
  },

  getSummary: async () => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.suppliers}/summary`);
    return data as {
      supplierCount: number;
      totalDebtUzs: string;
      totalPaidUzs: string;
      remainingDebtUzs: string;
      topSupplierName: string | null;
      topSupplierDebtUzs: string;
      recentPayments: unknown[];
    };
  },

  create: async (input: {
    name: string;
    phone: string;
    contactPerson?: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.suppliers, input);
    return mapSupplier(data);
  },

  update: async (
    id: string,
    input: Partial<{
      name: string;
      phone: string;
      contactPerson: string;
      notes: string;
      status: string;
    }>,
  ) => {
    const body = { ...input };
    if (input.status) (body as Record<string, string>).status = input.status.toUpperCase();
    const { data } = await apiClient.patch(`${API_ENDPOINTS.suppliers}/${id}`, body);
    return mapSupplier(data);
  },

  archive: async (id: string) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.suppliers}/${id}/archive`);
    return mapSupplier(data);
  },

  restore: async (id: string) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.suppliers}/${id}/restore`);
    return mapSupplier(data);
  },

  getReceipts: async (id: string, params?: ListParams & { period?: string }): Promise<SupplierReceipt[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      `${API_ENDPOINTS.suppliers}/${id}/receipts`,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) => mapSupplierReceipt(row as Parameters<typeof mapSupplierReceipt>[0]));
  },

  getDebtHistory: async (id: string, params?: ListParams): Promise<SupplierDebtHistoryEntry[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      `${API_ENDPOINTS.suppliers}/${id}/debt-history`,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) =>
      mapSupplierDebtHistoryEntry(row as Parameters<typeof mapSupplierDebtHistoryEntry>[0]),
    );
  },

  listPayments: async (params?: ListParams): Promise<SupplierPayment[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      `${API_ENDPOINTS.suppliers}/payments`,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) => mapSupplierPayment(row as Parameters<typeof mapSupplierPayment>[0]));
  },

  recordPayment: async (
    supplierId: string,
    input: { amount: number; currency: 'UZS' | 'USD'; paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER'; notes?: string },
  ) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.suppliers}/${supplierId}/payments`, {
      amount: toMoneyString(input.amount),
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    });
    return mapSupplierPayment(data);
  },

  exportDebts: async () => {
    const { data } = await apiClient.get<{ data: unknown[] }>(`${API_ENDPOINTS.suppliers}/export/debts`);
    return data.data as Array<Record<string, string>>;
  },
};
