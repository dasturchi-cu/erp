export const APP_VERSION = '2.0.0';

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const TOPBAR_HEIGHT = 56;
export const BREADCRUMB_HEIGHT = 40;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  warehouse: 'Warehouse',
};

export const ROLE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  admin: 'primary',
  manager: 'info',
  cashier: 'success',
  warehouse: 'warning',
};
