import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for db:seed:dev`);
  return value;
};

const managerCapabilities = ["FINANCE_READ", "FINANCIAL_AUDIT_READ", "PAYMENT_PLAN_CREATE", "PAYMENT_PLAN_EDIT_DRAFT", "PAYMENT_PLAN_ACTIVATE", "INSTALLMENT_CREATE", "INSTALLMENT_EDIT_DRAFT", "INSTALLMENT_REMOVE", "INSTALLMENT_REORDER", "RECEIVABLE_REGISTER_PAYMENT", "CLIENT_READ", "CLIENT_CREATE", "CLIENT_EDIT", "CONTRACT_READ", "CONTRACT_CREATE_MANUAL", "CONTRACT_EDIT", "PROJECT_READ", "PROJECT_CREATE", "PROJECT_EDIT", "RESOURCE_LINK_READ", "RESOURCE_LINK_CREATE", "RESOURCE_LINK_EDIT", "RESOURCE_LINK_DELETE", "DASHBOARD_READ"];
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
  const clientId = "00000000-0000-4000-8000-000000000001";
  const contractId = "00000000-0000-4000-8000-000000000002";
  const financialCents = BigInt(process.env.DEV_CONTRACT_CENTS ?? "100000");
  const manager = await prisma.user.findUniqueOrThrow({ where: { email: required("DEV_MANAGER_EMAIL").trim().toLowerCase() } });
  await prisma.$executeRaw`
    INSERT INTO "Client" ("id", "name", "type", "email") VALUES (${clientId}::uuid, 'Cliente de demonstração', 'COMPANY', 'financeiro@example.com')
    ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = CURRENT_TIMESTAMP
  `;
  await prisma.$executeRaw`
    INSERT INTO "Contract" ("id", "name", "clientId", "origin", "status", "product", "contractValueCents", "createdByUserId")
    VALUES (${contractId}::uuid, 'Contrato de demonstração', ${clientId}::uuid, 'MANUAL_INTAKE', 'ACTIVE', 'START', ${financialCents}, ${manager.id}::uuid)
    ON CONFLICT ("id") DO UPDATE SET "contractValueCents" = EXCLUDED."contractValueCents", "status" = 'ACTIVE', "updatedAt" = CURRENT_TIMESTAMP
  `;
  const member = await prisma.member.findUniqueOrThrow({ where: { userId: manager.id } });
  const fixtures = [
    { clientId: "00000000-0000-4000-8000-000000000010", contractId: "00000000-0000-4000-8000-000000000011", client: "Aurora Labs (demo)", contract: "Aurora Labs · Plataforma", product: "LOOP" as const, cents: 120000n, plan: "PARTIAL" as const, projectId: "00000000-0000-4000-8000-000000000110", project: "Aurora Labs · Implementação", projectStatus: "IN_PROGRESS" as const },
    { clientId: "00000000-0000-4000-8000-000000000020", contractId: "00000000-0000-4000-8000-000000000021", client: "Brisa Digital (demo)", contract: "Brisa Digital · Website", product: "START" as const, cents: 50000n, plan: "SETTLED" as const, projectId: "00000000-0000-4000-8000-000000000120", project: "Brisa Digital · Entrega", projectStatus: "COMPLETED" as const },
    { clientId: "00000000-0000-4000-8000-000000000030", contractId: "00000000-0000-4000-8000-000000000031", client: "Cacto Sistemas (demo)", contract: "Cacto Sistemas · Integração", product: "NEXT" as const, cents: 80000n, plan: "OVERDUE" as const, projectId: "00000000-0000-4000-8000-000000000130", project: "Cacto Sistemas · Integração", projectStatus: "DELAYED" as const },
    { clientId: "00000000-0000-4000-8000-000000000040", contractId: "00000000-0000-4000-8000-000000000041", client: "Delta Operações (demo)", contract: "Delta Operações · Diagnóstico", product: "OTHER" as const, cents: 30000n, plan: "NONE" as const, projectId: null, project: null, projectStatus: null },
    { clientId: "00000000-0000-4000-8000-000000000050", contractId: "00000000-0000-4000-8000-000000000051", client: "Estação Criativa (demo)", contract: "Estação Criativa · Produto", product: "START" as const, cents: 90000n, plan: "DRAFT" as const, projectId: null, project: null, projectStatus: null }
  ];
  const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
  const planDefinitions = {
    PARTIAL: { total: 120000n, installments: [{ cents: 40000n, due: "2026-08-10" }, { cents: 40000n, due: "2026-09-10" }, { cents: 40000n, due: "2026-10-10" }], receipt: { cents: 40000n, installment: 0 } },
    SETTLED: { total: 50000n, installments: [{ cents: 50000n, due: "2026-07-20" }], receipt: { cents: 50000n, installment: 0 } },
    OVERDUE: { total: 80000n, installments: [{ cents: 40000n, due: "2026-07-15" }, { cents: 40000n, due: "2026-08-15" }] },
    DRAFT: { total: 90000n, installments: [] }
  } as const;
  for (const fixture of fixtures) {
    await prisma.client.upsert({ where: { id: fixture.clientId }, update: { name: fixture.client }, create: { id: fixture.clientId, name: fixture.client, type: "COMPANY", email: `financeiro+${fixture.clientId.slice(-2)}@example.test` } });
    await prisma.contract.upsert({ where: { id: fixture.contractId }, update: { name: fixture.contract, status: "ACTIVE", contractValueCents: fixture.cents }, create: { id: fixture.contractId, name: fixture.contract, clientId: fixture.clientId, origin: "MANUAL_INTAKE", status: "ACTIVE", product: fixture.product, customProductName: fixture.product === "OTHER" ? "Produto personalizado" : null, contractValueCents: fixture.cents, signatureDate: date("2026-07-01"), startDate: date("2026-07-15"), expectedEndDate: date("2026-12-15"), executionTermMonths: 5, description: "Registro sanitizado para visualização do produto.", internalNotes: "Seed de desenvolvimento.", createdByUserId: manager.id } });
    if (fixture.projectId && fixture.project && fixture.projectStatus) await prisma.project.upsert({ where: { id: fixture.projectId }, update: { name: fixture.project, status: fixture.projectStatus }, create: { id: fixture.projectId, name: fixture.project, clientId: fixture.clientId, contractId: fixture.contractId, status: fixture.projectStatus, managerMemberId: member.id, startDate: date("2026-07-15"), expectedEndDate: date("2026-11-30"), description: "Projeto sanitizado para validar a visão operacional." } });
    const definition = fixture.plan === "NONE" ? null : planDefinitions[fixture.plan];
    if (definition && !(await prisma.paymentPlan.findFirst({ where: { contractId: fixture.contractId, discardedAt: null } }))) {
      const plan = await prisma.paymentPlan.create({ data: { contractId: fixture.contractId, clientId: fixture.clientId, currency: "BRL", totalCents: definition.total, status: fixture.plan === "DRAFT" ? "DRAFT" : "ACTIVE" } });
      const installments = []; for (let index = 0; index < definition.installments.length; index += 1) { const item = definition.installments[index]!; installments.push(await prisma.installment.create({ data: { paymentPlanId: plan.id, installmentNumber: index + 1, originalCents: item.cents, dueDate: date(item.due) } })); }
      if ("receipt" in definition && definition.receipt && installments[definition.receipt.installment]) await prisma.financialTransaction.create({ data: { paymentPlanId: plan.id, type: "RECEIPT", amountCents: definition.receipt.cents, actorUserId: manager.id, allocations: { create: { installmentId: installments[definition.receipt.installment]!.id, amountCents: definition.receipt.cents } } } });
    }
    if (!(await prisma.resourceLink.findFirst({ where: { contractId: fixture.contractId, type: "CONTRACT" } }))) await prisma.resourceLink.create({ data: { entityType: "CONTRACT", contractId: fixture.contractId, type: "CONTRACT", label: "Contrato assinado (demo)", url: "https://example.test/contracts/signed", description: "Link fictício seguro para desenvolvimento.", createdByUserId: manager.id } });
  }
  console.log(`Development seed ready: ${contractId}`);
} finally {
  await prisma.$disconnect();
}
