import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getHomePathForRole } from '@/utils/auth';
import { isSaasPortal } from '@/utils/portal';

export function DefaultHomeRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const companies = useAuthStore((s) => s.companies);
  const user = useAuthStore((s) => s.user);

  // The web deployment (Vercel) serves the SaaS admin panel only — never the
  // store UI, even for a stale store session in localStorage.
  if (isSaasPortal()) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (companies.length > 1 && !activeCompany) {
    return <Navigate to="/company-select" replace />;
  }

  const role = activeCompany?.role ?? user?.role;
  return <Navigate to={getHomePathForRole(role)} replace />;
}
