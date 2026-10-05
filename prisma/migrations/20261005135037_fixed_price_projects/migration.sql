-- CreateEnum
CREATE TYPE "ProjectBillingType" AS ENUM ('TIME', 'FIXED');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('FIFTY_FIFTY', 'UPFRONT', 'ON_COMPLETION', 'FORTY_THIRTY_THIRTY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'DUE', 'INVOICED', 'PAID');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "billingType" "ProjectBillingType" NOT NULL DEFAULT 'TIME',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "fixedPrice" INTEGER,
ADD COLUMN     "paymentTerms" "PaymentTerms",
ADD COLUMN     "progressOverride" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentStage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "reachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentStage_projectId_idx" ON "PaymentStage"("projectId");

-- AddForeignKey
ALTER TABLE "PaymentStage" ADD CONSTRAINT "PaymentStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
