import { create } from 'zustand';
import { saasApi } from '@/api/services/saasApi';

interface SaaSState {
  admin: { id: string; email: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useSaaSStore = create<SaaSState>((set) => ({
  admin: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password, rememberMe) => {
    set({ loading: true, error: null });
    try {
      const data = await saasApi.login(email, password, rememberMe);
      localStorage.setItem('saas_access_token', data.accessToken);
      localStorage.setItem('saas_refresh_token', data.refreshToken);
      set({ admin: data.admin, isAuthenticated: true, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Tizimga kirishda xatolik yuz berdi';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('saas_access_token');
    localStorage.removeItem('saas_refresh_token');
    set({ admin: null, isAuthenticated: false });
  },

  initialize: () => {
    const accessToken = localStorage.getItem('saas_access_token');
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        set({
          admin: { id: payload.sub, email: payload.email },
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('saas_access_token');
        localStorage.removeItem('saas_refresh_token');
      }
    }
  },
}));

// Listen to global logout events triggered by refresh token failures
if (typeof window !== 'undefined') {
  window.addEventListener('saas-logout', () => {
    useSaaSStore.getState().logout();
  });
}
