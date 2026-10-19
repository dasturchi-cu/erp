import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/services/authApi';
import { handleMockRequest } from '@/api/mockHandlers';
import { getDeviceId } from '@/utils/deviceId';
import { getPilotScreen, logPilotError, setPilotAction } from '@/lib/pilotErrorLogger';
import type { ApiError, ApiErrorEnvelope } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://erp-backend-production-e88a.up.railway.app/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

if (USE_MOCK_API) {
  apiClient.defaults.adapter = (config) => handleMockRequest(config as InternalAxiosRequestConfig);
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const companyId = useAuthStore.getState().activeCompany?.id;
  if (companyId) {
    config.headers['X-Company-Id'] = companyId;
  }
  config.headers['X-Device-Id'] = getDeviceId();
  const screen = getPilotScreen();
  const action = `${config.method?.toUpperCase() ?? 'GET'} ${config.url ?? ''}`;
  setPilotAction(action);
  config.headers['X-Pilot-Screen'] = screen;
  config.headers['X-Pilot-Action'] = action;
  return config;
});

type RefreshOutcome = 'refreshed' | 'auth_failed' | 'transient';

let refreshPromise: Promise<RefreshOutcome> | null = null;

async function tryRefreshSession(): Promise<RefreshOutcome> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) return 'auth_failed';

  if (!refreshPromise) {
    refreshPromise = authApi
      .refresh(refreshToken)
      .then((result): RefreshOutcome => {
        const companies = result.companies;
        useAuthStore.setState({
          user: result.user,
          companies,
          tokens: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          permissions: result.permissions,
          enabledModules: result.modules.length ? result.modules : useAuthStore.getState().enabledModules,
          isAuthenticated: true,
          error: null,
        });
        return 'refreshed';
      })
      // Only a definitive rejection of the refresh token ends the session; a
      // network error or 5xx (server restarting, offline) keeps it for a retry.
      .catch((err: ApiError): RefreshOutcome =>
        err?.status === 401 || err?.status === 403 ? 'auth_failed' : 'transient',
      )
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorEnvelope | { message?: string; code?: string }>) => {
    const originalConfig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const data = error.response?.data;
    const code =
      data && 'error' in data && data.error
        ? data.error.code
        : (data as { code?: string } | undefined)?.code;
    let refreshOutcome: RefreshOutcome | null = null;

    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !isAuthEndpoint(originalConfig.url)
    ) {
      originalConfig._retry = true;
      refreshOutcome = await tryRefreshSession();
      if (refreshOutcome === 'refreshed') {
        const token = useAuthStore.getState().tokens?.accessToken;
        if (token) {
          originalConfig.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient.request(originalConfig);
      }
      if (refreshOutcome === 'auth_failed') {
        await useAuthStore.getState().logout();
      }
    }

    let apiError: ApiError;

    if (data && 'error' in data && data.error) {
      apiError = {
        message: data.error.message,
        code: data.error.code,
        status: error.response?.status,
        details: data.error.details,
        requestId: data.error.requestId,
      };
    } else {
      const legacy = data as { message?: string; code?: string } | undefined;
      const message =
        legacy?.message ?? error.message ?? 'Tarmoq xatosi yuz berdi';
      apiError = {
        message: Array.isArray(message) ? message.join('; ') : message,
        code: legacy?.code,
        status: error.response?.status,
      };
    }

    if (refreshOutcome === 'transient') {
      apiError.refreshDeferred = true;
    }

    if (!status || status >= 500 || !error.response) {
      logPilotError({
        source: 'api',
        error: apiError.message,
        stackTrace: error.stack ?? null,
        action: `${originalConfig?.method?.toUpperCase() ?? ''} ${originalConfig?.url ?? ''}`,
        requestId: apiError.requestId,
        statusCode: status,
      });
    }

    return Promise.reject(apiError);
  },
);

export { USE_MOCK_API, API_BASE_URL };
