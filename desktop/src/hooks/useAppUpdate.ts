import { useCallback, useEffect, useState } from 'react';
import { apiClient, API_BASE_URL } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

interface UpdateCheckResponse {
  updateRequired?: boolean;
  releaseId?: string;
  latestVersion?: string;
  changelog?: string;
  downloadUrl?: string;
  checksum?: string;
  signature?: string | null;
}

export type UpdateInstallState =
  | { step: 'idle' }
  | { step: 'downloading' }
  | { step: 'installing' }
  | { step: 'error'; message: string };

/**
 * Checks the SaaS release system for a newer desktop build. Only runs
 * inside the packaged Electron app (window.electronAPI) — there's nothing
 * to install from a plain browser tab, e.g. during `vite` dev/preview.
 */
function reportProgress(payload: {
  companyId: string;
  releaseId: string;
  previousVersion: string;
  currentVersion: string;
  status: string;
  failureReason?: string;
}) {
  // Best-effort — a failed progress report must never block the actual
  // update flow, so this is deliberately fire-and-forget with its own catch.
  apiClient.post('/saas/updates/report', payload).catch(() => undefined);
}

export function useAppUpdate() {
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const [available, setAvailable] = useState<UpdateCheckResponse | null>(null);
  const [installState, setInstallState] = useState<UpdateInstallState>({ step: 'idle' });
  const [dismissed, setDismissed] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('0.0.0');

  useEffect(() => {
    if (!window.electronAPI?.downloadUpdate || !activeCompany?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const version = (await window.electronAPI!.getAppVersion?.()) ?? '0.0.0';
        if (cancelled) return;
        setCurrentVersion(version);
        const res = await apiClient.get<UpdateCheckResponse>('/saas/updates/check', {
          params: { currentVersion: version, companyId: activeCompany.id, platform: 'desktop' },
        });
        if (!cancelled && res.data?.updateRequired) {
          setAvailable(res.data);
        }
      } catch {
        // No update endpoint reachable / no releases yet — not worth surfacing to the user.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCompany?.id]);

  const install = useCallback(async () => {
    if (!available?.downloadUrl || !available.checksum || !window.electronAPI || !activeCompany?.id) return;
    const progressBase = {
      companyId: activeCompany.id,
      releaseId: available.releaseId ?? '',
      previousVersion: currentVersion,
      currentVersion: available.latestVersion ?? currentVersion,
    };
    setInstallState({ step: 'downloading' });
    reportProgress({ ...progressBase, status: 'UPDATING' });
    try {
      const origin = new URL(API_BASE_URL).origin;
      const fullUrl = new URL(available.downloadUrl, origin).toString();
      const filePath = await window.electronAPI.downloadUpdate!(fullUrl, available.checksum);
      setInstallState({ step: 'installing' });
      await window.electronAPI.installUpdate!(filePath);
      // If we're still here, the app didn't quit as expected — treat it as a failure
      // rather than leaving the banner stuck on "installing" forever.
      const message = 'O\'rnatish boshlanmadi. Qo\'lda yuklab oling.';
      reportProgress({ ...progressBase, status: 'FAILED', failureReason: message });
      setInstallState({ step: 'error', message });
    } catch (err: any) {
      const message = err?.message || 'Yangilanishni yuklab bo\'lmadi. Qo\'lda urinib ko\'ring.';
      reportProgress({ ...progressBase, status: 'FAILED', failureReason: message });
      setInstallState({ step: 'error', message });
    }
  }, [available, activeCompany?.id, currentVersion]);

  return {
    isElectron: Boolean(window.electronAPI?.downloadUpdate),
    available: dismissed ? null : available,
    installState,
    install,
    dismiss: () => setDismissed(true),
  };
}
