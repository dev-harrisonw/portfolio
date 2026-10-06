-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "status" "LeadStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
