import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { PaginatedResponse, ListParams } from '@/types/api';
import type { ReportItem } from '@/types/entities';

export interface GenerateReportInput {
  category: string;
  template: string;
  format: 'PDF' | 'XLSX' | 'CSV';
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  date_from?: string;
  date_to?: string;
  branch_id?: string;
  warehouse_id?: string;
}

export interface ReportJobResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  downloadUrl?: string;
  rowCount?: number;
  errorMessage?: string;
}

export const reportsApi = {
  listCatalog: async (params?: ListParams & { q?: string; category?: string }): Promise<ReportItem[]> => {
    const { data } = await apiClient.get<PaginatedResponse<ReportItem>>(API_ENDPOINTS.reports.catalog, {
      params,
    });
    return data.data;
  },

  generate: async (input: GenerateReportInput): Promise<{ jobId: string; status: string; downloadUrl?: string }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.reports.generate, input);
    return data;
  },

  getJobStatus: async (id: string): Promise<ReportJobResponse> => {
    const { data } = await apiClient.get<ReportJobResponse>(API_ENDPOINTS.reports.jobStatus(id));
    return data;
  },

  listHistory: async (params?: ListParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.reports.history, { params });
    return data;
  },
};
