import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import {
  mapCustomer,
  mapDebtHistoryEntry,
  mapDebtPayment,
  mapExchangeRate,
  mapProductBatch,
  mapStockMovement,
  mapWarehouse,
} from '@/api/mappers';
import { toMoneyString } from '@/utils/money';
import type { PaginatedResponse, ListParams } from '@/types/api';
import type { Customer, DebtHistoryEntry, ExchangeRate, Payment, ProductBatch, StockMovement, Warehouse } from '@/types/entities';

export const currencyApi = {
  getCurrentRate: async (): Promise<ExchangeRate> => {
    const { data } = await apiClient.get(API_ENDPOINTS.currency.rate);
    return mapExchangeRate({ ...data, status: data.status });
  },

  listRates: async (params?: ListParams): Promise<ExchangeRate[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.currency.rates, {
      params: { limit: 50, ...params },
    });
    return data.data.map((row) =>
      mapExchangeRate(row as Parameters<typeof mapExchangeRate>[0]),
    );
  },

  setRate: async (rate: number, notes?: string): Promise<ExchangeRate> => {
    const { data } = await apiClient.post(API_ENDPOINTS.currency.rates, {
      rate: toMoneyString(rate),
      notes,
    });
    return mapExchangeRate(data);
  },
};

export const inventoryApi = {
  listStock: async (params?: ListParams & { warehouseId?: string; productId?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      API_ENDPOINTS.inventory.stock,
      { params: { limit: 100, ...params } },
    );
    return data;
  },

  listBatches: async (params?: ListParams): Promise<ProductBatch[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      API_ENDPOINTS.inventory.batches,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) => mapProductBatch(row as Parameters<typeof mapProductBatch>[0]));
  },

  listMovements: async (params?: ListParams): Promise<StockMovement[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      API_ENDPOINTS.inventory.movements,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) => mapStockMovement(row as Parameters<typeof mapStockMovement>[0]));
  },

  receive: async (input: {
    productId: string;
    warehouseId: string;
    quantity: number;
    unitCostUzs: number;
    note?: string;
    supplierId: string;
    paymentType: 'CASH' | 'CREDIT';
    originalCurrency?: 'UZS' | 'USD';
    exchangeRateUsed?: number;
    batchNumber?: string;
    expiresAt?: string;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.inventory.receive, {
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: toMoneyString(input.quantity),
      unitCostUzs: toMoneyString(input.unitCostUzs),
      note: input.note,
      supplierId: input.supplierId,
      paymentType: input.paymentType,
      originalCurrency: input.originalCurrency,
      exchangeRateUsed: input.exchangeRateUsed != null ? toMoneyString(input.exchangeRateUsed) : undefined,
      batchNumber: input.batchNumber,
      expiresAt: input.expiresAt,
    });
    return data;
  },

  adjust: async (input: {
    productId: string;
    warehouseId: string;
    quantityDelta: number;
    reason: string;
    reasonCode?: string;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.inventory.adjust, {
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantityDelta: toMoneyString(input.quantityDelta),
      reason: input.reason,
      reasonCode: input.reasonCode,
    });
    return data;
  },

  transfer: async (input: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    note?: string;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.inventory.transfers, {
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      quantity: toMoneyString(input.quantity),
      note: input.note,
    });
    return data;
  },

  listTransfers: async (params?: ListParams & { warehouseId?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      API_ENDPOINTS.inventory.transferHistory,
      { params: { limit: 100, ...params } },
    );
    return data;
  },

  listBranches: async () => {
    const { data } = await apiClient.get<{ data: Array<{ id: string; name: string; address?: string | null; isDefault: boolean }> }>(
      API_ENDPOINTS.branches,
    );
    return data.data;
  },

  listWarehouses: async (): Promise<Warehouse[]> => {
    const { data } = await apiClient.get<{ data: unknown[] }>(API_ENDPOINTS.warehouses);
    return data.data.map((row) => mapWarehouse(row as Parameters<typeof mapWarehouse>[0]));
  },

  getWarehouse: async (id: string) => {
    const { data } = await apiClient.get(API_ENDPOINTS.warehouseById(id));
    return {
      warehouse: mapWarehouse(data),
      batches: (data.batches ?? []).map((b: unknown) =>
        mapProductBatch(b as Parameters<typeof mapProductBatch>[0]),
      ),
      movements: (data.movements ?? []).map((m: unknown) =>
        mapStockMovement(m as Parameters<typeof mapStockMovement>[0]),
      ),
    };
  },

  getWarehouseDashboard: async (id: string) => {
    const { data } = await apiClient.get(API_ENDPOINTS.warehouseDashboard(id));
    return data;
  },

  getWarehouseReports: async (id: string) => {
    const { data } = await apiClient.get(API_ENDPOINTS.warehouseReports(id));
    return data;
  },

  createWarehouse: async (input: {
    name: string;
    branchId: string;
    address?: string;
    isDefault?: boolean;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.warehouses, input);
    return mapWarehouse(data);
  },

  updateWarehouse: async (
    id: string,
    input: { name?: string; address?: string; branchId?: string; isDefault?: boolean },
  ) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.warehouseById(id), input);
    return mapWarehouse(data);
  },

  deactivateWarehouse: async (id: string) => {
    const { data } = await apiClient.post(API_ENDPOINTS.warehouseDeactivate(id));
    return mapWarehouse(data);
  },
};

