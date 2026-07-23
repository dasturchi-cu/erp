-- Supplier / Vendor Management Module

CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "SupplierReceivePaymentType" AS ENUM ('CASH', 'CREDIT');
CREATE TYPE "SupplierDebtHistoryType" AS ENUM ('receipt_credit', 'payment', 'adjustment');
CREATE TYPE "SupplierPaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER');

CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "contact_person" VARCHAR(255),
    "notes" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_debt_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_paid_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_receipts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "inventory_batch_id" UUID,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_cost_uzs" DECIMAL(18,4) NOT NULL,
    "total_cost_uzs" DECIMAL(18,4) NOT NULL,
    "payment_type" "SupplierReceivePaymentType" NOT NULL,
    "note" TEXT,
    "received_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_payments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    "payment_method" "SupplierPaymentMethod" NOT NULL,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_debt_history" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "type" "SupplierDebtHistoryType" NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    "balance_after_uzs" DECIMAL(18,4) NOT NULL,
    "reference" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID NOT NULL,

    CONSTRAINT "supplier_debt_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "suppliers_company_id_idx" ON "suppliers"("company_id");
CREATE INDEX "supplier_receipts_company_id_supplier_id_created_at_idx" ON "supplier_receipts"("company_id", "supplier_id", "created_at" DESC);
CREATE INDEX "supplier_payments_company_id_supplier_id_created_at_idx" ON "supplier_payments"("company_id", "supplier_id", "created_at" DESC);
CREATE INDEX "supplier_debt_history_company_id_supplier_id_created_at_idx" ON "supplier_debt_history"("company_id", "supplier_id", "created_at" DESC);

ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_receipts" ADD CONSTRAINT "supplier_receipts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_receipts" ADD CONSTRAINT "supplier_receipts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_receipts" ADD CONSTRAINT "supplier_receipts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_receipts" ADD CONSTRAINT "supplier_receipts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_receipts" ADD CONSTRAINT "supplier_receipts_inventory_batch_id_fkey" FOREIGN KEY ("inventory_batch_id") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_debt_history" ADD CONSTRAINT "supplier_debt_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_debt_history" ADD CONSTRAINT "supplier_debt_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
