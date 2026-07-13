import { parseMoney } from '@/utils/money';
import type {
  Category,
  Customer,
  DebtHistoryEntry,
  ExchangeRate,
  Payment,
  Product,
  ProductBatch,
  Sale,
  SaleReturn,
  StockMovement,
  Supplier,
  SupplierDebtHistoryEntry,
  SupplierPayment,
  SupplierReceipt,
  User,
  UserRole,
  Warehouse,
  AdminOverview,
} from '@/types/entities';
import type { SaleDetail } from '@/types/sales';

function lowerStatus<T extends string>(s: T): Lowercase<T> {
  return s.toLowerCase() as Lowercase<T>;
}

function mapRole(role: string): UserRole {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'cashier' || r === 'warehouse') {
    return r;
  }
  return 'manager';
}

export function mapUser(wire: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}): User {
  return {
    id: wire.id,
    email: wire.email,
    firstName: wire.firstName,
    lastName: wire.lastName,
    role: mapRole(wire.role),
    status: lowerStatus(wire.status) as User['status'],
  };
}

export function mapCompany(wire: {
  id: string;
  name: string;
  code?: string;
  role: string;
  branchCount: number;
}) {
  return {
    id: wire.id,
    name: wire.name,
    role: mapRole(wire.role),
    branchCount: wire.branchCount,
    lastAccessedAt: new Date().toISOString(),
  };
}

export function mapProduct(wire: any): Product {
  return {
    id: wire.id,
    sku: wire.sku,
    barcode: wire.barcode ?? undefined,
    name: wire.name,
    category: wire.categoryName,
    unitOfMeasure: wire.unitOfMeasure ?? 'pcs',
    unitsPerBox: wire.unitsPerBox ? parseMoney(wire.unitsPerBox) : 1,
    minStockLevel: wire.minStockLevel ? parseMoney(wire.minStockLevel) : 0,
    purchasePriceUzs: parseMoney(wire.purchasePriceUzs),
    purchasePriceUsd: parseMoney(wire.purchasePriceUsd),
    priceUzs: parseMoney(wire.salePriceUzs),
    priceUsd: parseMoney(wire.salePriceUsd),
    stock: parseMoney(wire.stock),
    status: lowerStatus(wire.status) as Product['status'],
    wholesalePriceUzs: wire.wholesalePriceUzs ? parseMoney(wire.wholesalePriceUzs) : undefined,
    wholesalePriceUsd: wire.wholesalePriceUsd ? parseMoney(wire.wholesalePriceUsd) : undefined,
    recommendedPriceUzs: wire.recommendedPriceUzs ? parseMoney(wire.recommendedPriceUzs) : undefined,
    recommendedPriceUsd: wire.recommendedPriceUsd ? parseMoney(wire.recommendedPriceUsd) : undefined,
    minPriceUzs: wire.minPriceUzs ? parseMoney(wire.minPriceUzs) : undefined,
    minPriceUsd: wire.minPriceUsd ? parseMoney(wire.minPriceUsd) : undefined,
    imageUrl: wire.imageUrl ?? null,
    pdfCatalogUrl: wire.pdfCatalogUrl ?? null,
    techPassportUrl: wire.techPassportUrl ?? null,
    userManualUrl: wire.userManualUrl ?? null,
    barcodes: wire.barcodes ?? [],
    aliases: wire.aliases ?? [],
    unitConversions: wire.unitConversions?.map((uc: any) => ({
      fromUnit: uc.fromUnit,
      toUnit: uc.toUnit,
      conversionFactor: parseMoney(uc.conversionFactor)
    })) ?? []
  };
}

export function mapCategory(wire: {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
  sortOrder: number;
}): Category {
  return {
    id: wire.id,
    name: wire.name,
    productCount: wire.productCount,
    parentId: wire.parentId ?? undefined,
  };
}

