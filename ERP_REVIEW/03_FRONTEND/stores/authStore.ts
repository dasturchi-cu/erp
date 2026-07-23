import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/services/authApi';
import type { AuthTokens, Company, ModuleCode } from '@/types';
import type { User } from '@/types/entities';
import { DEFAULT_MODULES } from '@/config/permissions';

interface AuthState {
  user: User | null;
  companies: Company[];
  activeCompany: Company | null;
  tokens: AuthTokens | null;
  permissions: string[];
  enabledModules: ModuleCode[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberDevice: boolean;
  rememberCompanyChoice: boolean;
  lastCompanyId: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectCompany: (companyId: string) => Promise<void>;
  hydrateSession: () => Promise<void>;
  clearError: () => void;
  setRememberDevice: (value: boolean) => void;
  setRememberCompanyChoice: (value: boolean) => void;
}

function applyLoginResult(
  set: (partial: Partial<AuthState>) => void,
  result: Awaited<ReturnType<typeof authApi.login>>,
  companies: Company[],
) {
  const activeCompany =
    companies.length === 1 ? companies[0]! : null;

  set({
    user: result.user,
    companies,
    activeCompany,
    tokens: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    permissions: result.permissions,
    enabledModules: result.modules.length ? result.modules : [...DEFAULT_MODULES],
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      companies: [],
      activeCompany: null,
      tokens: null,
      permissions: [],
      enabledModules: [...DEFAULT_MODULES],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberDevice: true,
      rememberCompanyChoice: true,
      lastCompanyId: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authApi.login(email, password);
          applyLoginResult(set, result, result.companies);
        } catch (err: unknown) {
          const message = (err as { message?: string; code?: string }).message ?? 'Kirish muvaffaqiyatsiz';
          const code = (err as { code?: string }).code;
          if (code === 'USER_BLOCKED' || code === 'DEVICE_BLOCKED') {
            set({ isLoading: false, error: 'BLOCKED' });
            return;
          }
          set({ isLoading: false, error: message });
        }
      },

      logout: async () => {
        try {
          if (get().tokens?.accessToken) {
            await authApi.logout();
          }
        } catch {
          // ignore network errors on logout
        }
        set({
          user: null,
          companies: [],
          activeCompany: null,
          tokens: null,
          permissions: [],
          isAuthenticated: false,
          error: null,
        });
      },

      selectCompany: async (companyId: string) => {
        const company = get().companies.find((c) => c.id === companyId);
        if (!company) {
          set({ error: 'Bu kompaniyaga kirish huquqingiz yo\'q.' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const result = await authApi.switchCompany(companyId);
          const updates: Partial<AuthState> = {
            activeCompany: result.activeCompany,
            permissions: result.permissions,
            enabledModules: result.modules.length ? result.modules : get().enabledModules,
            tokens: {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
            },
            isLoading: false,
            error: null,
          };
          if (get().rememberCompanyChoice) {
            updates.lastCompanyId = companyId;
          }
          set(updates);
        } catch (err: unknown) {
          set({
            isLoading: false,
            error: (err as { message?: string }).message ?? 'Kompaniya tanlashda xatolik',
          });
        }
      },

      hydrateSession: async () => {
        if (!get().tokens?.accessToken || !get().isAuthenticated) return;
        try {
          const me = await authApi.me();
          set({
            user: me.user,
            activeCompany: me.activeCompany,
            permissions: me.permissions,
            enabledModules: me.modules.length ? me.modules : get().enabledModules,
          });
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      setRememberDevice: (value) => set({ rememberDevice: value }),
      setRememberCompanyChoice: (value) => set({ rememberCompanyChoice: value }),
    }),
    {
      name: 'erp-auth-v2',
      partialize: (state) => ({
        rememberDevice: state.rememberDevice,
        rememberCompanyChoice: state.rememberCompanyChoice,
        lastCompanyId: state.lastCompanyId,
        tokens: state.rememberDevice ? state.tokens : null,
        user: state.rememberDevice ? state.user : null,
        isAuthenticated: state.rememberDevice ? state.isAuthenticated : false,
        companies: state.rememberDevice ? state.companies : [],
        activeCompany: state.rememberDevice ? state.activeCompany : null,
        permissions: state.rememberDevice ? state.permissions : [],
        enabledModules: state.rememberDevice ? state.enabledModules : [],
      }),
    },
  ),
);
