import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for db:seed:dev`);
  return value;
};

const managerCapabilities = ["FINANCE_READ", "FINANCIAL_AUDIT_READ", "PAYMENT_PLAN_CREATE", "PAYMENT_PLAN_EDIT_DRAFT", "PAYMENT_PLAN_ACTIVATE", "INSTALLMENT_CREATE", "INSTALLMENT_EDIT_DRAFT", "INSTALLMENT_REMOVE", "INSTALLMENT_REORDER", "RECEIVABLE_REGISTER_PAYMENT"];
const viceCapabilities = [...managerCapabilities, "PAYMENT_PLAN_RETURN_TO_DRAFT", "PAYMENT_PLAN_DISCARD", "RECEIVABLE_REVERSE_PAYMENT"];

async function ensureUser(name: string, email: string, password: string, capabilities: readonly string[], domain = "finance"): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const userRows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "User" ("name", "email", "status") VALUES (${name}, ${normalized}, 'ACTIVE')
    ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name", "status" = 'ACTIVE', "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "id"
  `;
  const id = userRows[0]?.id;
  if (!id) throw new Error("DEV_SEED_USER_FAILED");
  await prisma.$executeRaw`INSERT INTO "Member" ("userId") VALUES (${id}::uuid) ON CONFLICT ("userId") DO NOTHING`;
  await prisma.$executeRaw`
    INSERT INTO "Credential" ("userId", "passwordHash", "algorithm", "revokedAt") VALUES (${id}::uuid, ${passwordHash}, 'argon2id', NULL)
    ON CONFLICT ("userId") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "algorithm" = 'argon2id', "revokedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP
  `;
  for (const capabilityCode of capabilities) {
    await prisma.$executeRaw`
      INSERT INTO "PlatformPrivilege" ("userId", "capabilityCode", "domain", "scope") VALUES (${id}::uuid, ${capabilityCode}, ${domain}, 'global')
      ON CONFLICT ("userId", "capabilityCode", "domain", "scope") DO UPDATE SET "revokedAt" = NULL, "expiresAt" = NULL
    `;
  }
  return id;
}

try {
  await ensureUser("Gerente Financeiro", required("DEV_MANAGER_EMAIL"), required("DEV_MANAGER_PASSWORD"), managerCapabilities);
  await ensureUser("Vice-Presidente", required("DEV_VP_EMAIL"), required("DEV_VP_PASSWORD"), viceCapabilities);
  await ensureUser("Usuário sem Financeiro", required("DEV_NO_FINANCE_EMAIL"), required("DEV_NO_FINANCE_PASSWORD"), []);
  await ensureUser("Platform Admin", required("DEV_PLATFORM_ADMIN_EMAIL"), required("DEV_PLATFORM_ADMIN_PASSWORD"), ["PLATFORM_ADMIN"], "platform");
  const contractId = process.env.DEV_CONTRACT_ID ?? "dev-contract-001";
  const clientId = process.env.DEV_CLIENT_ID ?? "dev-client-001";
  const financialCents = BigInt(process.env.DEV_CONTRACT_CENTS ?? "100000");
  await prisma.$executeRaw`
    INSERT INTO "DevContractReference" ("contractId", "clientId", "currency", "financialCents", "eligible")
    VALUES (${contractId}, ${clientId}, 'BRL', ${financialCents}, true)
    ON CONFLICT ("contractId") DO UPDATE SET "clientId" = EXCLUDED."clientId", "financialCents" = EXCLUDED."financialCents", "eligible" = true, "updatedAt" = CURRENT_TIMESTAMP
  `;
  console.log(`Development seed ready: ${contractId}`);
} finally {
  await prisma.$disconnect();
}
