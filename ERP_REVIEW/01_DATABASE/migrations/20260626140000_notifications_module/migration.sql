-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('info', 'warning', 'success', 'error');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM (
  'STOCK_ALERT',
  'DEBT_ALERT',
  'SUPPLIER_DEBT',
  'CUSTOMER_DEBT',
  'LOW_STOCK',
  'EXPIRED_PRODUCT',
  'SYSTEM',
  'LOGIN'
);

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "expires_at" DATE;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'info',
    "category" "NotificationCategory" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_company_id_user_id_read_created_at_idx"
  ON "notifications"("company_id", "user_id", "read", "created_at" DESC);

CREATE INDEX "notifications_company_id_category_entity_id_created_at_idx"
  ON "notifications"("company_id", "category", "entity_id", "created_at" DESC);

CREATE INDEX "notifications_company_id_deleted_at_idx"
  ON "notifications"("company_id", "deleted_at");

CREATE INDEX "products_company_id_expires_at_idx"
  ON "products"("company_id", "expires_at")
  WHERE "expires_at" IS NOT NULL AND "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
