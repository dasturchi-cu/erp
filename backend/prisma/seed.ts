import {
  PrismaClient,
  CompanyStatus,
  UserStatus,
  UserCompanyStatus,
  NotificationCategory,
  NotificationSeverity,
  BackupType,
  BackupJobStatus,
  BackupTrigger,
  DebtHistoryType,
  SupplierDebtHistoryType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS: Array<{ code: string; module: string; description: string }> = [
  { code: 'products.view', module: 'products', description: 'View products' },
  { code: 'products.create', module: 'products', description: 'Create products' },
  { code: 'products.update', module: 'products', description: 'Update products' },
  { code: 'products.delete', module: 'products', description: 'Delete products' },
  { code: 'categories.manage', module: 'products', description: 'Manage categories' },
  { code: 'inventory.view', module: 'inventory', description: 'View inventory' },
  { code: 'inventory.receive', module: 'inventory', description: 'Receive stock' },
  { code: 'inventory.adjust', module: 'inventory', description: 'Adjust stock' },
  { code: 'inventory.transfer', module: 'inventory', description: 'Transfer stock' },
  { code: 'warehouses.manage', module: 'inventory', description: 'Manage warehouses' },
  { code: 'sales.view', module: 'sales', description: 'View sales' },
  { code: 'sales.view_all', module: 'sales', description: 'View all cashiers sales' },
  { code: 'sales.create', module: 'sales', description: 'Create sales' },
  { code: 'sales.cancel', module: 'sales', description: 'Void sales' },
  { code: 'sales.return', module: 'sales', description: 'Process returns' },
  { code: 'customers.view', module: 'customers', description: 'View customers' },
  { code: 'customers.create', module: 'customers', description: 'Create customers' },
  { code: 'customers.update', module: 'customers', description: 'Update customers' },
  { code: 'customers.delete', module: 'customers', description: 'Delete customers' },
  { code: 'debt.view', module: 'debt', description: 'View debt' },
  { code: 'debt.payment', module: 'debt', description: 'Record payments' },
  { code: 'debt.reverse', module: 'debt', description: 'Reverse payments' },
  { code: 'debt.aging', module: 'debt', description: 'View aging report' },
  { code: 'debt.aging.export', module: 'debt', description: 'Export aging reports' },
  { code: 'suppliers.view', module: 'suppliers', description: 'View suppliers' },
  { code: 'suppliers.create', module: 'suppliers', description: 'Create suppliers' },
  { code: 'suppliers.update', module: 'suppliers', description: 'Update suppliers' },
  { code: 'suppliers.delete', module: 'suppliers', description: 'Archive suppliers' },
  { code: 'suppliers.payment', module: 'suppliers', description: 'Record supplier payments' },
  { code: 'currency.view', module: 'currency', description: 'View exchange rates' },
  { code: 'currency.manage', module: 'currency', description: 'Set exchange rates' },
  { code: 'dashboard.view', module: 'dashboard', description: 'View dashboard' },
  { code: 'reports.view', module: 'reports', description: 'Access report center' },
  { code: 'reports.generate', module: 'reports', description: 'Generate and export reports' },
  { code: 'reports.sales', module: 'reports', description: 'Generate sales reports' },
  { code: 'reports.inventory', module: 'reports', description: 'Generate inventory reports' },
  { code: 'reports.debt', module: 'reports', description: 'Generate debt reports' },
  { code: 'reports.financial', module: 'reports', description: 'Generate profit and expense reports' },
  { code: 'reports.audit', module: 'reports', description: 'Generate audit log exports' },
  { code: 'analytics.view', module: 'analytics', description: 'View analytics and KPI dashboards' },
  { code: 'notifications.view', module: 'notifications', description: 'View notifications' },
  { code: 'notifications.manage', module: 'notifications', description: 'Manage and create notifications' },
  { code: 'admin.*', module: 'admin', description: 'Full admin access' },
  { code: 'admin.users.view', module: 'admin', description: 'View users' },
  { code: 'admin.users.create', module: 'admin', description: 'Create users' },
  { code: 'admin.users.manage', module: 'admin', description: 'Manage user membership status' },
  { code: 'admin.audit.view', module: 'admin', description: 'View audit logs' },
];

const MODULES: Array<{ code: string; name: string; isCore: boolean }> = [
  { code: 'core', name: 'Core Platform', isCore: true },
  { code: 'auth', name: 'Authentication', isCore: true },
  { code: 'products', name: 'Products', isCore: false },
  { code: 'inventory', name: 'Inventory', isCore: false },
  { code: 'sales', name: 'Sales', isCore: false },
  { code: 'customers', name: 'Customers', isCore: false },
  { code: 'suppliers', name: 'Suppliers', isCore: false },
  { code: 'debt', name: 'Debt Management', isCore: false },
  { code: 'currency', name: 'Currency', isCore: false },
  { code: 'dashboard', name: 'Dashboard', isCore: false },
  { code: 'reports', name: 'Reports', isCore: false },
  { code: 'analytics', name: 'Analytics', isCore: false },
  { code: 'notifications', name: 'Notifications', isCore: false },
  { code: 'admin', name: 'Administration', isCore: false },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: PERMISSIONS.map((p) => p.code),
  Manager: PERMISSIONS.filter((p) => !p.code.startsWith('admin.')).map((p) => p.code),
  Cashier: [
    'products.view',
    'inventory.view',
    'sales.view',
    'sales.create',
    'sales.return',
    'customers.view',
    'customers.create',
    'debt.view',
    'debt.payment',
    'debt.aging',
    'currency.view',
    'dashboard.view',
    'reports.view',
    'reports.generate',
    'reports.sales',
    'reports.inventory',
    'reports.debt',
    'reports.financial',
    'analytics.view',
    'notifications.view',
  ],
  Warehouse: [
    'products.view',
    'products.create',
    'products.update',
    'inventory.view',
    'inventory.receive',
    'inventory.adjust',
    'inventory.transfer',
    'warehouses.manage',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'suppliers.payment',
  ],
};

async function main() {
  console.log('Truncating tables for clean production seed...');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE 
      customers, debt_history, debt_payments, expenses, inventory_batches, 
      inventory_movements, notifications, product_aliases, product_barcodes, 
      product_categories, product_images, product_price_histories, product_prices, 
      product_reservations, product_serials, product_unit_conversions, products, 
      sale_fifo_allocations, sale_items, sale_number_sequences, sale_return_items, 
      sale_returns, sales, supplier_debt_history, supplier_payments, 
      supplier_price_histories, supplier_receipts, suppliers, audit_logs
      CASCADE;`);
  } catch (e) {
    console.error('Truncate table error (ignoring for fresh DB):', e);
  }

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { module: perm.module, description: perm.description },
    });
  }

  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { code: mod.code },
      create: mod,
      update: { name: mod.name, isCore: mod.isCore },
    });
  }

  const company = await prisma.company.upsert({
    where: { code: 'MKT-TAS' },
    create: {
      name: 'Xitoy Tavar',
      code: 'MKT-TAS',
      status: CompanyStatus.ACTIVE,
      settings: {},
    },
    update: {
      name: 'Xitoy Tavar',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Markaziy filial' } },
    create: {
      companyId: company.id,
      name: 'Markaziy filial',
      address: 'Toshkent, Chilonzor 12',
      isDefault: true,
      status: CompanyStatus.ACTIVE,
    },
    update: {},
  });

  const allModules = await prisma.module.findMany();
  for (const mod of allModules) {
    await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: { companyId: company.id, moduleId: mod.id },
      },
      create: { companyId: company.id, moduleId: mod.id, enabled: true },
      update: { enabled: true },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    let role = await prisma.role.findFirst({
      where: { companyId: company.id, name: roleName },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          companyId: company.id,
          name: roleName,
          description: `${roleName} role`,
          isSystem: true,
        },
      });
    }

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const code of codes) {
      const permissionId = permissionByCode.get(code);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId },
        });
      }
    }
  }

  const adminRole = await prisma.role.findFirstOrThrow({
    where: { companyId: company.id, name: 'Admin' },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.uz' },
    create: {
      email: 'admin@erp.uz',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
    },
    update: { passwordHash },
  });

  await prisma.saaSAdmin.upsert({
    where: { email: 'admin@erp.uz' },
    create: {
      email: 'admin@erp.uz',
      passwordHash,
    },
    update: { passwordHash },
  });

  await prisma.userCompany.upsert({
    where: {
      userId_companyId: { userId: admin.id, companyId: company.id },
    },
    create: {
      userId: admin.id,
      companyId: company.id,
      roleId: adminRole.id,
      branchId: branch.id,
      status: UserCompanyStatus.ACTIVE,
    },
    update: {
      roleId: adminRole.id,
      branchId: branch.id,
      status: UserCompanyStatus.ACTIVE,
    },
  });

  await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Asosiy ombor' } },
    create: {
      companyId: company.id,
      branchId: branch.id,
      name: 'Asosiy ombor',
      address: 'Toshkent, Chilonzor 12',
      isDefault: true,
      status: CompanyStatus.ACTIVE,
    },
    update: { isDefault: true },
  });

  const branchNorth = await prisma.branch.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Shimol filiali' } },
    create: {
      companyId: company.id,
      name: 'Shimol filiali',
      address: 'Toshkent, Yunusobod 45',
      isDefault: false,
      status: CompanyStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Shimol ombori' } },
    create: {
      companyId: company.id,
      branchId: branchNorth.id,
      name: 'Shimol ombori',
      address: 'Yunusobod, sklad 2',
      isDefault: false,
      status: CompanyStatus.ACTIVE,
    },
    update: {},
  });

  await prisma.warehouse.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Zaxira ombori' } },
    create: {
      companyId: company.id,
      branchId: branch.id,
      name: 'Zaxira ombori',
      address: 'Chilonzor, zaxira binosi',
      isDefault: false,
      status: CompanyStatus.ACTIVE,
    },
    update: {},
  });

  const existingRate = await prisma.exchangeRate.findFirst({
    where: { companyId: company.id, status: 'ACTIVE' },
  });
  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: {
        companyId: company.id,
        rate: 12620,
        status: 'ACTIVE',
        notes: 'Demo seed rate',
        setBy: admin.id,
      },
    });
  }

  // Skip demo data seeding for a clean production database


  console.log('Seed complete.');
  console.log('Demo login: admin@erp.uz / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
