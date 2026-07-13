/*
  Warnings:

  - Added the required column `amount` to the `supplier_payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_company_created_idx";

-- DropIndex
DROP INDEX "debt_history_company_type_created_idx";

-- DropIndex
DROP INDEX "inventory_movements_company_id_type_created_at_idx";

-- DropIndex
DROP INDEX "sale_items_product_id_idx";

-- DropIndex
DROP INDEX "sale_returns_analytics_idx";

-- DropIndex
DROP INDEX "sales_analytics_company_branch_created_idx";

-- DropIndex
DROP INDEX "sales_analytics_company_status_created_idx";

-- DropIndex
DROP INDEX "sales_company_id_branch_id_created_at_idx";

-- DropIndex
DROP INDEX "sales_company_id_status_created_at_idx";

-- DropIndex
DROP INDEX "supplier_debt_history_company_type_created_idx";

-- DropIndex
DROP INDEX "supplier_payments_analytics_idx";

-- DropIndex
DROP INDEX "supplier_receipts_analytics_idx";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "exchange_rate_used" DECIMAL(18,4) NOT NULL DEFAULT 1,
ADD COLUMN     "original_currency" "OriginalCurrency" NOT NULL DEFAULT 'UZS';

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "expiry_date" DATE,
ADD COLUMN     "manufacture_date" DATE;

-- AlterTable
ALTER TABLE "product_prices" ADD COLUMN     "min_price_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "min_price_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "recommended_price_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "recommended_price_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "wholesale_price_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "wholesale_price_uzs" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "pdf_catalog_url" TEXT,
ADD COLUMN     "tech_passport_url" TEXT,
ADD COLUMN     "user_manual_url" TEXT;

-- AlterTable
ALTER TABLE "sale_returns" ADD COLUMN     "original_currency" "OriginalCurrency" NOT NULL DEFAULT 'UZS';

-- AlterTable
ALTER TABLE "supplier_debt_history" ADD COLUMN     "amount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "balance_after_usd" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "supplier_payments" ADD COLUMN     "amount" DECIMAL(18,4) NOT NULL,
ADD COLUMN     "amount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" "OriginalCurrency" NOT NULL DEFAULT 'UZS',
ADD COLUMN     "exchange_rate_used" DECIMAL(18,4) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "supplier_receipts" ADD COLUMN     "exchange_rate_used" DECIMAL(18,4) NOT NULL DEFAULT 1,
ADD COLUMN     "original_currency" "OriginalCurrency" NOT NULL DEFAULT 'UZS',
ADD COLUMN     "total_cost_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "unit_cost_usd" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "total_debt_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
ADD COLUMN     "total_paid_usd" DECIMAL(18,4) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_barcodes" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "barcode" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_unit_conversions" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "from_unit" VARCHAR(20) NOT NULL,
    "to_unit" VARCHAR(20) NOT NULL,
    "conversion_factor" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_aliases" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_products" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reservations" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_serials" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "serial_number" VARCHAR(255) NOT NULL,
    "imei" VARCHAR(100),
    "lot_number" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_serials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_templates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "phone" VARCHAR(50),
    "address" TEXT,
    "telegram" VARCHAR(100),
    "instagram" VARCHAR(100),
    "website" VARCHAR(255),
    "footer_text" TEXT,
    "show_qr_code" BOOLEAN NOT NULL DEFAULT true,
    "show_barcode" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_histories" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "old_price_uzs" DECIMAL(18,4) NOT NULL,
    "new_price_uzs" DECIMAL(18,4) NOT NULL,
    "old_price_usd" DECIMAL(18,4) NOT NULL,
    "new_price_usd" DECIMAL(18,4) NOT NULL,
    "exchange_rate" DECIMAL(18,4) NOT NULL,
    "reason" VARCHAR(255),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_price_histories" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "batch_id" UUID,
    "currency" "OriginalCurrency" NOT NULL DEFAULT 'UZS',
    "exchange_rate" DECIMAL(18,4) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_cost" DECIMAL(18,4) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_price_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_barcodes_barcode_idx" ON "product_barcodes"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_product_id_barcode_key" ON "product_barcodes"("product_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_unit_conversions_product_id_from_unit_to_unit_key" ON "product_unit_conversions"("product_id", "from_unit", "to_unit");

-- CreateIndex
CREATE INDEX "product_aliases_alias_idx" ON "product_aliases"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "product_aliases_product_id_alias_key" ON "product_aliases"("product_id", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorite_products_user_id_product_id_key" ON "user_favorite_products"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "product_reservations_product_id_idx" ON "product_reservations"("product_id");

-- CreateIndex
CREATE INDEX "product_serials_serial_number_idx" ON "product_serials"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "product_serials_product_id_serial_number_key" ON "product_serials"("product_id", "serial_number");

-- CreateIndex
CREATE INDEX "document_attachments_entity_type_entity_id_idx" ON "document_attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_company_id_key_key" ON "feature_flags"("company_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_templates_company_id_name_key" ON "receipt_templates"("company_id", "name");

-- CreateIndex
CREATE INDEX "product_price_histories_product_id_idx" ON "product_price_histories"("product_id");

-- CreateIndex
CREATE INDEX "product_price_histories_company_id_idx" ON "product_price_histories"("company_id");

-- CreateIndex
CREATE INDEX "supplier_price_histories_supplier_id_idx" ON "supplier_price_histories"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_price_histories_product_id_idx" ON "supplier_price_histories"("product_id");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_unit_conversions" ADD CONSTRAINT "product_unit_conversions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_products" ADD CONSTRAINT "user_favorite_products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_products" ADD CONSTRAINT "user_favorite_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reservations" ADD CONSTRAINT "product_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_histories" ADD CONSTRAINT "product_price_histories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_histories" ADD CONSTRAINT "product_price_histories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_histories" ADD CONSTRAINT "product_price_histories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_histories" ADD CONSTRAINT "product_price_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_price_histories" ADD CONSTRAINT "supplier_price_histories_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_price_histories" ADD CONSTRAINT "supplier_price_histories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_price_histories" ADD CONSTRAINT "supplier_price_histories_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "inventory_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_price_histories" ADD CONSTRAINT "supplier_price_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
