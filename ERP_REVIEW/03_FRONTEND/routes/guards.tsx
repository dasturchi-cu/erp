import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/config/permissions';
import { routePermissions } from '@/config/navigation';
import { PermissionDeniedPage } from '@/pages/PermissionDeniedPage';
import { getHomePathForRole } from '@/utils/auth';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';

export function AuthGuard() {
  const { isAuthenticated, activeCompany, companies } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (companies.length > 1 && !activeCompany && location.pathname !== '/company-select') {
    return <Navigate to="/company-select" replace />;
  }

  if (companies.length === 1 && !activeCompany) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
        <CircularProgress aria-label="Kompaniya yuklanmoqda" />
      </Box>
    );
  }

  return <Outlet />;
}

export function GuestGuard() {
  const { isAuthenticated, activeCompany, companies } = useAuthStore();

  if (isAuthenticated) {
    if (companies.length > 1 && !activeCompany) {
      return <Navigate to="/company-select" replace />;
    }
    if (activeCompany) {
      return <Navigate to={getHomePathForRole(activeCompany.role)} replace />;
    }
  }

  return <Outlet />;
}

export function PermissionGuard({ permission }: { permission?: string }) {
  const permissions = useEffectivePermissions();
  const enabledModules = useAuthStore((s) => s.enabledModules);
  const location = useLocation();

  if (!permission) return <Outlet />;

  const module = location.pathname.split('/')[1];
  if (module && !enabledModules.includes(module as never) && module !== 'sales') {
    return <PermissionDeniedPage />;
  }

  if (!hasPermission(permissions, permission)) {
    return <PermissionDeniedPage />;
  }

  return <Outlet />;
}

export function RoutePermissionGuard() {
  const location = useLocation();
  const permissions = useEffectivePermissions();
  const role = useAuthStore((s) => s.activeCompany?.role ?? s.user?.role);

  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  let perm =
    routePermissions[location.pathname] ??
    routePermissions[basePath];

  if (!perm && location.pathname.endsWith('/edit')) {
    if (basePath === '/products') perm = 'products.update';
    if (basePath === '/customers') perm = 'customers.update';
    if (basePath === '/suppliers') perm = 'suppliers.update';
  }

  if (!perm && location.pathname.endsWith('/payment')) {
    perm = basePath === '/suppliers' ? 'suppliers.payment' : 'debt.payment';
  }

  if (!perm && basePath === '/suppliers') {
    if (location.pathname.endsWith('/edit')) perm = 'suppliers.update';
    else if (location.pathname === '/suppliers/new') perm = 'suppliers.create';
    else if (
      location.pathname !== '/suppliers' &&
      location.pathname !== '/suppliers/payments' &&
      location.pathname !== '/suppliers/new'
    ) {
      perm = 'suppliers.view';
    }
  }

  if (!perm && location.pathname === '/sales/returns/new') {
    perm = 'sales.return';
  }

  if (perm && !hasPermission(permissions, perm)) {
    const home = getHomePathForRole(role);
    const homePerm =
      routePermissions[home] ??
      routePermissions['/' + home.split('/').filter(Boolean)[0]];

    if (
      location.pathname !== home &&
      (!homePerm || hasPermission(permissions, homePerm))
    ) {
      return <Navigate to={home} replace />;
    }

    return <PermissionDeniedPage />;
  }

  return <Outlet />;
}
