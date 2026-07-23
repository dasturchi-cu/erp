-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ExchangeRateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'VOID_RESTORE');

-- CreateEnum
CREATE TYPE "InventoryBatchSourceType" AS ENUM ('RECEIPT', 'RETURN', 'ADJUSTMENT', 'VOID_RESTORE', 'TRANSFER_IN');

-- CreateEnum
CREATE TYPE "DebtHistoryType" AS ENUM ('sale_credit', 'payment', 'return', 'adjustment', 'sale_void');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parent_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "name" VARCHAR(500) NOT NULL,
    "category_id" UUID,
    "unit_of_measure" VARCHAR(20) NOT NULL DEFAULT 'pcs',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "product_id" UUID NOT NULL,
    "purchase_price_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "purchase_price_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "sale_price_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "sale_price_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "phone_secondary" VARCHAR(20),
    "email" VARCHAR(255),
    "address" TEXT,
    "partnership_start_date" DATE,
    "notes" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_debt_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_debt_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_purchases_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "last_purchase_at" TIMESTAMPTZ(6),
    "last_payment_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_history" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "DebtHistoryType" NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "amount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "balance_after_uzs" DECIMAL(18,4) NOT NULL,
    "balance_after_usd" DECIMAL(18,4) NOT NULL,
    "reference_type" VARCHAR(30),
    "reference_id" UUID,
    "reference_label" VARCHAR(100),
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "rate" DECIMAL(18,4) NOT NULL,
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ExchangeRateStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "set_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_batches" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "remaining_qty" DECIMAL(18,4) NOT NULL,
    "unit_cost_uzs" DECIMAL(18,4) NOT NULL,
    "unit_cost_usd" DECIMAL(18,4) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL,
    "source_type" "InventoryBatchSourceType" NOT NULL DEFAULT 'RECEIPT',
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "batch_id" UUID,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "reference_type" VARCHAR(30),
    "reference_id" UUID,
    "note" TEXT,
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_company_id_name_parent_id_key" ON "product_categories"("company_id", "name", "parent_id");

-- CreateIndex
CREATE INDEX "product_categories_company_id_idx" ON "product_categories"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_sku_key" ON "products"("company_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_barcode_key" ON "products"("company_id", "barcode");

-- CreateIndex
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE INDEX "customers_company_id_name_idx" ON "customers"("company_id", "name");

-- CreateIndex
CREATE INDEX "debt_history_company_id_customer_id_created_at_idx" ON "debt_history"("company_id", "customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "exchange_rates_company_id_status_idx" ON "exchange_rates"("company_id", "status");

-- CreateIndex
CREATE INDEX "exchange_rates_company_id_effective_from_idx" ON "exchange_rates"("company_id", "effective_from" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_exchange_rates_active" ON "exchange_rates"("company_id") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_company_id_name_key" ON "warehouses"("company_id", "name");

-- CreateIndex
CREATE INDEX "warehouses_company_id_idx" ON "warehouses"("company_id");

-- CreateIndex
CREATE INDEX "inventory_batches_company_id_product_id_warehouse_id_idx" ON "inventory_batches"("company_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_batches_company_id_product_id_received_at_idx" ON "inventory_batches"("company_id", "product_id", "received_at");

-- CreateIndex
CREATE INDEX "inventory_movements_company_id_product_id_created_at_idx" ON "inventory_movements"("company_id", "product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_movements_company_id_warehouse_id_created_at_idx" ON "inventory_movements"("company_id", "warehouse_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_history" ADD CONSTRAINT "debt_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_history" ADD CONSTRAINT "debt_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_history" ADD CONSTRAINT "debt_history_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stock views
CREATE VIEW product_stock AS
SELECT
  b.company_id,
  b.product_id,
  b.warehouse_id,
  SUM(b.remaining_qty) AS stock_qty,
  COUNT(*) AS batch_count
FROM inventory_batches b
WHERE b.remaining_qty > 0
GROUP BY b.company_id, b.product_id, b.warehouse_id;

CREATE VIEW product_stock_total AS
SELECT
  company_id,
  product_id,
  SUM(stock_qty) AS stock_qty
FROM product_stock
GROUP BY company_id, product_id;
