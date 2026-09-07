import type { UserRole } from '@/types';

// Mirrors backend/prisma/seed.ts PERMISSIONS exactly — this is the fallback
// used only when the login response carries no permissions array (see
// useEffectivePermissions), so drift here would silently over/under-grant
// access on that rare path. Keep it in sync with the backend seed.
export const ALL_PERMISSIONS = [
  'admin.*',
  'admin.users.view',
  'admin.users.create',
  'admin.users.manage',
  'admin.audit.view',
  'dashboard.view',
  'sales.view',
  'sales.view_all',
  'sales.create',
  'sales.cancel',
  'sales.return',
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'categories.manage',
  'inventory.view',
  'inventory.receive',
  'inventory.adjust',
  'inventory.transfer',
  'warehouses.manage',
  'customers.view',
  'customers.create',
  'customers.update',
  'customers.delete',
  'debt.view',
  'debt.payment',
  'debt.reverse',
  'debt.aging',
  'debt.aging.export',
  'suppliers.view',
  'suppliers.create',
  'suppliers.update',
  'suppliers.delete',
  'suppliers.payment',
  'currency.view',
  'currency.manage',
  'reports.view',
  'reports.generate',
  'reports.sales',
  'reports.inventory',
  'reports.debt',
  'reports.financial',
  'reports.audit',
  'analytics.view',
  // NOTE: 'settings.view' is referenced by routePermissions['/settings'] but
  // the backend (backend/prisma/seed.ts) never actually issues this code to
  // any role — only Admin can reach /settings today, via the admin.*
  // wildcard in hasPermission(). Kept here for the Permission type only; it
  // is deliberately excluded from every role's fallback list below so this
  // table stays truthful to what the backend actually grants.
  'settings.view',
  'notifications.view',
  'notifications.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const MANAGER_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !p.startsWith('admin.') && p !== 'settings.view',
) as Permission[];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: MANAGER_PERMISSIONS,
  cashier: [
    'products.view', 'inventory.view', 'sales.view', 'sales.create', 'sales.return',
    'customers.view', 'customers.create', 'debt.view', 'debt.payment', 'debt.aging',
    'currency.view', 'dashboard.view', 'reports.view', 'reports.generate', 'reports.sales',
    'reports.inventory', 'reports.debt', 'reports.financial', 'analytics.view', 'notifications.view',
  ],
  warehouse: [
    'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.receive',
    'inventory.adjust', 'inventory.transfer', 'warehouses.manage', 'suppliers.view', 'suppliers.create',
    'suppliers.update', 'suppliers.payment',
  ],
};

export const DEFAULT_MODULES = [
  'dashboard',
  'sales',
  'products',
  'inventory',
  'customers',
  'suppliers',
  'reports',
  'analytics',
  'settings',
  'admin',
  'notifications',
] as const;

export type ModuleCode = (typeof DEFAULT_MODULES)[number];

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('admin.*')) return true;
  if (permissions.includes(required)) return true;
  const [module] = required.split('.');
  return permissions.includes(`${module}.*`);
}

export function canAccessRoute(permissions: string[], routePermission?: string): boolean {
  if (!routePermission) return true;
  return hasPermission(permissions, routePermission);
}
