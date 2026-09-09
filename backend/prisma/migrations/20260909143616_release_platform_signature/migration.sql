-- Adds platform targeting (a release row previously served both desktop and
-- mobile clients with no way to tell them apart) and persists the RSA
-- signature that upload-time code already computed but discarded — needed
-- so clients can actually verify a downloaded update before installing it.
-- Both columns are additive; `platform` defaults existing rows to 'desktop'
-- (their only real consumer so far), `signature` is nullable for old rows.

-- AlterTable
ALTER TABLE "remote_update_histories" ADD COLUMN     "platform" VARCHAR(20) NOT NULL DEFAULT 'desktop',
ADD COLUMN     "signature" TEXT;

-- CreateIndex
CREATE INDEX "remote_update_histories_platform_status_released_at_idx" ON "remote_update_histories"("platform", "status", "released_at" DESC);
