import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { mapSaleDetail, mapSaleListItem, mapSaleReturn } from '@/api/mappers';
import { toMoneyString } from '@/utils/money';
import { newIdempotencyKey } from '@/utils/idempotency';
import type { PaginatedResponse, ListParams } from '@/types/api';
import type { Sale, SaleReturn } from '@/types/entities';
import type { SaleDetail } from '@/types/sales';

export interface CreateSaleInput {
  customerId?: string;
  originalCurrency: 'UZS' | 'USD';
  paymentType: 'CASH' | 'CREDIT' | 'MIXED';
  amountPaidUzs?: number;
  amountPaidUsd?: number;
  notes?: string;
  lineItems: Array<{ productId: string; quantity: number; unitPriceUzs?: number }>;
}

export const salesApi = {
  list: async (params?: ListParams): Promise<Sale[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.sales, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapSaleListItem(row as Parameters<typeof mapSaleListItem>[0]));
  },

  getById: async (id: string): Promise<SaleDetail> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.sales}/${id}`);
    return mapSaleDetail(data);
  },

  create: async (input: CreateSaleInput, idempotencyKey = newIdempotencyKey()): Promise<SaleDetail> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.sales,
      {
        customerId: input.customerId,
        originalCurrency: input.originalCurrency,
        paymentType: input.paymentType,
        amountPaidUzs: input.amountPaidUzs != null ? toMoneyString(input.amountPaidUzs) : undefined,
        amountPaidUsd: input.amountPaidUsd != null ? toMoneyString(input.amountPaidUsd) : undefined,
        notes: input.notes,
        lineItems: input.lineItems.map((li) => ({
          productId: li.productId,
          quantity: toMoneyString(li.quantity),
          unitPriceUzs: li.unitPriceUzs != null ? toMoneyString(li.unitPriceUzs) : undefined,
        })),
      },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return mapSaleDetail(data);
  },

  void: async (id: string, note?: string, idempotencyKey = newIdempotencyKey()): Promise<SaleDetail> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.sales}/${id}/void`,
      { note },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return mapSaleDetail(data);
  },

  listReturns: async (params?: ListParams): Promise<SaleReturn[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.salesReturns, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapSaleReturn(row as Parameters<typeof mapSaleReturn>[0]));
  },

  getReturnById: async (id: string): Promise<SaleReturn> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.salesReturns}/${id}`);
    return mapSaleReturn(data);
  },

  createReturn: async (
    saleId: string,
    input: { reason: string; lineItems: Array<{ productId: string; quantity: number }> },
    idempotencyKey = newIdempotencyKey(),
  ): Promise<SaleReturn> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.sales}/${saleId}/returns`,
      {
        reason: input.reason,
        lineItems: input.lineItems.map((li) => ({
          productId: li.productId,
          quantity: toMoneyString(li.quantity),
        })),
      },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    return mapSaleReturn(data);
  },

  approveReturn: async (id: string, note?: string) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.salesReturns}/${id}/approve`, { note });
    return mapSaleReturn(data);
  },

  rejectReturn: async (id: string, note?: string) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.salesReturns}/${id}/reject`, { note });
    return mapSaleReturn(data);
  },

  getReceiptTemplates: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/sales/receipt-templates');
    return data;
  },

  saveReceiptTemplate: async (dto: any): Promise<any> => {
    const { data } = await apiClient.post('/sales/receipt-templates', dto);
    return data;
  },
};
