-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (one default warehouse per company)
CREATE UNIQUE INDEX "warehouses_company_default_idx"
  ON "warehouses"("company_id")
  WHERE "is_default" = true;

-- Mark existing first warehouse per company as default
UPDATE "warehouses" w
SET "is_default" = true
FROM (
  SELECT DISTINCT ON (company_id) id
  FROM "warehouses"
  ORDER BY company_id, created_at ASC
) first_wh
WHERE w.id = first_wh.id;
