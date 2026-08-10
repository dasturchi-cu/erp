import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getHomePathForRole } from '@/utils/auth';

export function DefaultHomeRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const companies = useAuthStore((s) => s.companies);
  const user = useAuthStore((s) => s.user);

  // On the Vercel web deployment we set VITE_DEFAULT_PORTAL=saas so the site
  // lands on the SaaS admin panel; the packaged desktop .exe leaves it unset
  // and lands on the store login.
  const defaultPortal = import.meta.env.VITE_DEFAULT_PORTAL as string | undefined;

  if (!isAuthenticated) {
    if (defaultPortal === 'saas') {
      return <Navigate to="/super-admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (companies.length > 1 && !activeCompany) {
    return <Navigate to="/company-select" replace />;
  }

  const role = activeCompany?.role ?? user?.role;
  return <Navigate to={getHomePathForRole(role)} replace />;
}
