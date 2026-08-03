import type { NavItem, ModuleCode } from '@/types';

export interface NavGroup {
  id: string;
  label: string;
  module: ModuleCode;
  items: NavItem[];
}

export const mainNavigation: NavGroup[] = [
  {
    id: 'main',
    label: 'Asosiy',
    module: 'dashboard',
    items: [
      { id: 'dashboard', label: 'Boshqaruv paneli', path: '/dashboard', icon: 'Dashboard', permission: 'dashboard.view' },
    ],
  },
  {
    id: 'commerce',
    label: 'Savdo',
    module: 'sales',
    items: [
      { id: 'sales-pos', label: 'Yangi sotuv (POS)', path: '/sales/new', icon: 'PointOfSale', permission: 'sales.create' },
      { id: 'sales-history', label: 'Sotuvlar tarixi', path: '/sales/history', icon: 'Receipt', permission: 'sales.view' },
      { id: 'returns', label: 'Qaytarishlar', path: '/sales/returns', icon: 'Undo', permission: 'sales.return' },
    ],
  },
  {
    id: 'catalog',
    label: 'Katalog',
    module: 'products',
    items: [
      { id: 'products', label: 'Mahsulotlar', path: '/products', icon: 'Category', permission: 'products.view' },
      { id: 'categories', label: 'Kategoriyalar', path: '/products/categories', icon: 'Folder', permission: 'products.view' },
      { id: 'prices', label: 'Narx boshqaruvi', path: '/products/prices', icon: 'Price', permission: 'products.update' },
    ],
  },
  {
    id: 'warehouse',
    label: 'Ombor',
    module: 'inventory',
    items: [
      { id: 'inventory', label: 'Zaxira', path: '/inventory', icon: 'Inventory', permission: 'inventory.view' },
      { id: 'warehouses', label: 'Omborxonalar', path: '/inventory/warehouses', icon: 'Warehouse', permission: 'inventory.view' },
      { id: 'movements', label: 'Harakatlar', path: '/inventory/movements', icon: 'SwapHoriz', permission: 'inventory.view' },
      { id: 'transfers', label: 'O\'tkazmalar', path: '/inventory/transfers', icon: 'Transfer', permission: 'inventory.transfer' },
      { id: 'receive', label: 'Qabul qilish', path: '/inventory/receive', icon: 'Receive', permission: 'inventory.receive' },
      { id: 'batches', label: 'Partiyalar', path: '/inventory/batches', icon: 'Batch', permission: 'inventory.view' },
      { id: 'adjustments', label: 'Tuzatishlar', path: '/inventory/adjustments', icon: 'Adjust', permission: 'inventory.adjust' },
    ],
  },
  {
    id: 'suppliers',
    label: 'Firmalar',
    module: 'suppliers',
    items: [
      { id: 'suppliers-list', label: 'Firmalar', path: '/suppliers', icon: 'Business', permission: 'suppliers.view' },
      { id: 'supplier-payments', label: "To'lovlar", path: '/suppliers/payments', icon: 'Payments', permission: 'suppliers.payment' },
    ],
  },
  {
    id: 'crm',
    label: 'Mijozlar',
    module: 'customers',
    items: [
      { id: 'customers', label: 'Mijozlar', path: '/customers', icon: 'People', permission: 'customers.view' },
      { id: 'debt', label: 'Qarzdorlik', path: '/customers/debt', icon: 'AccountBalance', permission: 'debt.view' },
      { id: 'payments', label: "To'lovlar", path: '/customers/payments', icon: 'Payments', permission: 'debt.payment' },
    ],
  },
  {
    id: 'finance',
    label: 'Moliya',
    module: 'sales',
    items: [
      { id: 'expenses', label: 'Xarajatlar', path: '/expenses', icon: 'Payments', permission: 'sales.view' },
    ],
  },
  {
    id: 'analytics',
    label: 'Hisobotlar',
    module: 'reports',
    items: [
      { id: 'reports', label: 'Hisobotlar', path: '/reports', icon: 'Assessment', permission: 'reports.view' },
      { id: 'analytics', label: 'Analitika', path: '/analytics', icon: 'Insights', permission: 'reports.view' },
    ],
  },
  {
    id: 'system',
    label: 'Tizim',
    module: 'settings',
    items: [
      { id: 'notifications', label: 'Bildirishnomalar', path: '/notifications', icon: 'Notifications', permission: 'notifications.view', module: 'notifications' },
      { id: 'settings', label: 'Sozlamalar', path: '/settings', icon: 'Settings', permission: 'settings.view' },
      { id: 'currency', label: 'Valyuta kursi', path: '/settings/exchange-rates', icon: 'Currency', permission: 'currency.manage' },
      { id: 'admin', label: 'Boshqaruv', path: '/admin', icon: 'AdminPanelSettings', permission: 'admin.*', module: 'admin' },
      { id: 'saas-admin', label: 'SaaS Super Admin', path: '/super-admin/login', icon: 'AdminPanelSettings' },
    ],
  },
];

