-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "BackupJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupTrigger" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateTable
CREATE TABLE "backup_jobs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "type" "BackupType" NOT NULL,
    "trigger" "BackupTrigger" NOT NULL DEFAULT 'MANUAL',
    "status" "BackupJobStatus" NOT NULL DEFAULT 'PENDING',
    "file_path" VARCHAR(500),
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100),
    "file_size" INTEGER,
    "error_message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_jobs_company_id_status_created_at_idx"
  ON "backup_jobs"("company_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "backup_jobs_company_id_created_at_idx"
  ON "backup_jobs"("company_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_jobs" ADD CONSTRAINT "backup_jobs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
