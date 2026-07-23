import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import {
  mapAdminAuditLog,
  mapAdminDevice,
  mapAdminOverview,
  mapAdminSession,
  mapAdminUser,
  mapAdminRole,
  mapPermission,
  mapBackupJob,
  mapSystemLog,
} from '@/api/mappers';
import type { PaginatedResponse, ListParams } from '@/types/api';
import type {
  AdminDevice,
  AdminOverview,
  AdminSession,
  AuditLog,
  BackupJob,
  BackupSchedule,
  MonitoringData,
  Permission,
  Role,
  SystemLogEntry,
  User,
} from '@/types/entities';

export const adminApi = {
  getOverview: async (): Promise<AdminOverview> => {
    const { data } = await apiClient.get(API_ENDPOINTS.admin.overview);
    return mapAdminOverview(data);
  },

  getMonitoring: async (): Promise<MonitoringData> => {
    const { data } = await apiClient.get<MonitoringData>(API_ENDPOINTS.admin.monitoring);
    return data;
  },

  getHealthCheck: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.admin.health);
    return data;
  },

  getQueueStatus: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.admin.queue);
    return data;
  },

  listLogs: async (params?: ListParams): Promise<SystemLogEntry[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.logs, {
      params: { limit: 200, ...params },
    });
    return data.data.map((row) => mapSystemLog(row as Parameters<typeof mapSystemLog>[0]));
  },

  listBackups: async (params?: ListParams): Promise<BackupJob[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.backups, {
      params: { limit: 100, ...params },
    });
    return data.data.map((row) => mapBackupJob(row as Parameters<typeof mapBackupJob>[0]));
  },

  createBackup: async (type: 'full' | 'incremental' = 'full'): Promise<BackupJob> => {
    const { data } = await apiClient.post(API_ENDPOINTS.admin.backups, {
      type: type.toUpperCase(),
    });
    return mapBackupJob(data);
  },

  restoreBackup: async (id: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.admin.backupRestore(id));
  },

  getBackupSchedule: async (): Promise<BackupSchedule> => {
    const { data } = await apiClient.get<BackupSchedule>(API_ENDPOINTS.admin.backupSchedule);
    return data;
  },

  updateBackupSchedule: async (input: Partial<BackupSchedule>): Promise<BackupSchedule> => {
    const { data } = await apiClient.patch<BackupSchedule>(
      API_ENDPOINTS.admin.backupSchedule,
      input,
    );
    return data;
  },

  listUsers: async (params?: ListParams & { q?: string }): Promise<User[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.users, {
      params: { limit: 200, ...params },
    });
    return data.data.map((row) => mapAdminUser(row as Parameters<typeof mapAdminUser>[0]));
  },

  createUser: async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }): Promise<User> => {
    const { data } = await apiClient.post(API_ENDPOINTS.admin.users, input);
    return mapAdminUser(data);
  },

  updateUserStatus: async (id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<User> => {
    const { data } = await apiClient.patch(`${API_ENDPOINTS.admin.users}/${id}/status`, { status });
    return mapAdminUser(data);
  },

  listSessions: async (params?: ListParams): Promise<AdminSession[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.sessions, {
      params: { limit: 200, ...params },
    });
    return data.data.map((row) => mapAdminSession(row as Parameters<typeof mapAdminSession>[0]));
  },

  revokeSession: async (id: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.admin.sessions}/${id}/revoke`);
  },

  listDevices: async (params?: ListParams): Promise<AdminDevice[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.devices, {
      params: { limit: 200, ...params },
    });
    return data.data.map((row) => mapAdminDevice(row as Parameters<typeof mapAdminDevice>[0]));
  },

  updateDeviceStatus: async (id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<void> => {
    await apiClient.patch(`${API_ENDPOINTS.admin.devices}/${id}/status`, { status });
  },

  listAuditLogs: async (
    params?: ListParams & { action?: string; entityType?: string },
  ): Promise<AuditLog[]> => {
    const { data } = await apiClient.get<PaginatedResponse<unknown>>(API_ENDPOINTS.admin.auditLogs, {
      params: { limit: 500, ...params },
    });
    return data.data.map((row) => mapAdminAuditLog(row as Parameters<typeof mapAdminAuditLog>[0]));
  },

  listRoles: async (): Promise<Role[]> => {
    const { data } = await apiClient.get<{ data: unknown[] }>(API_ENDPOINTS.admin.roles);
    return data.data.map((row) => mapAdminRole(row as Parameters<typeof mapAdminRole>[0]));
  },

  listPermissions: async (): Promise<Permission[]> => {
    const { data } = await apiClient.get<{ data: unknown[] }>(API_ENDPOINTS.admin.permissions);
    return data.data.map((row) => mapPermission(row as Parameters<typeof mapPermission>[0]));
  },
};
