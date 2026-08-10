import { createHashRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { CompanySelectPage } from '@/pages/CompanySelectPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DeviceBlockedPage } from '@/pages/DeviceBlockedPage';
import { SessionExpiredPage } from '@/pages/SessionExpiredPage';
import { PermissionDeniedPage } from '@/pages/PermissionDeniedPage';
import { DownloadPage } from '@/pages/DownloadPage';
import { AuthGuard, GuestGuard, RoutePermissionGuard } from '@/routes/guards';
import { DefaultHomeRedirect } from '@/routes/DefaultHomeRedirect';
import { lazy, Suspense, useEffect } from 'react';
import { useSaaSStore } from '@/stores/saasStore';

const SaaSAppShell = lazy(() => import('@/layouts/SaaSAppShell'));
const SaaSLoginPage = lazy(() => import('@/features/super-admin/SaaSLoginPage'));
const SaaSDashboardPage = lazy(() => import('@/features/super-admin/SaaSDashboardPage'));
const SaaSCompaniesPage = lazy(() => import('@/features/super-admin/SaaSCompaniesPage'));
const SaaSCompanyProfilePage = lazy(() => import('@/features/super-admin/SaaSCompanyProfilePage'));
const SaaSSettingsPage = lazy(() => import('@/features/super-admin/SaaSSettingsPage'));
const SaaSReleasesPage = lazy(() => import('@/features/super-admin/SaaSReleasesPage'));

export function SaaSAuthGuard() {
  const { isAuthenticated, initialize } = useSaaSStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthenticated && !localStorage.getItem('saas_access_token')) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return <Outlet />;
}
import { ProductsPage } from '@/features/products/ProductsPage';
import { CategoriesPage } from '@/features/products/CategoriesPage';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';
import { ProductFormPage } from '@/features/products/ProductFormPage';
import { PriceManagementPage } from '@/features/products/PriceManagementPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { WarehousesPage } from '@/features/inventory/WarehousesPage';
import { StockMovementsPage } from '@/features/inventory/StockMovementsPage';
import { InventoryReceivePage } from '@/features/inventory/InventoryReceivePage';
import { InventoryAdjustmentsPage } from '@/features/inventory/InventoryAdjustmentsPage';
import { TransferPage } from '@/features/inventory/TransferPage';
import { InventoryBatchesPage } from '@/features/inventory/InventoryBatchesPage';
import { SalesPosPage } from '@/features/sales/SalesPosPage';
import { SalesHistoryPage } from '@/features/sales/SalesHistoryPage';
import { SaleDetailPage } from '@/features/sales/SaleDetailPage';
import { ReceiptPage } from '@/features/sales/ReceiptPage';
import { ReturnsPage } from '@/features/sales/ReturnsPage';
import { ReturnDetailPage } from '@/features/sales/ReturnDetailPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { CustomerFormPage } from '@/features/customers/CustomerFormPage';
import { CustomerProfilePage } from '@/features/customers/CustomerProfilePage';
import { CustomerDebtPage } from '@/features/customers/CustomerDebtPage';
import { PaymentsPage } from '@/features/customers/PaymentsPage';
import { RecordPaymentPage } from '@/features/customers/RecordPaymentPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { SupplierFormPage } from '@/features/suppliers/SupplierFormPage';
import { SupplierProfilePage } from '@/features/suppliers/SupplierProfilePage';
import { SupplierPaymentsPage } from '@/features/suppliers/SupplierPaymentsPage';
import { RecordSupplierPaymentPage } from '@/features/suppliers/RecordSupplierPaymentPage';
import { CreateReturnPage } from '@/features/sales/CreateReturnPage';
import { WarehouseDetailPage } from '@/features/inventory/WarehouseDetailPage';
import { CurrencyPage } from '@/features/finance/CurrencyPage';
import { ExpensesPage } from '@/features/finance/ExpensesPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { AnalyticsPage } from '@/features/reports/AnalyticsPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AdminHomePage } from '@/features/admin/AdminHomePage';
import { UsersPage } from '@/features/admin/UsersPage';
import { RolesPage } from '@/features/admin/RolesPage';
import { PermissionsPage } from '@/features/admin/PermissionsPage';
import { DevicesPage } from '@/features/admin/DevicesPage';
import { SessionsPage } from '@/features/admin/SessionsPage';
import { AuditLogsPage } from '@/features/admin/AuditLogsPage';
import { BackupCenterPage } from '@/features/admin/BackupCenterPage';
import { MonitoringPage } from '@/features/admin/MonitoringPage';
import { LogViewerPage } from '@/features/admin/LogViewerPage';

const shellRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/sales/new', element: <SalesPosPage /> },
  { path: '/sales/history', element: <SalesHistoryPage /> },
  { path: '/sales/history/:id', element: <SaleDetailPage /> },
  { path: '/sales/receipt/:id', element: <ReceiptPage /> },
  { path: '/sales/returns/new', element: <CreateReturnPage /> },
  { path: '/sales/returns', element: <ReturnsPage /> },
  { path: '/sales/returns/:id', element: <ReturnDetailPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/products/new', element: <ProductFormPage /> },
  { path: '/products/categories', element: <CategoriesPage /> },
  { path: '/products/prices', element: <PriceManagementPage /> },
  { path: '/products/:id/edit', element: <ProductFormPage /> },
  { path: '/products/:id', element: <ProductDetailPage /> },
  { path: '/inventory', element: <InventoryPage /> },
  { path: '/inventory/warehouses', element: <WarehousesPage /> },
  { path: '/inventory/warehouses/:id', element: <WarehouseDetailPage /> },
  { path: '/inventory/movements', element: <StockMovementsPage /> },
  { path: '/inventory/receive', element: <InventoryReceivePage /> },
  { path: '/inventory/transfers', element: <TransferPage /> },
  { path: '/inventory/batches', element: <InventoryBatchesPage /> },
  { path: '/inventory/adjustments', element: <InventoryAdjustmentsPage /> },
  { path: '/customers', element: <CustomersPage /> },
  { path: '/customers/new', element: <CustomerFormPage /> },
  { path: '/customers/debt', element: <CustomerDebtPage /> },
  { path: '/customers/payments', element: <PaymentsPage /> },
  { path: '/customers/:id/edit', element: <CustomerFormPage /> },
  { path: '/customers/:id/payment', element: <RecordPaymentPage /> },
  { path: '/customers/:id', element: <CustomerProfilePage /> },
  { path: '/suppliers', element: <SuppliersPage /> },
  { path: '/suppliers/new', element: <SupplierFormPage /> },
  { path: '/suppliers/payments', element: <SupplierPaymentsPage /> },
  { path: '/suppliers/:id/edit', element: <SupplierFormPage /> },
  { path: '/suppliers/:id/payment', element: <RecordSupplierPaymentPage /> },
  { path: '/suppliers/:id', element: <SupplierProfilePage /> },
  { path: '/reports', element: <ReportsPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/settings/exchange-rates', element: <CurrencyPage /> },
  { path: '/expenses', element: <ExpensesPage /> },
  { path: '/admin', element: <AdminHomePage /> },
  { path: '/admin/users', element: <UsersPage /> },
  { path: '/admin/roles', element: <RolesPage /> },
  { path: '/admin/permissions', element: <PermissionsPage /> },
  { path: '/admin/devices', element: <DevicesPage /> },
  { path: '/admin/sessions', element: <SessionsPage /> },
  { path: '/admin/audit-logs', element: <AuditLogsPage /> },
  { path: '/admin/backup', element: <BackupCenterPage /> },
  { path: '/admin/monitoring', element: <MonitoringPage /> },
  { path: '/admin/logs', element: <LogViewerPage /> },
  { path: '/permission-denied', element: <PermissionDeniedPage /> },
];

export const router = createHashRouter([
  { path: '/', element: <DefaultHomeRedirect /> },
  {
    path: '/super-admin/login',
    element: (
      <Suspense fallback={<div>Yuklanmoqda...</div>}>
        <SaaSLoginPage />
      </Suspense>
    ),
  },
  {
    element: <SaaSAuthGuard />,
    children: [
      {
        element: (
          <Suspense fallback={<div>Yuklanmoqda...</div>}>
            <SaaSAppShell />
          </Suspense>
        ),
        children: [
          {
            path: '/super-admin/dashboard',
            element: (
              <Suspense fallback={<div>Yuklanmoqda...</div>}>
                <SaaSDashboardPage />
              </Suspense>
            ),
          },
          {
            path: '/super-admin/companies',
            element: (
              <Suspense fallback={<div>Yuklanmoqda...</div>}>
                <SaaSCompaniesPage />
              </Suspense>
            ),
          },
          {
            path: '/super-admin/company/:id',
            element: (
              <Suspense fallback={<div>Yuklanmoqda...</div>}>
                <SaaSCompanyProfilePage />
              </Suspense>
            ),
          },
          {
            path: '/super-admin/settings',
            element: (
              <Suspense fallback={<div>Yuklanmoqda...</div>}>
                <SaaSSettingsPage />
              </Suspense>
            ),
          },
          {
            path: '/super-admin/versions',
            element: (
              <Suspense fallback={<div>Yuklanmoqda...</div>}>
                <SaaSReleasesPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <GuestGuard />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/download', element: <DownloadPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/device-blocked', element: <DeviceBlockedPage /> },
      { path: '/session-expired', element: <SessionExpiredPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      { path: '/company-select', element: <CompanySelectPage /> },
      {
        element: <RoutePermissionGuard />,
        children: [
          {
            element: <AppShell />,
            children: shellRoutes,
          },
        ],
      },
    ],
  },
  { path: '*', element: <DefaultHomeRedirect /> },
]);
