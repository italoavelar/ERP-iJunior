CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(160) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Member" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Credential" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "algorithm" VARCHAR(32) NOT NULL DEFAULT 'argon2id',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMPTZ(6),
  CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "revokedAt" TIMESTAMPTZ(6),
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformPrivilege" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "capabilityCode" VARCHAR(96) NOT NULL,
  "domain" VARCHAR(64) NOT NULL,
  "scope" VARCHAR(96) NOT NULL DEFAULT 'global',
  "grantedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(6),
  "revokedAt" TIMESTAMPTZ(6),
  "reason" TEXT,
  CONSTRAINT "PlatformPrivilege_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevContractReference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "contractId" VARCHAR(128) NOT NULL,
  "clientId" VARCHAR(128) NOT NULL,
  "currency" "CurrencyCode" NOT NULL DEFAULT 'BRL',
  "financialCents" BIGINT NOT NULL,
  "eligible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DevContractReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
CREATE UNIQUE INDEX "Member_userId_key" ON "Member" ("userId");
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential" ("userId");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session" ("tokenHash");
CREATE UNIQUE INDEX "PlatformPrivilege_userId_capabilityCode_domain_scope_key" ON "PlatformPrivilege" ("userId", "capabilityCode", "domain", "scope");
CREATE UNIQUE INDEX "DevContractReference_contractId_key" ON "DevContractReference" ("contractId");
CREATE INDEX "User_status_idx" ON "User" ("status");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session" ("userId", "expiresAt");
CREATE INDEX "Session_expiresAt_idx" ON "Session" ("expiresAt");
CREATE INDEX "PlatformPrivilege_userId_domain_capabilityCode_idx" ON "PlatformPrivilege" ("userId", "domain", "capabilityCode");
CREATE INDEX "PlatformPrivilege_expiresAt_revokedAt_idx" ON "PlatformPrivilege" ("expiresAt", "revokedAt");
CREATE INDEX "DevContractReference_clientId_idx" ON "DevContractReference" ("clientId");

ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformPrivilege" ADD CONSTRAINT "PlatformPrivilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