export function mapCustomer(wire: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  debtUzs: string;
  debtUsd: string;
  totalPurchasesUzs: string;
  status: string;
  lastPurchaseAt?: string | null;
  createdAt?: string;
}): Customer {
  return {
    id: wire.id,
    name: wire.name,
    phone: wire.phone,
    email: wire.email ?? undefined,
    address: wire.address ?? undefined,
    notes: wire.notes ?? undefined,
    debtUzs: parseMoney(wire.debtUzs),
    debtUsd: parseMoney(wire.debtUsd),
    totalPurchasesUzs: parseMoney(wire.totalPurchasesUzs),
    status: lowerStatus(wire.status) as Customer['status'],
    lastPurchaseAt: wire.lastPurchaseAt ?? undefined,
    createdAt: wire.createdAt,
  };
}

export function mapWarehouse(wire: {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  address?: string | null;
  isDefault?: boolean;
  status?: string;
  productCount: number;
  totalValueUzs: string;
}): Warehouse {
  return {
    id: wire.id,
    name: wire.name,
    branch: wire.branchName,
    branchId: wire.branchId,
    address: wire.address ?? '',
    isDefault: wire.isDefault,
    status: wire.status,
    productCount: wire.productCount,
    totalValueUzs: parseMoney(wire.totalValueUzs),
  };
}

const movementTypeMap: Record<string, StockMovement['type']> = {
  RECEIPT: 'receive',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  RETURN: 'adjustment',
  TRANSFER: 'transfer',
  VOID_RESTORE: 'adjustment',
};

export function mapStockMovement(wire: {
  id: string;
  type: string;
  productName: string;
  quantity: string;
  warehouseName: string;
  createdAt: string;
  performedBy: string;
  note?: string | null;
}): StockMovement {
  return {
    id: wire.id,
    type: movementTypeMap[wire.type] ?? 'adjustment',
    productName: wire.productName,
    quantity: parseMoney(wire.quantity),
    warehouse: wire.warehouseName,
    createdAt: wire.createdAt,
    user: wire.performedBy,
    note: wire.note ?? undefined,
  };
}

export function mapProductBatch(wire: {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: string;
  remainingQty: string;
  unitCostUzs: string;
  warehouseId: string;
  warehouseName: string;
  receivedAt: string;
}): ProductBatch {
  return {
    id: wire.id,
    productId: wire.productId,
    productName: wire.productName,
    sku: wire.sku,
    quantity: parseMoney(wire.quantity),
    remaining: parseMoney(wire.remainingQty),
    costUzs: parseMoney(wire.unitCostUzs),
    warehouseId: wire.warehouseId,
    warehouseName: wire.warehouseName,
    receivedAt: wire.receivedAt,
  };
}

export function mapExchangeRate(wire: {
  id: string;
  rate: string;
  effectiveFrom: string;
  setBy: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
}): ExchangeRate {
  return {
    id: wire.id,
    rate: parseMoney(wire.rate),
    effectiveFrom: wire.effectiveFrom,
    setBy: wire.setBy,
    status: lowerStatus(wire.status) as ExchangeRate['status'],
  };
}

const saleStatusMap: Record<string, Sale['status']> = {
  COMPLETED: 'completed',
  PARTIALLY_RETURNED: 'partially_returned',
  CANCELLED: 'voided',
  RETURNED: 'returned',
};

const paymentTypeMap: Record<string, Sale['paymentType']> = {
  CASH: 'cash',
  CREDIT: 'credit',
  MIXED: 'mixed',
};

export function mapSaleListItem(wire: {
  id: string;
  number: string;
  customerName: string | null;
  totalUzs: string;
  totalUsd: string;
  paymentType: string;
  status: string;
  createdAt: string;
  cashierName: string;
}): Sale {
  return {
    id: wire.id,
    number: wire.number,
    customerName: wire.customerName ?? 'Mehmon',
    totalUzs: parseMoney(wire.totalUzs),
    totalUsd: parseMoney(wire.totalUsd),
    paymentType: paymentTypeMap[wire.paymentType] ?? 'cash',
    status: saleStatusMap[wire.status] ?? 'completed',
    createdAt: wire.createdAt,
    cashier: wire.cashierName,
  };
}

