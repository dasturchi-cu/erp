export * from './api';
export * from './entities';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DashboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type CurrencyMode = 'UZS' | 'USD' | 'both';

export type ModuleCode =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'admin'
  | 'notifications';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  permission?: string;
  module?: ModuleCode;
  children?: NavItem[];
}
