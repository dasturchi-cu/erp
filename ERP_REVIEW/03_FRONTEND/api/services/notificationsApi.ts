import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { PaginatedResponse } from '@/types/api';
import type { Notification } from '@/types/entities';

export interface NotificationListParams {
  page?: number;
  limit?: number;
  read?: boolean;
}

export const notificationsApi = {
  list: async (params?: NotificationListParams): Promise<PaginatedResponse<Notification>> => {
    const { data } = await apiClient.get<PaginatedResponse<Notification>>(
      API_ENDPOINTS.notifications.list,
      { params: { limit: 100, ...params } },
    );
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>(API_ENDPOINTS.notifications.unreadCount);
    return data.count;
  },

  toggleRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch<Notification>(API_ENDPOINTS.notifications.byId(id));
    return data;
  },

  markRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch<Notification>(API_ENDPOINTS.notifications.read(id));
    return data;
  },

  markUnread: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.patch<Notification>(API_ENDPOINTS.notifications.unread(id));
    return data;
  },

  markAllRead: async (): Promise<number> => {
    const { data } = await apiClient.post<{ updated: number }>(API_ENDPOINTS.notifications.markAllRead);
    return data.updated;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.notifications.byId(id));
  },
};