export const routeLabels: Record<string, string> = {
  dashboard: 'Boshqaruv paneli',
  sales: 'Savdo',
  new: 'Yangi sotuv',
  history: 'Tarix',
  returns: 'Qaytarishlar',
  receipt: 'Chek',
  products: 'Mahsulotlar',
  categories: 'Kategoriyalar',
  prices: 'Narx boshqaruvi',
  inventory: 'Zaxira',
  warehouses: 'Omborxonalar',
  movements: 'Harakatlar',
  transfers: 'O\'tkazmalar',
  receive: 'Qabul qilish',
  batches: 'Partiyalar',
  adjustments: 'Tuzatishlar',
  customers: 'Mijozlar',
  suppliers: 'Firmalar',
  debt: 'Qarzdorlik',
  payments: "To'lovlar",
  payment: "To'lov qilish",
  reports: 'Hisobotlar',
  analytics: 'Analitika',
  notifications: 'Bildirishnomalar',
  settings: 'Sozlamalar',
  admin: 'Boshqaruv',
  users: 'Foydalanuvchilar',
  roles: 'Rollar',
  permissions: 'Ruxsatlar',
  devices: 'Qurilmalar',
  sessions: 'Sessiyalar',
  'audit-logs': 'Audit jurnali',
  backup: 'Zaxira nusxa',
  monitoring: 'Monitoring',
  logs: 'Log ko\'ruvchi',
  'exchange-rates': 'Valyuta kursi',
  edit: 'Tahrirlash',
  expenses: 'Xarajatlar',
  'forgot-password': 'Parolni tiklash',
  'device-blocked': 'Qurilma bloklangan',
  'session-expired': 'Sessiya tugadi',
  'permission-denied': 'Ruxsat yo\'q',
};

export const routePermissions: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/sales/new': 'sales.create',
  '/sales/history': 'sales.view',
  '/expenses': 'sales.view',
  '/sales/returns/new': 'sales.return',
  '/sales/returns': 'sales.return',
  '/products': 'products.view',
  '/products/categories': 'products.view',
  '/products/prices': 'products.update',
  '/products/new': 'products.create',
  '/inventory': 'inventory.view',
  '/inventory/receive': 'inventory.receive',
  '/inventory/adjustments': 'inventory.adjust',
  '/customers': 'customers.view',
  '/customers/new': 'customers.create',
  '/customers/debt': 'debt.view',
  '/customers/payments': 'debt.payment',
  '/suppliers': 'suppliers.view',
  '/suppliers/new': 'suppliers.create',
  '/suppliers/payments': 'suppliers.payment',
  '/reports': 'reports.view',
  '/analytics': 'reports.view',
  '/settings': 'settings.view',
  '/settings/exchange-rates': 'currency.manage',
  '/admin': 'admin.*',
  '/notifications': 'notifications.view',
};
