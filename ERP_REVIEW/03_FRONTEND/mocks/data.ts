import type {
  AuditLog,
  BackupJob,
  Category,
  Customer,
  ExchangeRate,
  Notification,
  Payment,
  Permission,
  Product,
  ReportItem,
  Role,
  Sale,
  StockMovement,
  SystemMetric,
  User,
  Warehouse,
  AdminDevice,
  AdminSession,
} from '@/types/entities';

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  quantity: number;
  minStock: number;
  valueUzs: number;
  status: 'ok' | 'low' | 'out';
}

export interface SaleReturn {
  id: string;
  saleNumber: string;
  customerName: string;
  amountUzs: number;
  amountUsd: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
}

export interface CompanySettings {
  name: string;
  tin: string;
  address: string;
  phone: string;
  email: string;
  defaultCurrency: 'UZS' | 'USD' | 'both';
  timezone: string;
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

export const mockProducts: Product[] = [
  { id: 'p1', sku: 'ELC-001', name: 'Samsung Galaxy A54', category: 'Telefonlar', barcode: '8806095123456', unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 5, purchasePriceUzs: 3_240_000, purchasePriceUsd: 256.7, priceUzs: 4_500_000, priceUsd: 356.5, stock: 42, status: 'active' },
  { id: 'p2', sku: 'ELC-002', name: 'iPhone 15 Pro Max', category: 'Telefonlar', barcode: '194253000123', unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 3, purchasePriceUzs: 11_376_000, purchasePriceUsd: 900.9, priceUzs: 15_800_000, priceUsd: 1251.2, stock: 8, status: 'active' },
  { id: 'p3', sku: 'ACC-101', name: 'USB-C kabel 2m', category: 'Aksessuarlar', barcode: '8601234567890', unitOfMeasure: 'pcs', unitsPerBox: 24, minStockLevel: 20, purchasePriceUzs: 25_200, purchasePriceUsd: 2.0, priceUzs: 35_000, priceUsd: 2.77, stock: 320, status: 'active' },
  { id: 'p4', sku: 'ACC-102', name: 'Simsiz quloqchin', category: 'Aksessuarlar', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 10, purchasePriceUzs: 201_600, purchasePriceUsd: 15.97, priceUzs: 280_000, priceUsd: 22.19, stock: 65, status: 'active' },
  { id: 'p5', sku: 'ACC-103', name: 'Ekran himoyasi', category: 'Aksessuarlar', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 10, purchasePriceUzs: 18_000, purchasePriceUsd: 1.43, priceUzs: 25_000, priceUsd: 1.98, stock: 0, status: 'inactive' },
  { id: 'p6', sku: 'ELC-003', name: 'Xiaomi Redmi Note 13', category: 'Telefonlar', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 5, purchasePriceUzs: 2_304_000, purchasePriceUsd: 182.6, priceUzs: 3_200_000, priceUsd: 253.6, stock: 28, status: 'active' },
  { id: 'p7', sku: 'HOM-201', name: 'Blender Artel', category: 'Maishiy texnika', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 3, purchasePriceUzs: 640_800, purchasePriceUsd: 50.77, priceUzs: 890_000, priceUsd: 70.52, stock: 15, status: 'active' },
  { id: 'p8', sku: 'HOM-202', name: 'Mikroto\'lqinli pech', category: 'Maishiy texnika', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 1, minStockLevel: 3, purchasePriceUzs: 1_044_000, purchasePriceUsd: 82.73, priceUzs: 1_450_000, priceUsd: 114.9, stock: 12, status: 'active' },
  { id: 'p9', sku: 'OFF-301', name: 'A4 qog\'oz 500 varaq', category: 'Kanselyariya', barcode: undefined, unitOfMeasure: 'box', unitsPerBox: 10, minStockLevel: 20, purchasePriceUzs: 34_560, purchasePriceUsd: 2.74, priceUzs: 48_000, priceUsd: 3.8, stock: 180, status: 'active' },
  { id: 'p10', sku: 'OFF-302', name: 'Ruchka ko\'p rangli', category: 'Kanselyariya', barcode: undefined, unitOfMeasure: 'pcs', unitsPerBox: 12, minStockLevel: 50, purchasePriceUzs: 5_760, purchasePriceUsd: 0.46, priceUzs: 8_000, priceUsd: 0.63, stock: 500, status: 'active' },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Telefonlar', productCount: 3 },
  { id: 'c2', name: 'Aksessuarlar', productCount: 3 },
  { id: 'c3', name: 'Maishiy texnika', productCount: 2 },
  { id: 'c4', name: 'Kanselyariya', productCount: 2 },
  { id: 'c5', name: 'Kompyuterlar', productCount: 0, parentId: undefined },
  { id: 'c6', name: 'Noutbuklar', productCount: 0, parentId: 'c5' },
];

export const mockWarehouses: Warehouse[] = [
  { id: 'w1', name: 'Asosiy ombor', branch: 'Markaziy filial', address: 'Toshkent, Chilonzor 12', productCount: 856, totalValueUzs: 520_000_000 },
  { id: 'w2', name: 'Shimoliy ombor', branch: 'Shimol filiali', address: 'Toshkent, Yunusobod 45', productCount: 412, totalValueUzs: 210_000_000 },
  { id: 'w3', name: 'Vitrina zaxirasi', branch: 'Markaziy filial', address: 'Toshkent, Chilonzor 12', productCount: 128, totalValueUzs: 85_000_000 },
];

export const mockInventoryItems: InventoryItem[] = mockProducts.map((p, i) => ({
  id: `inv-${p.id}`,
  productId: p.id,
  sku: p.sku,
  name: p.name,
  category: p.category,
  warehouse: i % 2 === 0 ? 'Asosiy ombor' : 'Shimoliy ombor',
  quantity: p.stock,
  minStock: 10,
  valueUzs: p.priceUzs * p.stock,
  status: p.stock === 0 ? 'out' : p.stock < 15 ? 'low' : 'ok',
}));

export const mockStockMovements: StockMovement[] = [
  { id: 'sm1', type: 'receive', productName: 'Samsung Galaxy A54', quantity: 50, warehouse: 'Asosiy ombor', createdAt: '2026-06-18T09:15:00Z', user: 'Jasur Rahimov' },
  { id: 'sm2', type: 'sale', productName: 'USB-C kabel 2m', quantity: -12, warehouse: 'Asosiy ombor', createdAt: '2026-06-18T10:30:00Z', user: 'Malika Tosheva' },
  { id: 'sm3', type: 'transfer', productName: 'Simsiz quloqchin', quantity: 20, warehouse: 'Shimoliy ombor', createdAt: '2026-06-17T14:00:00Z', user: 'Jasur Rahimov' },
  { id: 'sm4', type: 'adjustment', productName: 'Ekran himoyasi', quantity: -5, warehouse: 'Asosiy ombor', createdAt: '2026-06-17T11:20:00Z', user: 'Aziz Karimov' },
  { id: 'sm5', type: 'receive', productName: 'iPhone 15 Pro Max', quantity: 10, warehouse: 'Vitrina zaxirasi', createdAt: '2026-06-16T08:45:00Z', user: 'Jasur Rahimov' },
  { id: 'sm6', type: 'sale', productName: 'Blender Artel', quantity: -2, warehouse: 'Shimoliy ombor', createdAt: '2026-06-16T16:10:00Z', user: 'Dilnoza Yusupova' },
  { id: 'sm7', type: 'transfer', productName: 'A4 qog\'oz 500 varaq', quantity: 100, warehouse: 'Asosiy ombor', createdAt: '2026-06-15T13:00:00Z', user: 'Jasur Rahimov' },
  { id: 'sm8', type: 'adjustment', productName: 'Ruchka ko\'p rangli', quantity: 50, warehouse: 'Asosiy ombor', createdAt: '2026-06-15T09:30:00Z', user: 'Aziz Karimov' },
];

export const mockSales: Sale[] = [
  { id: 's1', number: 'S-2026-4521', customerName: 'Aziz Karimov', totalUzs: 850_000, totalUsd: 67.35, paymentType: 'cash', status: 'completed', createdAt: '2026-06-18T11:45:00Z', cashier: 'Malika Tosheva' },
  { id: 's2', number: 'S-2026-4520', customerName: 'Dilnoza Yusupova', totalUzs: 4_500_000, totalUsd: 356.5, paymentType: 'credit', status: 'completed', createdAt: '2026-06-18T10:20:00Z', cashier: 'Malika Tosheva' },
  { id: 's3', number: 'S-2026-4519', customerName: 'Mehmon', totalUzs: 120_000, totalUsd: 9.51, paymentType: 'cash', status: 'completed', createdAt: '2026-06-18T09:55:00Z', cashier: 'Dilnoza Yusupova' },
  { id: 's4', number: 'S-2026-4518', customerName: 'Rustam Aliyev', totalUzs: 1_890_000, totalUsd: 149.76, paymentType: 'mixed', status: 'completed', createdAt: '2026-06-17T17:30:00Z', cashier: 'Malika Tosheva' },
  { id: 's5', number: 'S-2026-4517', customerName: 'Gulnora Saidova', totalUzs: 320_000, totalUsd: 25.36, paymentType: 'cash', status: 'voided', createdAt: '2026-06-17T15:10:00Z', cashier: 'Dilnoza Yusupova' },
  { id: 's6', number: 'S-2026-4516', customerName: 'Aziz Karimov', totalUzs: 560_000, totalUsd: 44.37, paymentType: 'credit', status: 'returned', createdAt: '2026-06-16T14:00:00Z', cashier: 'Malika Tosheva' },
];

export const mockSaleReturns: SaleReturn[] = [
  { id: 'r1', saleNumber: 'S-2026-4516', customerName: 'Aziz Karimov', amountUzs: 560_000, amountUsd: 44.37, reason: 'Nuqsonli mahsulot', status: 'approved', createdAt: '2026-06-17T09:00:00Z' },
  { id: 'r2', saleNumber: 'S-2026-4508', customerName: 'Rustam Aliyev', amountUzs: 35_000, amountUsd: 2.77, reason: 'Noto\'g\'ri model', status: 'pending', createdAt: '2026-06-18T08:30:00Z' },
  { id: 'r3', saleNumber: 'S-2026-4495', customerName: 'Gulnora Saidova', amountUzs: 280_000, amountUsd: 22.19, reason: 'Mijoz fikrini o\'zgartirdi', status: 'rejected', createdAt: '2026-06-15T16:45:00Z' },
];

export const mockCustomers: Customer[] = [
  { id: 'cu1', name: 'Aziz Karimov', phone: '+998 90 123 45 67', email: 'aziz@example.uz', debtUzs: 2_450_000, debtUsd: 194.1, totalPurchasesUzs: 28_500_000, status: 'active', lastPurchaseAt: '2026-06-18T10:20:00Z' },
  { id: 'cu2', name: 'Dilnoza Yusupova', phone: '+998 91 234 56 78', debtUzs: 0, debtUsd: 0, totalPurchasesUzs: 12_300_000, status: 'active', lastPurchaseAt: '2026-06-18T09:55:00Z' },
  { id: 'cu3', name: 'Rustam Aliyev', phone: '+998 93 345 67 89', email: 'rustam@biz.uz', debtUzs: 5_800_000, debtUsd: 459.6, totalPurchasesUzs: 45_200_000, status: 'active', lastPurchaseAt: '2026-06-17T17:30:00Z' },
  { id: 'cu4', name: 'Gulnora Saidova', phone: '+998 94 456 78 90', debtUzs: 1_200_000, debtUsd: 95.1, totalPurchasesUzs: 8_900_000, status: 'active', lastPurchaseAt: '2026-06-17T15:10:00Z' },
  { id: 'cu5', name: 'Sherzod Mirzayev', phone: '+998 95 567 89 01', debtUzs: 8_900_000, debtUsd: 705.2, totalPurchasesUzs: 62_000_000, status: 'blocked', lastPurchaseAt: '2026-05-28T11:00:00Z' },
  { id: 'cu6', name: 'Malika Tosheva', phone: '+998 97 678 90 12', debtUzs: 0, debtUsd: 0, totalPurchasesUzs: 3_400_000, status: 'active', lastPurchaseAt: '2026-06-10T14:20:00Z' },
];

export const mockPayments: Payment[] = [
  { id: 'pay1', customerId: 'cu1', customerName: 'Aziz Karimov', amountUzs: 1_500_000, amountUsd: 118.85, method: 'cash', createdAt: '2026-06-18T09:00:00Z', recordedBy: 'Malika Tosheva' },
  { id: 'pay2', customerId: 'cu3', customerName: 'Rustam Aliyev', amountUzs: 3_000_000, amountUsd: 237.7, method: 'transfer', createdAt: '2026-06-17T12:30:00Z', recordedBy: 'Dilnoza Yusupova' },
  { id: 'pay3', customerId: 'cu4', customerName: 'Gulnora Saidova', amountUzs: 500_000, amountUsd: 39.62, method: 'card', createdAt: '2026-06-16T10:15:00Z', recordedBy: 'Malika Tosheva' },
  { id: 'pay4', customerId: 'cu5', customerName: 'Sherzod Mirzayev', amountUzs: 2_000_000, amountUsd: 158.48, method: 'cash', createdAt: '2026-06-15T16:00:00Z', recordedBy: 'Dilnoza Yusupova' },
  { id: 'pay5', customerId: 'cu1', customerName: 'Aziz Karimov', amountUzs: 800_000, amountUsd: 63.39, method: 'transfer', createdAt: '2026-06-14T11:45:00Z', recordedBy: 'Malika Tosheva' },
];

export const mockExchangeRates: ExchangeRate[] = [
  { id: 'er1', rate: 12_620, effectiveFrom: '2026-06-18T00:00:00Z', setBy: 'Admin', status: 'active' },
  { id: 'er2', rate: 12_580, effectiveFrom: '2026-06-15T00:00:00Z', setBy: 'Admin', status: 'archived' },
  { id: 'er3', rate: 12_550, effectiveFrom: '2026-06-10T00:00:00Z', setBy: 'Manager', status: 'archived' },
  { id: 'er4', rate: 12_500, effectiveFrom: '2026-06-01T00:00:00Z', setBy: 'Admin', status: 'archived' },
];

export const mockReports: ReportItem[] = [
  { id: 'rep1', name: 'Kunlik savdo hisoboti', category: 'Savdo', description: 'Kunlik savdo, to\'lov va qarz ko\'rsatkichlari', lastGenerated: '2026-06-18T08:00:00Z' },
  { id: 'rep2', name: 'Oylik foyda va zarar', category: 'Moliya', description: 'Daromad, xarajat va yalpi foyda tahlili', lastGenerated: '2026-06-01T09:00:00Z' },
  { id: 'rep3', name: 'Ombor qoldig\'i', category: 'Ombor', description: 'Mahsulotlar bo\'yicha qoldiq va qiymat', lastGenerated: '2026-06-17T18:00:00Z' },
  { id: 'rep4', name: 'Mijozlar qarzi', category: 'Mijozlar', description: 'Qarzdor mijozlar va muddat o\'tgan to\'lovlar' },
  { id: 'rep5', name: 'Kassir faoliyati', category: 'Savdo', description: 'Kassirlar bo\'yicha savdo statistikasi', lastGenerated: '2026-06-16T20:00:00Z' },
  { id: 'rep6', name: 'Mahsulot aylanmasi', category: 'Ombor', description: 'Eng ko\'p va kam sotiladigan mahsulotlar' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Past qoldiq ogohlantirishi', body: 'Ekran himoyasi zaxirasi tugadi (0 dona)', type: 'warning', read: false, createdAt: '2026-06-18T08:30:00Z' },
  { id: 'n2', title: 'Yangi to\'lov qabul qilindi', body: 'Aziz Karimov 1 500 000 so\'m to\'ladi', type: 'success', read: false, createdAt: '2026-06-18T09:05:00Z' },
  { id: 'n3', title: 'Valyuta kursi yangilandi', body: 'USD kursi 12 620 so\'mga o\'rnatildi', type: 'info', read: true, createdAt: '2026-06-18T00:05:00Z' },
  { id: 'n4', title: 'Qaytarish so\'rovi', body: 'Rustam Aliyev qaytarish so\'rovini yubordi', type: 'warning', read: false, createdAt: '2026-06-18T08:35:00Z' },
  { id: 'n5', title: 'Zaxira nusxasi muvaffaqiyatli', body: 'To\'liq zaxira nusxasi yaratildi (2.4 GB)', type: 'success', read: true, createdAt: '2026-06-17T02:00:00Z' },
  { id: 'n6', title: 'Muddat o\'tgan qarz', body: 'Sherzod Mirzayev qarzi 30 kundan oshdi', type: 'error', read: false, createdAt: '2026-06-17T09:00:00Z' },
];

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@erp.uz', firstName: 'Sardor', lastName: 'Nazarov', role: 'admin', status: 'active', lastLoginAt: '2026-06-18T07:30:00Z' },
  { id: 'u2', email: 'manager@erp.uz', firstName: 'Nilufar', lastName: 'Qodirova', role: 'manager', status: 'active', lastLoginAt: '2026-06-18T08:15:00Z' },
  { id: 'u3', email: 'cashier1@erp.uz', firstName: 'Malika', lastName: 'Tosheva', role: 'cashier', status: 'active', lastLoginAt: '2026-06-18T09:00:00Z' },
  { id: 'u4', email: 'cashier2@erp.uz', firstName: 'Dilnoza', lastName: 'Yusupova', role: 'cashier', status: 'active', lastLoginAt: '2026-06-18T08:45:00Z' },
  { id: 'u5', email: 'warehouse@erp.uz', firstName: 'Jasur', lastName: 'Rahimov', role: 'warehouse', status: 'active', lastLoginAt: '2026-06-17T16:20:00Z' },
  { id: 'u6', email: 'blocked@erp.uz', firstName: 'Test', lastName: 'User', role: 'cashier', status: 'blocked', lastLoginAt: '2026-05-01T10:00:00Z' },
];

export const mockRoles: Role[] = [
  { id: 'role1', name: 'Administrator', description: 'To\'liq tizim boshqaruvi', userCount: 1, permissionCount: 48 },
  { id: 'role2', name: 'Menejer', description: 'Hisobotlar va sozlamalar', userCount: 1, permissionCount: 32 },
  { id: 'role3', name: 'Kassir', description: 'Savdo va mijozlar', userCount: 2, permissionCount: 18 },
  { id: 'role4', name: 'Omborchi', description: 'Ombor va mahsulotlar', userCount: 1, permissionCount: 22 },
];

export const mockPermissions: Permission[] = [
  { id: 'perm1', code: 'sales.create', module: 'Savdo', description: 'Yangi savdo yaratish' },
  { id: 'perm2', code: 'sales.void', module: 'Savdo', description: 'Savdoni bekor qilish' },
  { id: 'perm3', code: 'products.manage', module: 'Mahsulotlar', description: 'Mahsulotlarni boshqarish' },
  { id: 'perm4', code: 'inventory.adjust', module: 'Ombor', description: 'Zaxirani tuzatish' },
  { id: 'perm5', code: 'customers.manage', module: 'Mijozlar', description: 'Mijozlarni boshqarish' },
  { id: 'perm6', code: 'reports.view', module: 'Hisobotlar', description: 'Hisobotlarni ko\'rish' },
  { id: 'perm7', code: 'settings.manage', module: 'Sozlamalar', description: 'Tizim sozlamalari' },
  { id: 'perm8', code: 'admin.users', module: 'Admin', description: 'Foydalanuvchilarni boshqarish' },
  { id: 'perm9', code: 'finance.rates', module: 'Moliya', description: 'Valyuta kursini o\'zgartirish' },
  { id: 'perm10', code: 'payments.record', module: 'Mijozlar', description: 'To\'lovlarni qayd etish' },
];

export const mockDevices: AdminDevice[] = [
  { id: 'd1', name: 'Kassa-01', platform: 'Windows 11', user: 'Malika Tosheva', status: 'active', lastSeenAt: '2026-06-18T11:50:00Z' },
  { id: 'd2', name: 'Kassa-02', platform: 'Windows 11', user: 'Dilnoza Yusupova', status: 'active', lastSeenAt: '2026-06-18T11:48:00Z' },
  { id: 'd3', name: 'Ombor-PC', platform: 'Windows 10', user: 'Jasur Rahimov', status: 'active', lastSeenAt: '2026-06-17T17:00:00Z' },
  { id: 'd4', name: 'Admin-Laptop', platform: 'macOS 15', user: 'Sardor Nazarov', status: 'active', lastSeenAt: '2026-06-18T08:00:00Z' },
  { id: 'd5', name: 'Eski-Kassa', platform: 'Windows 10', user: 'Test User', status: 'blocked', lastSeenAt: '2026-05-01T10:00:00Z' },
];

export const mockSessions: AdminSession[] = [
  { id: 'sess1', user: 'Malika Tosheva', device: 'Kassa-01', ip: '192.168.1.101', startedAt: '2026-06-18T08:30:00Z', lastActivityAt: '2026-06-18T11:50:00Z' },
  { id: 'sess2', user: 'Dilnoza Yusupova', device: 'Kassa-02', ip: '192.168.1.102', startedAt: '2026-06-18T08:45:00Z', lastActivityAt: '2026-06-18T11:48:00Z' },
  { id: 'sess3', user: 'Sardor Nazarov', device: 'Admin-Laptop', ip: '192.168.1.10', startedAt: '2026-06-18T07:30:00Z', lastActivityAt: '2026-06-18T09:15:00Z' },
  { id: 'sess4', user: 'Jasur Rahimov', device: 'Ombor-PC', ip: '192.168.1.50', startedAt: '2026-06-17T09:00:00Z', lastActivityAt: '2026-06-17T17:00:00Z' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', action: 'CREATE', entity: 'Sale S-2026-4521', user: 'Malika Tosheva', ip: '192.168.1.101', createdAt: '2026-06-18T11:45:00Z', details: '850 000 so\'m' },
  { id: 'al2', action: 'UPDATE', entity: 'ExchangeRate', user: 'Sardor Nazarov', ip: '192.168.1.10', createdAt: '2026-06-18T00:05:00Z', details: '12 620 so\'m' },
  { id: 'al3', action: 'ADJUST', entity: 'Stock Ekran himoyasi', user: 'Aziz Karimov', ip: '192.168.1.50', createdAt: '2026-06-17T11:20:00Z', details: '-5 dona' },
  { id: 'al4', action: 'LOGIN', entity: 'User', user: 'Dilnoza Yusupova', ip: '192.168.1.102', createdAt: '2026-06-18T08:45:00Z' },
  { id: 'al5', action: 'BLOCK', entity: 'Customer Sherzod Mirzayev', user: 'Nilufar Qodirova', ip: '192.168.1.10', createdAt: '2026-06-10T14:00:00Z' },
  { id: 'al6', action: 'DELETE', entity: 'Sale S-2026-4517', user: 'Dilnoza Yusupova', ip: '192.168.1.102', createdAt: '2026-06-17T15:12:00Z', details: 'Bekor qilindi' },
];

export const mockBackups: BackupJob[] = [
  { id: 'bk1', type: 'full', status: 'completed', size: '2.4 GB', createdAt: '2026-06-17T02:00:00Z' },
  { id: 'bk2', type: 'incremental', status: 'completed', size: '128 MB', createdAt: '2026-06-18T02:00:00Z' },
  { id: 'bk3', type: 'incremental', status: 'running', size: '—', createdAt: '2026-06-18T12:00:00Z' },
  { id: 'bk4', type: 'full', status: 'failed', size: '—', createdAt: '2026-06-10T02:00:00Z' },
  { id: 'bk5', type: 'incremental', status: 'completed', size: '95 MB', createdAt: '2026-06-16T02:00:00Z' },
];

export const mockMetrics: SystemMetric[] = [
  { id: 'm1', label: 'API javob vaqti', value: '45 ms', status: 'healthy' },
  { id: 'm2', label: 'Ma\'lumotlar bazasi', value: '12 GB / 50 GB', status: 'healthy' },
  { id: 'm3', label: 'Faol sessiyalar', value: '4', status: 'healthy' },
  { id: 'm4', label: 'Xato darajasi (24s)', value: '0.02%', status: 'healthy' },
  { id: 'm5', label: 'Zaxira nusxasi', value: '12 soat oldin', status: 'warning' },
  { id: 'm6', label: 'Disk bo\'sh joyi', value: '18%', status: 'critical' },
];

export const mockBranches: Branch[] = [
  { id: 'b1', name: 'Markaziy filial', address: 'Toshkent, Chilonzor 12', phone: '+998 71 200 00 01', manager: 'Nilufar Qodirova', status: 'active' },
  { id: 'b2', name: 'Shimol filiali', address: 'Toshkent, Yunusobod 45', phone: '+998 71 200 00 02', manager: 'Aziz Karimov', status: 'active' },
  { id: 'b3', name: 'Samarqand filiali', address: 'Samarqand, Registon 8', phone: '+998 66 300 00 01', manager: 'Rustam Aliyev', status: 'inactive' },
];

export const mockCompanySettings: CompanySettings = {
  name: 'TechSavdo MChJ',
  tin: '301234567',
  address: 'Toshkent sh., Chilonzor tumani, 12-uy',
  phone: '+998 71 200 00 00',
  email: 'info@techsavdo.uz',
  defaultCurrency: 'both',
  timezone: 'Asia/Tashkent',
};

export const mockAnalyticsMetrics: AnalyticsMetric[] = [
  { id: 'am1', label: 'Oylik daromad', value: '1.2 mlrd so\'m', change: 14.2, period: 'iyun 2026' },
  { id: 'am2', label: 'Yangi mijozlar', value: '48', change: 8.5, period: 'iyun 2026' },
  { id: 'am3', label: 'O\'rtacha chek', value: '352 000 so\'m', change: -2.1, period: 'iyun 2026' },
  { id: 'am4', label: 'Qaytarishlar', value: '1.8%', change: -0.3, period: 'iyun 2026' },
];

export const mockAnalyticsChart: AnalyticsChartPoint[] = [
  { month: 'Yan', revenue: 980_000_000, profit: 235_000_000, orders: 2840 },
  { month: 'Fev', revenue: 1_050_000_000, profit: 252_000_000, orders: 3012 },
  { month: 'Mar', revenue: 1_120_000_000, profit: 268_000_000, orders: 3180 },
  { month: 'Apr', revenue: 1_080_000_000, profit: 259_000_000, orders: 3050 },
  { month: 'May', revenue: 1_180_000_000, profit: 283_000_000, orders: 3290 },
  { month: 'Iyun', revenue: 1_240_000_000, profit: 298_000_000, orders: 3456 },
];

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find((c) => c.id === id);
}
