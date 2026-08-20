import { Prisma, PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const capabilities = [
  "FINANCE_READ", "FINANCIAL_AUDIT_READ", "PAYMENT_PLAN_CREATE", "PAYMENT_PLAN_EDIT_DRAFT", "PAYMENT_PLAN_ACTIVATE",
  "INSTALLMENT_CREATE", "INSTALLMENT_EDIT_DRAFT", "INSTALLMENT_REMOVE", "INSTALLMENT_REORDER", "RECEIVABLE_REGISTER_PAYMENT",
  "CLIENT_READ", "CLIENT_CREATE", "CLIENT_EDIT", "CONTRACT_READ", "CONTRACT_CREATE_MANUAL", "CONTRACT_EDIT",
  "PROJECT_READ", "PROJECT_CREATE", "PROJECT_EDIT", "RESOURCE_LINK_READ", "RESOURCE_LINK_CREATE", "RESOURCE_LINK_EDIT",
  "RESOURCE_LINK_DELETE", "DASHBOARD_READ"
] as const;

function required(name: "STAGING_MANAGER_EMAIL" | "STAGING_MANAGER_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for db:seed:staging`);
  return value;
}

async function createBootstrapUser(): Promise<"created" | "exists"> {
  const email = required("STAGING_MANAGER_EMAIL").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return "exists";

  const passwordHash = await argon2.hash(required("STAGING_MANAGER_PASSWORD"), { type: argon2.argon2id });
  try {
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { name: process.env.STAGING_MANAGER_NAME?.trim() || "Usuário de Homologação", email, status: "ACTIVE" }
      });
      await transaction.member.create({ data: { userId: user.id } });
      await transaction.credential.create({ data: { userId: user.id, passwordHash, algorithm: "argon2id" } });
      await transaction.platformPrivilege.createMany({
        data: capabilities.map((capabilityCode) => ({ userId: user.id, capabilityCode, domain: "finance", scope: "global" }))
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return "created";
  } catch (error) {
    // A simultaneous execution may have created the same account. Treat it as
    // an idempotent success and do not alter the existing account.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "exists";
    throw error;
  }
}

try {
  const result = await createBootstrapUser();
  console.log(result === "created" ? "Homologation bootstrap user created." : "Homologation bootstrap user already exists; no changes made.");
} finally {
  await prisma.$disconnect();
}