export const customersApi = {
  list: async (params?: ListParams): Promise<Customer[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.customers, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapCustomer(row as Parameters<typeof mapCustomer>[0]));
  },

  search: async (q: string): Promise<Customer[]> => {
    const { data } = await apiClient.get<{ data: unknown[] }>(`${API_ENDPOINTS.customers}/search`, {
      params: { q },
    });
    return data.data.map((row) => mapCustomer(row as Parameters<typeof mapCustomer>[0]));
  },

  getById: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.customers}/${id}`);
    return mapCustomer(data);
  },

  create: async (input: {
    name: string;
    phone: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.customers, input);
    return mapCustomer(data);
  },

  update: async (
    id: string,
    input: Partial<{ name: string; phone: string; notes: string; status: string }>,
  ) => {
    const body = { ...input };
    if (input.status) (body as Record<string, string>).status = input.status.toUpperCase();
    const { data } = await apiClient.patch(`${API_ENDPOINTS.customers}/${id}`, body);
    return mapCustomer(data);
  },

  delete: (id: string) => apiClient.delete(`${API_ENDPOINTS.customers}/${id}`),

  getDebts: async (id: string) => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.customers}/${id}/debts`);
    return data;
  },

  getDebtHistory: async (id: string, params?: ListParams): Promise<DebtHistoryEntry[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      `${API_ENDPOINTS.customers}/${id}/debt-history`,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) =>
      mapDebtHistoryEntry(row as Parameters<typeof mapDebtHistoryEntry>[0]),
    );
  },
};

export const debtApi = {
  listPayments: async (params?: ListParams): Promise<Payment[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.debtPayments, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapDebtPayment(row as Parameters<typeof mapDebtPayment>[0]));
  },

  recordPayment: async (
    input: {
      customerId: string;
      amount: number;
      currency: 'UZS' | 'USD';
      paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
      paymentType: 'PARTIAL' | 'FULL';
      notes?: string;
    },
    idempotencyKey: string,
  ) => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.debtPayments,
      {
        customerId: input.customerId,
        amount: toMoneyString(input.amount),
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        paymentType: input.paymentType,
        notes: input.notes,
      },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return mapDebtPayment(data);
  },

  reversePayment: async (id: string, reason: string) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.debtPayments}/${id}/reverse`, { reason });
    return mapDebtPayment(data);
  },

  getSummary: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.debt.summary);
    return data;
  },

  listDebtCustomers: async (params?: ListParams) => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(
      API_ENDPOINTS.debt.customers,
      { params: { limit: 100, ...params } },
    );
    return data.data.map((row) => mapCustomer(row as Parameters<typeof mapCustomer>[0]));
  },

  getAging: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.debt.aging);
    return data;
  },
};
