-- Analytics query performance indexes
CREATE INDEX IF NOT EXISTS "sales_analytics_company_status_created_idx"
  ON "sales"("company_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "sales_analytics_company_branch_created_idx"
  ON "sales"("company_id", "branch_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "sale_returns_analytics_idx"
  ON "sale_returns"("company_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "customers_company_created_idx"
  ON "customers"("company_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "supplier_receipts_analytics_idx"
  ON "supplier_receipts"("company_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "supplier_payments_analytics_idx"
  ON "supplier_payments"("company_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "expenses_analytics_idx"
  ON "expenses"("company_id", "expense_date" DESC);
