-- schema.prisma had `Product.legacyId` (@map("legacy_id")) and
-- `InventoryBatch.batchNumber` (@map("batch_number")) but no migration ever
-- added the columns to the database, causing every products/inventory-batch
-- query to fail with "column does not exist" in production. Both columns
-- are nullable with no default, so this is purely additive and safe to run
-- against existing data.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "legacy_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN "batch_number" VARCHAR(100);
