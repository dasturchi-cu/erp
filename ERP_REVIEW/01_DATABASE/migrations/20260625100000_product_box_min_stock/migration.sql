-- Product box quantity and minimum stock level
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "units_per_box" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_stock_level" DECIMAL(18,4) NOT NULL DEFAULT 0;
