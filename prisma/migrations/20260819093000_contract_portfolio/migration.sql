CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY');
CREATE TYPE "ContractOrigin" AS ENUM ('MANUAL_INTAKE', 'COMMERCIAL');
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE "ContractProduct" AS ENUM ('START', 'LOOP', 'NEXT', 'OTHER');
CREATE TYPE "ResourceLinkEntityType" AS ENUM ('CONTRACT', 'PROJECT');
CREATE TYPE "ResourceLinkType" AS ENUM ('CONTRACT', 'PROPOSAL', 'SCOPE', 'AMENDMENT', 'INVOICE', 'RECEIPT', 'DRIVE', 'FIGMA', 'NOTION', 'REPOSITORY', 'PRODUCTION', 'STAGING', 'DOCUMENTATION', 'OTHER');
CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'DELAYED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Client" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(160) NOT NULL,
  "type" "ClientType" NOT NULL,
  "documentNumber" VARCHAR(32),
  "email" VARCHAR(320),
  "phone" VARCHAR(48),
  "financialContactName" VARCHAR(160),
  "financialContactEmail" VARCHAR(320),
  "financialContactPhone" VARCHAR(48),
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contract" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(200) NOT NULL,
  "clientId" UUID NOT NULL,
  "origin" "ContractOrigin" NOT NULL DEFAULT 'MANUAL_INTAKE',
  "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "product" "ContractProduct" NOT NULL,
  "customProductName" VARCHAR(120),
  "contractValueCents" BIGINT NOT NULL,
  "signatureDate" DATE,
  "startDate" DATE,
  "expectedEndDate" DATE,
  "executionTermMonths" INTEGER,
  "description" TEXT,
  "internalNotes" TEXT,
  "sharedProject" BOOLEAN NOT NULL DEFAULT false,
  "partnerName" VARCHAR(160),
  "transferRule" TEXT,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(200) NOT NULL,
  "clientId" UUID NOT NULL,
  "contractId" UUID,
  "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "managerMemberId" UUID,
  "startDate" DATE,
  "expectedEndDate" DATE,
  "description" TEXT,
  "internalNotes" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResourceLink" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entityType" "ResourceLinkEntityType" NOT NULL,
  "contractId" UUID,
  "projectId" UUID,
  "type" "ResourceLinkType" NOT NULL,
  "label" VARCHAR(160) NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResourceLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResourceLink_exactly_one_entity" CHECK (("contractId" IS NOT NULL AND "projectId" IS NULL AND "entityType" = 'CONTRACT') OR ("contractId" IS NULL AND "projectId" IS NOT NULL AND "entityType" = 'PROJECT'))
);

CREATE UNIQUE INDEX "Project_contractId_key" ON "Project"("contractId");
CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_documentNumber_idx" ON "Client"("documentNumber");
CREATE INDEX "Contract_clientId_status_idx" ON "Contract"("clientId", "status");
CREATE INDEX "Contract_status_expectedEndDate_idx" ON "Contract"("status", "expectedEndDate");
CREATE INDEX "Project_clientId_status_idx" ON "Project"("clientId", "status");
CREATE INDEX "Project_managerMemberId_status_idx" ON "Project"("managerMemberId", "status");
CREATE INDEX "ResourceLink_contractId_idx" ON "ResourceLink"("contractId");
CREATE INDEX "ResourceLink_projectId_idx" ON "ResourceLink"("projectId");

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerMemberId_fkey" FOREIGN KEY ("managerMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResourceLink" ADD CONSTRAINT "ResourceLink_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceLink" ADD CONSTRAINT "ResourceLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceLink" ADD CONSTRAINT "ResourceLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
