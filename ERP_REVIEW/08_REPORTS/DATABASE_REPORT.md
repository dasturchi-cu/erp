# DATABASE_REPORT

## 1. Engine & Schema Design
- **DBMS**: PostgreSQL (v16.3)
- **ORM**: Prisma schema with public schema mapping.
- **Migration Strategy**: Sequential, incremental SQL scripts managed by Prisma Migrate.

## 2. Model Entities & Relations
The database schema has 52 tables. Major structural areas:
- **IAM**: `User` -> `Role` -> `Permission`. `UserCompany` links users to multi-tenant `Company` scopes.
- **Product Catalog**: `ProductCategory` (1-to-N) -> `Product`. Product extensions: `ProductBarcode`, `ProductUnitConversion`, `ProductAlias`, `ProductImage`.
- **Inventory & Batches**: `Warehouse`, `InventoryBatch` (for lot tracking and expiry dates), `InventoryMovement` (recording stocks in/out).
- **Sales & POS**: `Sale` -> `SaleItem`. `SaleFifoAllocation` tracks cost-of-goods-sold using FIFO queues.
- **Suppliers**: `Supplier`, `SupplierReceipt`, `SupplierPayment`, `SupplierDebtHistory`.
- **SaaS Platform**: `SaasPlan`, `TenantSubscription`, `SaasUsageStat`.

## 3. Performance & Integrity Review
- **Indexes**: Explicit indexes on `Product.sku`, `Product.barcode`, `Sale.saleNumber`, and relationship foreign keys.
- **Idempotency**: `IdempotencyKey` table prevents double-submitting critical transaction requests.
- **Constraints**: Database-level foreign keys ensure absolute referential integrity.
