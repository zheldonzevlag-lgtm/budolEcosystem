/*
  Warnings:

  - The values [UNDER_REVIEW,RESOLVED_REFUNDED,RESOLVED_DECLINED] on the enum `DisputeStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SYSTEM] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `evidenceUrl` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionNotes` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `bankReference` on the `Settlement` table. All the data in the column will be lost.
  - The `status` column on the `Settlement` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `updatedBy` on the `SystemSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiSecret]` on the table `EcosystemApp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apiSecret` to the `EcosystemApp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KYCTier" AS ENUM ('BASIC', 'SEMI_VERIFIED', 'FULLY_VERIFIED');

-- AlterEnum
BEGIN;
CREATE TYPE "DisputeStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
ALTER TABLE "Dispute" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Dispute" ALTER COLUMN "status" TYPE "DisputeStatus_new" USING ("status"::text::"DisputeStatus_new");
ALTER TYPE "DisputeStatus" RENAME TO "DisputeStatus_old";
ALTER TYPE "DisputeStatus_new" RENAME TO "DisputeStatus";
DROP TYPE "DisputeStatus_old";
ALTER TABLE "Dispute" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'FEE';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN', 'MERCHANT', 'DRIVER', 'STAFF');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropIndex
DROP INDEX "Settlement_status_idx";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "evidenceUrl",
DROP COLUMN "resolutionNotes",
DROP COLUMN "updatedAt",
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EcosystemApp" ADD COLUMN     "apiSecret" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Settlement" DROP COLUMN "bankReference",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SystemSetting" DROP COLUMN "updatedBy",
ADD COLUMN     "appId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "storeId" TEXT,
ADD COLUMN     "storeName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "biometricKeyId" TEXT,
ADD COLUMN     "biometricPublicKey" BYTEA,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "faceTemplate" TEXT,
ADD COLUMN     "isFaceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kycTier" "KYCTier" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "trustedDevices" TEXT;

-- DropEnum
DROP TYPE "SettlementStatus";

-- CreateTable
CREATE TABLE "FavoriteRecipient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "alias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "faceTemplate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "blobData" BYTEA,
    "remoteUrl" TEXT,
    "ocrData" JSONB,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FavoriteRecipient_userId_idx" ON "FavoriteRecipient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteRecipient_userId_recipientId_key" ON "FavoriteRecipient"("userId", "recipientId");

-- CreateIndex
CREATE INDEX "VerificationDocument_userId_idx" ON "VerificationDocument"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_key_idx" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "EcosystemApp_apiSecret_key" ON "EcosystemApp"("apiSecret");

-- CreateIndex
CREATE INDEX "Transaction_storeId_idx" ON "Transaction"("storeId");

-- AddForeignKey
ALTER TABLE "FavoriteRecipient" ADD CONSTRAINT "FavoriteRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRecipient" ADD CONSTRAINT "FavoriteRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_appId_fkey" FOREIGN KEY ("appId") REFERENCES "EcosystemApp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
