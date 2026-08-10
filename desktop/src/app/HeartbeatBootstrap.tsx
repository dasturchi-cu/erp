import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { telemetryApi } from '@/api/services/telemetryApi';

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Periodically reports store client telemetry to the SaaS platform so the
 * super-admin dashboard (online/offline, health scores, installed version)
 * reflects real store activity. Runs only while a company session is active.
 */
export function HeartbeatBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.activeCompany?.id) return;
      void telemetryApi.sendHeartbeat().catch(() => {
        // Heartbeat is best-effort; never disrupt the app on failure.
      });
    };

    // Fire once shortly after mount, then on a fixed interval.
    const initial = setTimeout(tick, 5_000);
    timer = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearTimeout(initial);
      if (timer) clearInterval(timer);
    };
  }, []);

  return <>{children}</>;
}
