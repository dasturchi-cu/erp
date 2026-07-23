import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { mapCompany, mapUser } from '@/api/mappers';
import { getDeviceInfo } from '@/utils/deviceId';
import type { Company } from '@/types';
import type { User } from '@/types/entities';
import type { ModuleCode } from '@/types';

export interface LoginResult {
  user: User;
  companies: Company[];
  permissions: string[];
  modules: ModuleCode[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.login, {
      email,
      password,
      deviceInfo: getDeviceInfo(),
    });
    return {
      user: mapUser(data.user),
      companies: data.companies.map(mapCompany),
      permissions: data.permissions,
      modules: data.modules as ModuleCode[],
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  },

  logout: () => apiClient.post(API_ENDPOINTS.auth.logout),

  me: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.auth.me);
    return {
      user: mapUser(data.user),
      activeCompany: data.activeCompany ? mapCompany(data.activeCompany) : null,
      permissions: data.permissions as string[],
      modules: data.modules as ModuleCode[],
    };
  },

  switchCompany: async (companyId: string) => {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.switchCompany, { companyId });
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      activeCompany: mapCompany(data.activeCompany),
      permissions: data.permissions as string[],
      modules: data.modules as ModuleCode[],
    };
  },

  refresh: async (refreshToken: string): Promise<LoginResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.refresh, { refreshToken });
    return {
      user: mapUser(data.user),
      companies: data.companies.map(mapCompany),
      permissions: data.permissions,
      modules: data.modules as ModuleCode[],
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  },
};