export function mapSaleDetail(wire: {
  id: string;
  number: string;
  customerId: string | null;
  customerName: string | null;
  cashierName: string;
  originalCurrency: string;
  exchangeRateUsed: string;
  totalUzs: string;
  totalUsd: string;
  paymentType: string;
  status: string;
  createdAt: string;
  lineItems: Array<{
    id?: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: string;
    unitPriceUzs: string;
    unitPriceUsd: string;
    totalUzs: string;
    totalUsd: string;
    cogsUzs?: string;
    cogsUsd?: string;
  }>;
  fifoAllocations: Array<{
    id?: string;
    batchId: string;
    productId: string;
    productName: string;
    quantity: string;
    unitCostUzs: string;
    costUzs: string;
  }>;
  payments: Array<{
    method: string;
    amountUzs: string;
    amountUsd: string;
    receivedUzs: string;
    changeUzs: string;
  }>;
  notes?: string | null;
}): SaleDetail {
  const rate = parseMoney(wire.exchangeRateUsed);
  return {
    ...mapSaleListItem({
      id: wire.id,
      number: wire.number,
      customerName: wire.customerName,
      totalUzs: wire.totalUzs,
      totalUsd: wire.totalUsd,
      paymentType: wire.paymentType,
      status: wire.status,
      createdAt: wire.createdAt,
      cashierName: wire.cashierName,
    }),
    customerId: wire.customerId ?? undefined,
    currency: wire.originalCurrency as 'UZS' | 'USD',
    exchangeRate: rate,
    notes: wire.notes ?? undefined,
    lineItems: wire.lineItems.map((li) => ({
      productId: li.productId,
      productName: li.productName,
      sku: li.sku,
      quantity: parseMoney(li.quantity),
      unitPriceUzs: parseMoney(li.unitPriceUzs),
      unitPriceUsd: parseMoney(li.unitPriceUsd),
      totalUzs: parseMoney(li.totalUzs),
      totalUsd: parseMoney(li.totalUsd),
    })),
    fifoAllocations: wire.fifoAllocations.map((a) => ({
      batchId: a.batchId,
      productId: a.productId,
      productName: a.productName,
      quantity: parseMoney(a.quantity),
      costUzs: parseMoney(a.costUzs),
    })),
    payments: wire.payments.map((p) => ({
      method: paymentTypeMap[p.method] ?? 'cash',
      amountUzs: parseMoney(p.amountUzs),
      amountUsd: parseMoney(p.amountUsd),
      receivedUzs: parseMoney(p.receivedUzs),
      changeUzs: parseMoney(p.changeUzs),
    })),
  };
}

const returnStatusMap: Record<string, SaleReturn['status']> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export function mapSaleReturn(wire: {
  id: string;
  saleId: string;
  saleNumber: string;
  customerId: string | null;
  customerName: string | null;
  amountUzs: string;
  amountUsd: string;
  reason: string;
  status: string;
  createdAt: string;
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: string;
    amountUzs: string;
  }>;
}): SaleReturn {
  return {
    id: wire.id,
    saleId: wire.saleId,
    saleNumber: wire.saleNumber,
    customerId: wire.customerId ?? undefined,
    customerName: wire.customerName ?? 'Mehmon',
    amountUzs: parseMoney(wire.amountUzs),
    amountUsd: parseMoney(wire.amountUsd),
    reason: wire.reason,
    status: returnStatusMap[wire.status] ?? 'pending',
    createdAt: wire.createdAt,
    lineItems: wire.lineItems.map((li) => ({
      productId: li.productId,
      productName: li.productName,
      quantity: parseMoney(li.quantity),
      amountUzs: parseMoney(li.amountUzs),
    })),
  };
}

const paymentMethodMap: Record<string, Payment['method']> = {
  CASH: 'cash',
  CARD: 'card',
  BANK_TRANSFER: 'transfer',
};

