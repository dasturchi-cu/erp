export type UserRole = 'admin' | 'manager' | 'cashier' | 'warehouse';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleId?: string;
  status: 'active' | 'blocked' | 'inactive';
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  role: UserRole;
  branchCount: number;
  lastAccessedAt: string;
  logoUrl?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  barcode?: string;
  unitOfMeasure: string;
  unitsPerBox: number;
  minStockLevel: number;
  purchasePriceUzs: number;
  purchasePriceUsd: number;
  priceUzs: number;
  priceUsd: number;
  stock: number;
  status: 'active' | 'inactive';
  wholesalePriceUzs?: number;
  wholesalePriceUsd?: number;
  recommendedPriceUzs?: number;
  recommendedPriceUsd?: number;
  minPriceUzs?: number;
  minPriceUsd?: number;
  imageUrl?: string | null;
  pdfCatalogUrl?: string | null;
  techPassportUrl?: string | null;
  userManualUrl?: string | null;
  barcodes?: string[];
  aliases?: string[];
  unitConversions?: Array<{ fromUnit: string; toUnit: string; conversionFactor: number }>;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
  parentId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  branch: string;
  branchId?: string;
  address: string;
  isDefault?: boolean;
  status?: string;
  productCount: number;
  totalValueUzs: number;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: number;
  performedBy: string;
  note?: string | null;
  createdAt: string;
}

export interface StockLevelRow {
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName?: string;
  stock: number;
  batchCount: number;
}

export interface StockMovement {
  id: string;
  type: 'receive' | 'sale' | 'adjustment' | 'transfer';
  productName: string;
  quantity: number;
  warehouse: string;
  createdAt: string;
  user: string;
  note?: string;
}

export interface Sale {
  id: string;
  number: string;
  customerName: string;
  totalUzs: number;
  totalUsd: number;
  paymentType: 'cash' | 'credit' | 'mixed';
  status: 'completed' | 'partially_returned' | 'voided' | 'returned';
  createdAt: string;
  cashier: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  debtUzs: number;
  debtUsd: number;
  totalPurchasesUzs: number;
  status: 'active' | 'blocked' | 'archived';
  lastPurchaseAt?: string;
  createdAt?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amountUzs: number;
  amountUsd: number;
  method: 'cash' | 'card' | 'transfer';
  createdAt: string;
  recordedBy: string;
  note?: string;
}

export interface DebtHistoryEntry {
  id: string;
  customerId: string;
  type: 'sale_credit' | 'payment' | 'return' | 'adjustment' | 'sale_void';
  amountUzs: number;
  amountUsd: number;
  balanceAfterUzs: number;
  balanceAfterUsd: number;
  reference?: string;
  createdAt: string;
  recordedBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  contactPerson?: string;
  notes?: string;
  status: 'active' | 'archived';
  totalDebtUzs: number;
  totalDebtUsd: number;
  totalPaidUzs: number;
  totalPaidUsd: number;
  remainingDebtUzs: number;
  remainingDebtUsd: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierReceipt {
  id: string;
  supplierId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCostUzs: number;
  totalCostUzs: number;
  paymentType: 'cash' | 'credit';
  note?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currency: 'UZS' | 'USD';
  amountUzs: number;
  amountUsd: number;
  exchangeRateUsed: number;
  method: 'cash' | 'card' | 'transfer';
  note?: string;
  createdAt: string;
  recordedBy: string;
}

export interface SupplierDebtHistoryEntry {
  id: string;
  type: string;
  amountUzs: number;
  amountUsd: number;
  balanceAfterUzs: number;
  balanceAfterUsd: number;
  reference?: string;
  createdAt: string;
  recordedBy: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  remaining: number;
  costUzs: number;
  warehouseId: string;
  warehouseName: string;
  receivedAt: string;
}

export interface SaleReturn {
  id: string;
  saleId: string;
  saleNumber: string;
  customerId?: string;
  customerName: string;
  amountUzs: number;
  amountUsd: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    amountUzs: number;
  }>;
}

export interface ExchangeRate {
  id: string;
  rate: number;
  effectiveFrom: string;
  setBy: string;
  status: 'active' | 'archived';
}

export interface ReportItem {
  id: string;
  name: string;
  category: string;
  description: string;
  lastGenerated?: string;
}

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  period: string;
}

export interface AnalyticsChartPoint {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface AnalyticsOverview {
  metrics: AnalyticsMetric[];
  chart: AnalyticsChartPoint[];
  highlights: {
    peakMonth: { label: string; revenue: number };
    avgCheckChange: { percent: number; period: string };
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface AdminDevice {
  id: string;
  name: string;
  platform: string;
  user: string;
  status: 'active' | 'blocked';
  lastSeenAt: string;
}

export interface AdminSession {
  id: string;
  user: string;
  device: string;
  ip: string;
  startedAt: string;
  lastActivityAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  user: string;
  ip: string;
  createdAt: string;
  details?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
}

export interface BackupJob {
  id: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'running' | 'failed';
  trigger?: 'manual' | 'automatic';
  size: string;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface BackupSchedule {
  enabled: boolean;
  hourUtc: number;
  type: 'full' | 'incremental';
  retentionDays: number;
}

export interface SystemLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
  user: string;
  ip: string;
  createdAt: string;
}

export interface MonitoringData {
  metrics: SystemMetric[];
  systemStatus: 'healthy' | 'degraded' | 'critical';
  health: Record<string, unknown>;
  queue: { pending: number; processing: number; failed: number; total: number };
}

export interface SystemMetric {
  id: string;
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface AdminOverview {
  activeUsers: number;
  activeSessions: number;
  totalProducts: number;
  todaySales: number;
  apiStatus: string;
  version: string;
  metrics: SystemMetric[];
}
