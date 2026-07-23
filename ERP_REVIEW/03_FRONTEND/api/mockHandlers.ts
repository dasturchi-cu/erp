import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '@/api/endpoints';

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  };
}

function parsePath(url: string): string {
  const base = url.replace(/^\/api\/v1/, '').split('?')[0];
  return base.startsWith('/') ? base : `/${base}`;
}

/**
 * Legacy mock adapter — stale paths removed. Real API is default (VITE_USE_MOCK=false).
 * Login still delegates to authStore for offline smoke tests.
 */
export async function handleMockRequest(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> {
  await new Promise((r) => setTimeout(r, 100));

  const method = (config.method ?? 'get').toLowerCase();
  const path = parsePath(config.url ?? '');

  if (method === 'post' && path === API_ENDPOINTS.auth.login) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data ?? {};
    const { useAuthStore } = await import('@/stores/authStore');
    await useAuthStore.getState().login(body.email, body.password);
    const state = useAuthStore.getState();
    if (state.error) {
      return ok(config, { error: { code: 'INVALID_CREDENTIALS', message: state.error } }, 401);
    }
    return ok(config, {
      user: state.user,
      companies: state.companies,
      accessToken: state.tokens?.accessToken,
      refreshToken: state.tokens?.refreshToken,
      permissions: state.permissions,
      modules: state.enabledModules,
      expiresIn: 900,
    });
  }

  return ok(
    config,
    {
      error: {
        code: 'MOCK_NOT_IMPLEMENTED',
        message: `Mock handler unavailable for ${method.toUpperCase()} ${path}. Set VITE_USE_MOCK=false.`,
      },
    },
    501,
  );
}
