-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "SalePaymentType" AS ENUM ('CASH', 'CREDIT', 'MIXED');

-- CreateEnum
CREATE TYPE "SaleReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DebtPaymentType" AS ENUM ('PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "DebtPaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "OriginalCurrency" AS ENUM ('UZS', 'USD');

-- CreateTable
CREATE TABLE "sale_number_sequences" (
    "company_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "sale_number_sequences_pkey" PRIMARY KEY ("company_id","year")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "sale_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID,
    "cashier_id" UUID NOT NULL,
    "original_currency" "OriginalCurrency" NOT NULL,
    "exchange_rate_used" DECIMAL(18,4) NOT NULL,
    "subtotal_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "subtotal_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discount_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "payment_type" "SalePaymentType" NOT NULL,
    "amount_paid_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "amount_paid_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "voided_at" TIMESTAMPTZ(6),
    "voided_by" UUID,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price_uzs" DECIMAL(18,4) NOT NULL,
    "unit_price_usd" DECIMAL(18,4) NOT NULL,
    "total_uzs" DECIMAL(18,4) NOT NULL,
    "total_usd" DECIMAL(18,4) NOT NULL,
    "cogs_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cogs_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_fifo_allocations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "sale_item_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_cost_uzs" DECIMAL(18,4) NOT NULL,
    "unit_cost_usd" DECIMAL(18,4) NOT NULL,
    "cost_uzs" DECIMAL(18,4) NOT NULL,
    "cost_usd" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "sale_fifo_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_returns" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "customer_id" UUID,
    "exchange_rate_used" DECIMAL(18,4) NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SaleReturnStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "rejected_by" UUID,
    "decision_note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    CONSTRAINT "sale_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_return_items" (
    "id" UUID NOT NULL,
    "return_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "sale_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" "OriginalCurrency" NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL,
    "exchange_rate_used" DECIMAL(18,4) NOT NULL,
    "payment_type" "DebtPaymentType" NOT NULL,
    "payment_method" "DebtPaymentMethod" NOT NULL,
    "notes" TEXT,
    "reversed_at" TIMESTAMPTZ(6),
    "reversal_reason" TEXT,
    "received_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "endpoint" VARCHAR(100) NOT NULL,
    "request_hash" VARCHAR(64),
    "response_status" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_company_id_sale_number_key" ON "sales"("company_id", "sale_number");
CREATE INDEX "sales_company_id_created_at_idx" ON "sales"("company_id", "created_at" DESC);
CREATE INDEX "sales_company_id_customer_id_created_at_idx" ON "sales"("company_id", "customer_id", "created_at" DESC);
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");
CREATE INDEX "sale_fifo_allocations_sale_id_idx" ON "sale_fifo_allocations"("sale_id");
CREATE INDEX "sale_returns_company_id_created_at_idx" ON "sale_returns"("company_id", "created_at" DESC);
CREATE INDEX "sale_returns_company_id_sale_id_idx" ON "sale_returns"("company_id", "sale_id");
CREATE INDEX "sale_return_items_return_id_idx" ON "sale_return_items"("return_id");
CREATE INDEX "debt_payments_company_id_customer_id_created_at_idx" ON "debt_payments"("company_id", "customer_id", "created_at" DESC);
CREATE UNIQUE INDEX "idempotency_keys_company_id_idempotency_key_endpoint_key" ON "idempotency_keys"("company_id", "idempotency_key", "endpoint");
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- AddForeignKey
ALTER TABLE "sale_number_sequences" ADD CONSTRAINT "sale_number_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_fifo_allocations" ADD CONSTRAINT "sale_fifo_allocations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_fifo_allocations" ADD CONSTRAINT "sale_fifo_allocations_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_fifo_allocations" ADD CONSTRAINT "sale_fifo_allocations_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_fifo_allocations" ADD CONSTRAINT "sale_fifo_allocations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_fifo_allocations" ADD CONSTRAINT "sale_fifo_allocations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "sale_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
