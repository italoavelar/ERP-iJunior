import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaFinanceUnitOfWork } from "../PrismaFinanceUnitOfWork.js";
import { IdempotencyConflictError, PrismaIdempotencyStore } from "../PrismaIdempotencyStore.js";
import { PrismaTransactionalAuditWriter } from "../PrismaTransactionalAuditWriter.js";
import { fingerprintCommand } from "../../application/IdempotencyPolicy.js";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error("DATABASE_URL_TEST is required for PostgreSQL integration tests");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const secondPrisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const unique = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

async function plan(contractId = unique("contract")) {
  return prisma.paymentPlan.create({ data: { contractId, clientId: unique("client"), totalCents: 1000n } });
}

beforeAll(async () => { await prisma.$queryRaw`SELECT 1`; });
afterAll(async () => { await secondPrisma.$disconnect(); await prisma.$disconnect(); });

describe("PostgreSQL finance migrations and guards", () => {
  it("enforces partial live-plan uniqueness and all positive/BRL transaction shape checks", async () => {
    const contractId = unique("contract");
    await plan(contractId);
    await expect(plan(contractId)).rejects.toThrow();
    await expect(prisma.paymentPlan.create({ data: { contractId: unique("bad"), clientId: unique("client"), totalCents: 0n } })).rejects.toThrow();
    const paymentPlan = await plan();
    await expect(prisma.paymentPlan.update({ where: { id: paymentPlan.id }, data: { totalCents: 1100n } })).resolves.toBeDefined();
    await expect(prisma.paymentPlan.update({ where: { id: paymentPlan.id }, data: { clientId: unique("other-client") } })).rejects.toThrow(/immutable/);
    await expect(prisma.financialTransaction.create({ data: { paymentPlanId: paymentPlan.id, type: "REVERSAL", amountCents: 1n, actorUserId: "actor" } })).rejects.toThrow();
  });

  it("defers ledger graph validation until commit and accepts a valid receipt allocation", async () => {
    const first = await plan();
    const second = await plan();
    const secondInstallment = await prisma.installment.create({ data: { paymentPlanId: second.id, installmentNumber: 1, originalCents: 1000n, dueDate: new Date("2026-08-20T00:00:00.000Z") } });
    await expect(prisma.$transaction(async (tx) => {
      const receipt = await tx.financialTransaction.create({ data: { paymentPlanId: first.id, type: "RECEIPT", amountCents: 10n, actorUserId: "actor" } });
      await tx.transactionAllocation.create({ data: { transactionId: receipt.id, installmentId: secondInstallment.id, amountCents: 10n } });
    })).rejects.toThrow(/same payment plan/);
    const installment = await prisma.installment.create({ data: { paymentPlanId: first.id, installmentNumber: 1, originalCents: 1000n, dueDate: new Date("2026-08-20T00:00:00.000Z") } });
    const receipt = await prisma.$transaction(async (tx) => {
      const receipt = await tx.financialTransaction.create({ data: { paymentPlanId: first.id, type: "RECEIPT", amountCents: 10n, actorUserId: "actor" } });
      await tx.transactionAllocation.create({ data: { transactionId: receipt.id, installmentId: installment.id, amountCents: 10n } });
      return receipt;
    });
    await expect(prisma.$transaction(async (tx) => {
      const reversal = await tx.financialTransaction.create({ data: { paymentPlanId: first.id, type: "REVERSAL", amountCents: 10n, actorUserId: "actor", reason: "correction", originalReceiptId: receipt.id } });
      const original = await tx.transactionAllocation.findFirstOrThrow({ where: { transactionId: receipt.id } });
      await tx.transactionAllocation.create({ data: { transactionId: reversal.id, installmentId: installment.id, amountCents: 10n, originalAllocationId: original.id } });
    })).resolves.toBeUndefined();
  });

  it("freezes historical plans and makes ledger and audit records append-only", async () => {
    const paymentPlan = await plan();
    const transaction = await prisma.financialTransaction.create({ data: { paymentPlanId: paymentPlan.id, type: "RECEIPT", amountCents: 100n, actorUserId: "actor" } });
    await expect(prisma.paymentPlan.update({ where: { id: paymentPlan.id }, data: { totalCents: 2000n } })).rejects.toThrow(/structurally frozen/);
    await expect(prisma.financialTransaction.delete({ where: { id: transaction.id } })).rejects.toThrow(/append-only/);
    const audit = await prisma.auditEvent.create({ data: { domain: "finance-contract-receivables", action: "finance.payment-plan.created", aggregateType: "PaymentPlan", aggregateId: paymentPlan.id, actorUserId: "actor", context: {} } });
    await expect(prisma.auditEvent.update({ where: { id: audit.id }, data: { action: "changed" } })).rejects.toThrow(/append-only/);
  });

  it("rolls back domain and audit writes from the same transaction", async () => {
    const writer = new PrismaTransactionalAuditWriter();
    const contractId = unique("rollback");
    await expect(prisma.$transaction(async (tx) => {
      const paymentPlan = await tx.paymentPlan.create({ data: { contractId, clientId: unique("client"), totalCents: 100n } });
      await writer.append(tx, { action: "finance.payment-plan.created", actorUserId: "actor", aggregate: { type: "PaymentPlan", id: paymentPlan.id }, contractId, paymentPlanId: paymentPlan.id, context: { totalCents: "100" } });
      throw new Error("forced audit-path failure");
    })).rejects.toThrow("forced audit-path failure");
    expect(await prisma.paymentPlan.count({ where: { contractId } })).toBe(0);
    expect(await prisma.auditEvent.count({ where: { contractId } })).toBe(0);
  });

  it("blocks a concurrent writer on the exact payment-plan row", async () => {
    const paymentPlan = await plan();
    const first = new PrismaFinanceUnitOfWork(prisma);
    const second = new PrismaFinanceUnitOfWork(secondPrisma);
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    let firstLocked!: () => void;
    const locked = new Promise<void>((resolve) => { firstLocked = resolve; });
    const firstWork = first.execute(async (tx) => { await first.lockPaymentPlan(tx, paymentPlan.id); firstLocked(); await held; });
    await locked;
    let secondAcquired = false;
    const secondWork = second.execute(async (tx) => { await second.lockPaymentPlan(tx, paymentPlan.id); secondAcquired = true; });
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(secondAcquired).toBe(false);
    release();
    await Promise.all([firstWork, secondWork]);
    expect(secondAcquired).toBe(true);
  });

  it("serializes same-key idempotency work and leaves no record after rollback", async () => {
    const key = unique("idempotency-key-123456789");
    const fingerprint = fingerprintCommand("payment-plan.create", { contractId: "canonical-contract" });
    const first = new PrismaFinanceUnitOfWork(prisma);
    const second = new PrismaFinanceUnitOfWork(secondPrisma);
    const store = new PrismaIdempotencyStore(prisma);
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    let locked!: () => void;
    const lockHeld = new Promise<void>((resolve) => { locked = resolve; });
    const writer = first.execute(async (tx) => { await first.acquireIdempotencyLock(tx, key); locked(); await held; await store.complete(tx, { key, commandType: "payment-plan.create", actorUserId: "actor", fingerprint, resultType: "PaymentPlan", resultId: "result", resultPayload: { id: "result" } }); });
    await lockHeld;
    let replayed = false;
    const reader = second.execute(async (tx) => { await second.acquireIdempotencyLock(tx, key); const record = await new PrismaIdempotencyStore(secondPrisma).findCompletedInTransaction(tx, key); if (record) { new PrismaIdempotencyStore(secondPrisma).assertReplayMatches(record, "actor", "payment-plan.create", fingerprint); replayed = true; } });
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(replayed).toBe(false);
    release();
    await Promise.all([writer, reader]);
    expect(replayed).toBe(true);
    const completed = await store.findCompleted(key);
    expect(() => store.assertReplayMatches(completed!, "other-actor", "payment-plan.create", fingerprint)).toThrow(IdempotencyConflictError);
    const failedKey = unique("failed-idempotency-key-123456789");
    await expect(first.execute(async (tx) => { await first.acquireIdempotencyLock(tx, failedKey); await store.complete(tx, { key: failedKey, commandType: "x", actorUserId: "actor", fingerprint, resultType: "x", resultId: "x", resultPayload: {} }); throw new Error("rollback"); })).rejects.toThrow("rollback");
    expect(await store.findCompleted(failedKey)).toBeUndefined();
  });
});
