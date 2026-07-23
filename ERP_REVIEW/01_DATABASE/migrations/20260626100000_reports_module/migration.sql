-- CreateEnum
CREATE TYPE "ReportPeriod" AS ENUM ('daily', 'weekly', 'monthly', 'yearly', 'custom');

-- CreateEnum
CREATE TYPE "ReportExportFormat" AS ENUM ('PDF', 'XLSX', 'CSV');

-- CreateEnum
CREATE TYPE "ReportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'UTILITIES', 'SUPPLIES', 'MARKETING', 'TRANSPORT', 'MAINTENANCE', 'OTHER');

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "category" "ExpenseCategory" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount_uzs" DECIMAL(18,4) NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "expense_date" DATE NOT NULL,
    "recorded_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "format" "ReportExportFormat" NOT NULL,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'PENDING',
    "period" "ReportPeriod",
    "date_from" DATE,
    "date_to" DATE,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "row_count" INTEGER,
    "file_path" VARCHAR(500),
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "file_size" INTEGER,
    "error_message" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_company_id_expense_date_idx" ON "expenses"("company_id", "expense_date" DESC);

-- CreateIndex
CREATE INDEX "expenses_company_id_category_expense_date_idx" ON "expenses"("company_id", "category", "expense_date" DESC);

-- CreateIndex
CREATE INDEX "expenses_company_id_branch_id_expense_date_idx" ON "expenses"("company_id", "branch_id", "expense_date" DESC);

-- CreateIndex
CREATE INDEX "report_jobs_company_id_user_id_created_at_idx" ON "report_jobs"("company_id", "user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_jobs_company_id_status_created_at_idx" ON "report_jobs"("company_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_jobs_company_id_template_created_at_idx" ON "report_jobs"("company_id", "template", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_jobs_expires_at_idx" ON "report_jobs"("expires_at");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_jobs" ADD CONSTRAINT "report_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Performance indexes for report queries
CREATE INDEX IF NOT EXISTS "sales_company_id_status_created_at_idx" ON "sales"("company_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "sales_company_id_branch_id_created_at_idx" ON "sales"("company_id", "branch_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "sale_items_product_id_idx" ON "sale_items"("product_id");
CREATE INDEX IF NOT EXISTS "inventory_movements_company_id_type_created_at_idx" ON "inventory_movements"("company_id", "type", "created_at" DESC);
