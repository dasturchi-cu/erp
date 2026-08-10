/**
 * Decides which portal this build serves.
 *
 * - The packaged desktop app (.exe) runs inside Electron -> store portal.
 * - The web deployment (Vercel, any browser) -> SaaS admin panel only.
 *
 * An explicit VITE_DEFAULT_PORTAL env var overrides the auto-detection, so a
 * dev can force either mode locally.
 */
export function isSaasPortal(): boolean {
  const env = import.meta.env.VITE_DEFAULT_PORTAL as string | undefined;
  if (env === 'saas') return true;
  if (env === 'store') return false;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isElectron = /electron/i.test(ua);
  // Browser (web/Vercel) -> SaaS admin; Electron (.exe) -> store app.
  return !isElectron;
}