export function mapDebtPayment(wire: {
  id: string;
  customerId: string;
  customerName: string;
  amount: string;
  currency: string;
  amountUzs: string;
  amountUsd: string;
  paymentMethod: string;
  createdAt: string;
  recordedBy: string;
  notes?: string | null;
}): Payment {
  return {
    id: wire.id,
    customerId: wire.customerId,
    customerName: wire.customerName,
    amountUzs: parseMoney(wire.amountUzs),
    amountUsd: parseMoney(wire.amountUsd),
    method: paymentMethodMap[wire.paymentMethod] ?? 'cash',
    createdAt: wire.createdAt,
    recordedBy: wire.recordedBy,
    note: wire.notes ?? undefined,
  };
}

export function mapDebtHistoryEntry(wire: {
  id: string;
  customerId: string;
  type: DebtHistoryEntry['type'];
  amountUzs: string;
  amountUsd: string;
  balanceAfterUzs: string;
  balanceAfterUsd: string;
  reference: string | null;
  createdAt: string;
  recordedBy: string;
}): DebtHistoryEntry {
  return {
    id: wire.id,
    customerId: wire.customerId,
    type: wire.type,
    amountUzs: parseMoney(wire.amountUzs),
    amountUsd: parseMoney(wire.amountUsd),
    balanceAfterUzs: parseMoney(wire.balanceAfterUzs),
    balanceAfterUsd: parseMoney(wire.balanceAfterUsd),
    reference: wire.reference ?? undefined,
    createdAt: wire.createdAt,
    recordedBy: wire.recordedBy,
  };
}

export function mapSupplier(wire: {
  id: string;
  name: string;
  phone: string;
  contactPerson?: string | null;
  notes?: string | null;
  status: string;
  totalDebtUzs: string;
  totalDebtUsd: string;
  totalPaidUzs: string;
  totalPaidUsd: string;
  remainingDebtUzs: string;
  remainingDebtUsd: string;
  createdAt: string;
  updatedAt: string;
}): Supplier {
  return {
    id: wire.id,
    name: wire.name,
    phone: wire.phone,
    contactPerson: wire.contactPerson ?? undefined,
    notes: wire.notes ?? undefined,
    status: lowerStatus(wire.status) as Supplier['status'],
    totalDebtUzs: parseMoney(wire.totalDebtUzs),
    totalDebtUsd: parseMoney(wire.totalDebtUsd),
    totalPaidUzs: parseMoney(wire.totalPaidUzs),
    totalPaidUsd: parseMoney(wire.totalPaidUsd),
    remainingDebtUzs: parseMoney(wire.remainingDebtUzs),
    remainingDebtUsd: parseMoney(wire.remainingDebtUsd),
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  };
}

export function mapSupplierReceipt(wire: {
  id: string;
  supplierId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: string;
  unitCostUzs: string;
  totalCostUzs: string;
  paymentType: string;
  note?: string | null;
  createdAt: string;
}): SupplierReceipt {
  return {
    id: wire.id,
    supplierId: wire.supplierId,
    productId: wire.productId,
    productName: wire.productName,
    sku: wire.sku,
    quantity: parseMoney(wire.quantity),
    unitCostUzs: parseMoney(wire.unitCostUzs),
    totalCostUzs: parseMoney(wire.totalCostUzs),
    paymentType: wire.paymentType === 'CREDIT' ? 'credit' : 'cash',
    note: wire.note ?? undefined,
    createdAt: wire.createdAt,
  };
}

export function mapSupplierPayment(wire: {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: string;
  currency: string;
  amountUzs: string;
  amountUsd: string;
  exchangeRateUsed: string;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  recordedBy: string;
}): SupplierPayment {
  return {
    id: wire.id,
    supplierId: wire.supplierId,
    supplierName: wire.supplierName,
    amount: parseMoney(wire.amount),
    currency: wire.currency as 'UZS' | 'USD',
    amountUzs: parseMoney(wire.amountUzs),
    amountUsd: parseMoney(wire.amountUsd),
    exchangeRateUsed: parseMoney(wire.exchangeRateUsed),
    method: paymentMethodMap[wire.paymentMethod] ?? 'cash',
    note: wire.notes ?? undefined,
    createdAt: wire.createdAt,
    recordedBy: wire.recordedBy,
  };
}

