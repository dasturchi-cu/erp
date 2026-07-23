import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyMode, DashboardPeriod } from '@/types';

interface UiState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  dashboardPeriod: DashboardPeriod;
  currencyMode: CurrencyMode;
  selectedBranch: string;
  lastUpdated: Date | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setDashboardPeriod: (period: DashboardPeriod) => void;
  setCurrencyMode: (mode: CurrencyMode) => void;
  setSelectedBranch: (branch: string) => void;
  refreshDashboard: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: true,
      dashboardPeriod: 'daily',
      currencyMode: 'both',
      selectedBranch: 'all',
      lastUpdated: new Date(),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setDashboardPeriod: (period) => set({ dashboardPeriod: period }),
      setCurrencyMode: (mode) => set({ currencyMode: mode }),
      setSelectedBranch: (branch) => set({ selectedBranch: branch }),
      refreshDashboard: () => set({ lastUpdated: new Date() }),
    }),
    {
      name: 'erp-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        dashboardPeriod: state.dashboardPeriod,
        currencyMode: state.currencyMode,
        selectedBranch: state.selectedBranch,
      }),
    },
  ),
);
