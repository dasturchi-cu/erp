import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function CurrencyBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().hydrateSession();
  }, []);

  return <>{children}</>;
}