export function mapSupplierDebtHistoryEntry(wire: {
  id: string;
  type: string;
  amountUzs: string;
  amountUsd: string;
  balanceAfterUzs: string;
  balanceAfterUsd: string;
  reference?: string | null;
  createdAt: string;
  recordedBy: string;
}): SupplierDebtHistoryEntry {
  return {
    id: wire.id,
    type: wire.type,
    amountUzs: parseMoney(wire.amountUzs),
    amountUsd: parseMoney(wire.amountUsd),
    balanceAfterUzs: parseMoney(wire.balanceAfterUzs),
    balanceAfterUsd: parseMoney(wire.balanceAfterUsd),
    reference: wire.reference ?? undefined,
    createdAt: wire.createdAt,
    recordedBy: wire.recordedBy,
  };
}

export function mapAdminUser(wire: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}): User {
  return {
    id: wire.id,
    email: wire.email,
    firstName: wire.firstName,
    lastName: wire.lastName,
    role: mapRole(wire.role),
    roleId: wire.roleId,
    status: lowerStatus(wire.status) as User['status'],
    lastLoginAt: wire.lastLoginAt ?? undefined,
  };
}

export function mapAdminSession(wire: {
  id: string;
  user: string;
  device: string;
  ip: string;
  startedAt: string;
  lastActivityAt: string;
}): import('@/types/entities').AdminSession {
  return {
    id: wire.id,
    user: wire.user,
    device: wire.device,
    ip: wire.ip,
    startedAt: wire.startedAt,
    lastActivityAt: wire.lastActivityAt,
  };
}

export function mapAdminDevice(wire: {
  id: string;
  name: string;
  platform: string;
  user: string;
  status: string;
  lastSeenAt: string;
}): import('@/types/entities').AdminDevice {
  return {
    id: wire.id,
    name: wire.name,
    platform: wire.platform,
    user: wire.user,
    status: lowerStatus(wire.status) as import('@/types/entities').AdminDevice['status'],
    lastSeenAt: wire.lastSeenAt,
  };
}

export function mapAdminAuditLog(wire: {
  id: string;
  action: string;
  entity: string;
  user: string;
  ip: string;
  createdAt: string;
  details?: string;
}): import('@/types/entities').AuditLog {
  return {
    id: wire.id,
    action: wire.action,
    entity: wire.entity,
    user: wire.user,
    ip: wire.ip,
    createdAt: wire.createdAt,
    details: wire.details,
  };
}

export function mapAdminRole(wire: {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}): import('@/types/entities').Role {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    userCount: wire.userCount,
    permissionCount: wire.permissionCount,
  };
}

export function mapPermission(wire: {
  id: string;
  code: string;
  module: string;
  description: string;
}): import('@/types/entities').Permission {
  return {
    id: wire.id,
    code: wire.code,
    module: wire.module,
    description: wire.description,
  };
}

export function mapBackupJob(wire: {
  id: string;
  type: string;
  status: string;
  trigger?: string;
  size: string;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}): import('@/types/entities').BackupJob {
  return {
    id: wire.id,
    type: wire.type as 'full' | 'incremental',
    status: wire.status as 'completed' | 'running' | 'failed',
    trigger: wire.trigger as 'manual' | 'automatic' | undefined,
    size: wire.size,
    createdAt: wire.createdAt,
    completedAt: wire.completedAt,
    errorMessage: wire.errorMessage,
  };
}

export function mapSystemLog(wire: {
  id: string;
  level: string;
  message: string;
  source: string;
  user: string;
  ip: string;
  createdAt: string;
}): import('@/types/entities').SystemLogEntry {
  return {
    id: wire.id,
    level: wire.level as 'info' | 'warn' | 'error',
    message: wire.message,
    source: wire.source,
    user: wire.user,
    ip: wire.ip,
    createdAt: wire.createdAt,
  };
}

export function mapAdminOverview(wire: {
  activeUsers: number;
  activeSessions: number;
  totalProducts: number;
  todaySales: number;
  apiStatus: string;
  version: string;
}): AdminOverview {
  return {
    ...wire,
    metrics: [],
  };
}
