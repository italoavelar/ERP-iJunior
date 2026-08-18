CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "PaymentPlanStatus" AS ENUM ('DRAFT', 'ACTIVE');
CREATE TYPE "FinancialTransactionType" AS ENUM ('RECEIPT', 'REVERSAL');
CREATE TYPE "CurrencyCode" AS ENUM ('BRL');

CREATE TABLE "PaymentPlan" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "contractId" VARCHAR(128) NOT NULL,
  "clientId" VARCHAR(128) NOT NULL,
  "currency" "CurrencyCode" NOT NULL DEFAULT 'BRL',
  "totalCents" BIGINT NOT NULL,
  "status" "PaymentPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "discardedAt" TIMESTAMPTZ(6),
  "discardedById" VARCHAR(128),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Installment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "paymentPlanId" UUID NOT NULL,
  "installmentNumber" INTEGER NOT NULL,
  "originalCents" BIGINT NOT NULL,
  "dueDate" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinancialTransaction" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "paymentPlanId" UUID NOT NULL,
  "type" "FinancialTransactionType" NOT NULL,
  "amountCents" BIGINT NOT NULL,
  "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorUserId" VARCHAR(128) NOT NULL,
  "reason" TEXT,
  "originalReceiptId" UUID,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionAllocation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transactionId" UUID NOT NULL,
  "installmentId" UUID NOT NULL,
  "amountCents" BIGINT NOT NULL,
  "originalAllocationId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionAllocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(128) NOT NULL,
  "commandType" VARCHAR(96) NOT NULL,
  "actorUserId" VARCHAR(128) NOT NULL,
  "semanticParameters" JSONB NOT NULL,
  "requestFingerprint" CHAR(64) NOT NULL,
  "resultType" VARCHAR(64) NOT NULL,
  "resultId" VARCHAR(128) NOT NULL,
  "resultPayload" JSONB NOT NULL,
  "completedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "domain" VARCHAR(64) NOT NULL,
  "action" VARCHAR(96) NOT NULL,
  "aggregateType" VARCHAR(64) NOT NULL,
  "aggregateId" VARCHAR(128) NOT NULL,
  "contractId" VARCHAR(128),
  "paymentPlanId" UUID,
  "transactionId" UUID,
  "actorUserId" VARCHAR(128) NOT NULL,
  "reason" TEXT,
  "context" JSONB NOT NULL,
  "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Installment_paymentPlanId_installmentNumber_key" ON "Installment" ("paymentPlanId", "installmentNumber");
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord" ("key");
CREATE INDEX "PaymentPlan_contractId_discardedAt_idx" ON "PaymentPlan" ("contractId", "discardedAt");
CREATE INDEX "PaymentPlan_clientId_idx" ON "PaymentPlan" ("clientId");
CREATE INDEX "Installment_paymentPlanId_dueDate_idx" ON "Installment" ("paymentPlanId", "dueDate");
CREATE INDEX "FinancialTransaction_paymentPlanId_occurredAt_idx" ON "FinancialTransaction" ("paymentPlanId", "occurredAt");
CREATE INDEX "FinancialTransaction_originalReceiptId_idx" ON "FinancialTransaction" ("originalReceiptId");
CREATE INDEX "TransactionAllocation_transactionId_idx" ON "TransactionAllocation" ("transactionId");
CREATE INDEX "TransactionAllocation_installmentId_idx" ON "TransactionAllocation" ("installmentId");
CREATE INDEX "TransactionAllocation_originalAllocationId_idx" ON "TransactionAllocation" ("originalAllocationId");
CREATE INDEX "IdempotencyRecord_actorUserId_commandType_idx" ON "IdempotencyRecord" ("actorUserId", "commandType");
CREATE INDEX "AuditEvent_contractId_occurredAt_idx" ON "AuditEvent" ("contractId", "occurredAt");
CREATE INDEX "AuditEvent_paymentPlanId_occurredAt_idx" ON "AuditEvent" ("paymentPlanId", "occurredAt");
CREATE INDEX "AuditEvent_transactionId_idx" ON "AuditEvent" ("transactionId");

ALTER TABLE "Installment" ADD CONSTRAINT "Installment_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_originalReceiptId_fkey" FOREIGN KEY ("originalReceiptId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "FinancialTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_originalAllocationId_fkey" FOREIGN KEY ("originalAllocationId") REFERENCES "TransactionAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
