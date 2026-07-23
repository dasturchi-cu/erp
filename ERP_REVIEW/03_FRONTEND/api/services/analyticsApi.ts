import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { AnalyticsOverview, DashboardPeriod } from '@/types';

export interface AnalyticsQueryParams {
  period?: DashboardPeriod;
  date_from?: string;
  date_to?: string;
  branch_id?: string;
  months?: number;
  limit?: number;
}

export const analyticsApi = {
  getOverview: async (params?: AnalyticsQueryParams): Promise<AnalyticsOverview> => {
    const { data } = await apiClient.get<AnalyticsOverview>(API_ENDPOINTS.analytics.overview, {
      params,
    });
    return data;
  },

  getMetrics: async (params?: AnalyticsQueryParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.analytics.metrics, { params });
    return data;
  },

  getRevenueProfitChart: async (params?: AnalyticsQueryParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.analytics.revenueProfitChart, { params });
    return data;
  },

  getTopProducts: async (params?: AnalyticsQueryParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.analytics.topProducts, { params });
    return data;
  },

  getTopCustomers: async (params?: AnalyticsQueryParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.analytics.topCustomers, { params });
    return data;
  },

  getTopSuppliers: async (params?: AnalyticsQueryParams) => {
    const { data } = await apiClient.get(API_ENDPOINTS.analytics.topSuppliers, { params });
    return data;
  },
};
