import type { UserRole } from '@/types';

export const ALL_PERMISSIONS = [
  'admin.*',
  'dashboard.view',
  'sales.create',
  'sales.view',
  'sales.view_all',
  'sales.return',
  'sales.cancel',
  'products.view',
  'products.create',
  'products.update',
  'inventory.view',
  'inventory.receive',
  'inventory.adjust',
  'customers.view',
  'customers.create',
  'customers.update',
  'debt.view',
  'debt.payment',
  'suppliers.view',
  'suppliers.create',
  'suppliers.update',
  'suppliers.payment',
  'reports.view',
  'analytics.view',
  'settings.view',
  'currency.manage',
  'notifications.view',
  'notifications.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['admin.*', 'dashboard.view', 'sales.create', 'sales.view', 'sales.view_all', 'sales.return', 'sales.cancel', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.receive', 'inventory.adjust', 'customers.view', 'customers.create', 'customers.update', 'debt.view', 'debt.payment', 'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.payment', 'reports.view', 'analytics.view', 'settings.view', 'currency.manage', 'notifications.view', 'notifications.manage'],
  manager: ['dashboard.view', 'sales.create', 'sales.view', 'sales.view_all', 'sales.return', 'sales.cancel', 'products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.receive', 'inventory.adjust', 'customers.view', 'customers.create', 'customers.update', 'debt.view', 'debt.payment', 'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.payment', 'reports.view', 'analytics.view', 'settings.view', 'currency.manage', 'notifications.view'],
  cashier: ['sales.create', 'sales.view', 'sales.return', 'products.view', 'customers.view', 'customers.create', 'customers.update', 'debt.view', 'debt.payment', 'notifications.view'],
  warehouse: ['products.view', 'products.create', 'products.update', 'inventory.view', 'inventory.receive', 'inventory.adjust', 'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.payment'],
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
