-- Debt aging query performance indexes
CREATE INDEX IF NOT EXISTS "debt_history_company_type_created_idx"
  ON "debt_history" ("company_id", "type", "created_at");

CREATE INDEX IF NOT EXISTS "supplier_debt_history_company_type_created_idx"
  ON "supplier_debt_history" ("company_id", "type", "created_at");
