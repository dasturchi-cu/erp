import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const companyCount = useAuthStore((s) => s.companies.length);
  const activeCompanyId = useAuthStore((s) => s.activeCompany?.id ?? null);
  const selectCompany = useAuthStore((s) => s.selectCompany);

  const companySelectStarted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      companySelectStarted.current = false;
      return;
    }

    if (companyCount === 1 && !activeCompanyId && !companySelectStarted.current) {
      companySelectStarted.current = true;
      const companyId = useAuthStore.getState().companies[0]?.id;
      if (companyId) {
        void selectCompany(companyId);
      }
    }
  }, [isAuthenticated, companyCount, activeCompanyId, selectCompany]);

  return <>{children}</>;
}
