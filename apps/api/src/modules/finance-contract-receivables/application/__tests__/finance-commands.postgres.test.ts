import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ActivatePaymentPlan } from "../ActivatePaymentPlan.js";
import { ChangeDraftPlanTotal } from "../ChangeDraftPlanTotal.js";
import { CreateInstallment } from "../CreateInstallment.js";
import { CreatePaymentPlan } from "../CreatePaymentPlan.js";
import { DiscardPaymentPlan } from "../DiscardPaymentPlan.js";
import { EditDraftInstallment } from "../EditDraftInstallment.js";
import { FixtureContractReferencePort, ReceivablesContractContext } from "../ContractReferencePort.js";
import { FinanceCommandExecutor } from "../FinanceCommandExecutor.js";
import { AuthenticatedCommandContext, InMemoryAuthorizationPort, gerenteFinanceiroCapabilities, vicePresidenteCapabilities } from "../FinanceCapability.js";
import { GetContractReceivables } from "../GetContractReceivables.js";
import { GetFinancialAudit } from "../GetFinancialAudit.js";
import { RegisterReceipt } from "../RegisterReceipt.js";
import { RemoveDraftInstallment } from "../RemoveDraftInstallment.js";
import { ReorderInstallments } from "../ReorderInstallments.js";
import { ReturnPlanToDraft } from "../ReturnPlanToDraft.js";
import { ReverseReceipt } from "../ReverseReceipt.js";
import { MoneyBRL } from "../../domain/MoneyBRL.js";
import { LocalDate } from "../../domain/LocalDate.js";
import { PrismaFinanceUnitOfWork } from "../../infrastructure/PrismaFinanceUnitOfWork.js";
import { PrismaIdempotencyStore } from "../../infrastructure/PrismaIdempotencyStore.js";
import { PrismaPaymentPlanLookup } from "../../infrastructure/PrismaPaymentPlanLookup.js";
import { PrismaTransactionalAuditWriter, TransactionalAuditWriter } from "../../infrastructure/PrismaTransactionalAuditWriter.js";

const databaseUrl = process.env.DATABASE_URL_TEST; if (!databaseUrl) throw new Error("DATABASE_URL_TEST required");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const secondPrisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const contracts = new Map<string, ReceivablesContractContext>();
const contractPort = new FixtureContractReferencePort(contracts);
const authorization = new InMemoryAuthorizationPort(new Map([["manager", gerenteFinanceiroCapabilities], ["vp", vicePresidenteCapabilities]]));
const manager: AuthenticatedCommandContext = { actorUserId: "manager", capabilities: gerenteFinanceiroCapabilities };
const vp: AuthenticatedCommandContext = { actorUserId: "vp", capabilities: vicePresidenteCapabilities };
const outsider: AuthenticatedCommandContext = { actorUserId: "outsider", capabilities: new Set() };
const unit = new PrismaFinanceUnitOfWork(prisma); const store = new PrismaIdempotencyStore(prisma); const executor = new FinanceCommandExecutor(authorization, unit, store); const audit = new PrismaTransactionalAuditWriter();
const createPlan = new CreatePaymentPlan(contractPort, authorization, executor, audit);
const createInstallment = new CreateInstallment(authorization, executor, audit);
const activate = new ActivatePaymentPlan(authorization, executor, contractPort, new PrismaPaymentPlanLookup(prisma), audit);
const receipts = new RegisterReceipt(authorization, executor, audit); const reversals = new ReverseReceipt(authorization, executor, audit);
const secondExecutor = new FinanceCommandExecutor(authorization, new PrismaFinanceUnitOfWork(secondPrisma), new PrismaIdempotencyStore(secondPrisma));
const secondReceipts = new RegisterReceipt(authorization, secondExecutor, audit); const secondReversals = new ReverseReceipt(authorization, secondExecutor, audit);
const key = () => `key-${crypto.randomUUID()}`; const id = () => crypto.randomUUID();
function addContract(value = "1000.00") { const contractId = `contract-${id()}`; contracts.set(contractId, { kind: "available", contractId, clientId: `client-${id()}`, currency: "BRL", financialValue: MoneyBRL.parse(value), eligibleForReceivables: true }); return contractId; }
async function activePlan(value = "1000.00") { const contractId = addContract(value); const plan = await createPlan.execute({ actor: manager, idempotencyKey: key(), contractId, totalAmount: value }); const installment = await createInstallment.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, originalAmount: value, dueDate: "2026-08-01" }) as { id: string }; await activate.execute({ actor: manager, idempotencyKey: key(), planId: plan.id }); return { contractId, planId: plan.id, installmentId: installment.id }; }
afterAll(async () => { await secondPrisma.$disconnect(); await prisma.$disconnect(); });

describe("finance command use cases", () => {
  it("creates atomically, replays, conflicts and maps the live-plan race", async () => {
    const contractId = addContract(); const idem = key(); const command = { actor: manager, idempotencyKey: idem, contractId, totalAmount: "1000.00" };
    const first = await createPlan.execute(command); expect(await createPlan.execute(command)).toEqual(first); expect(await prisma.paymentPlan.count({ where: { contractId } })).toBe(1); expect(await prisma.auditEvent.count({ where: { paymentPlanId: first.id } })).toBe(1);
    await expect(createPlan.execute({ ...command, totalAmount: "999.00" })).rejects.toThrow();
    const raced = addContract(); const results = await Promise.allSettled([createPlan.execute({ actor: manager, idempotencyKey: key(), contractId: raced, totalAmount: "1000.00" }), createPlan.execute({ actor: manager, idempotencyKey: key(), contractId: raced, totalAmount: "1000.00" })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1); const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult; expect(rejected.reason).toMatchObject({ code: "PAYMENT_PLAN_ALREADY_EXISTS" });
    const unavailable = `contract-${id()}`; await expect(createPlan.execute({ actor: manager, idempotencyKey: key(), contractId: unavailable, totalAmount: "1000.00" })).rejects.toMatchObject({ code: "CONTRACT_INELIGIBLE" });
    const mismatch = addContract(); await expect(createPlan.execute({ actor: manager, idempotencyKey: key(), contractId: mismatch, totalAmount: "999.00" })).rejects.toMatchObject({ code: "CONTRACT_VALUE_MISMATCH" });
    await expect(createPlan.execute({ actor: outsider, idempotencyKey: key(), contractId: mismatch, totalAmount: "1000.00" })).rejects.toThrow("CAPABILITY_MISSING");
    expect(await prisma.paymentPlan.count({ where: { contractId: { in: [unavailable, mismatch] } } })).toBe(0);
  });
  it("rolls back plan and idempotency when audit writing fails", async () => {
    const contractId = addContract(); const failedKey = key(); const failing: TransactionalAuditWriter = { append: async () => { throw new Error("audit unavailable"); } };
    await expect(new CreatePaymentPlan(contractPort, authorization, executor, failing).execute({ actor: manager, idempotencyKey: failedKey, contractId, totalAmount: "1000.00" })).rejects.toThrow("audit unavailable");
    expect(await prisma.paymentPlan.count({ where: { contractId } })).toBe(0); expect(await prisma.idempotencyRecord.findUnique({ where: { key: failedKey } })).toBeNull();
  });
  it("supports draft lifecycle, stable installments, explicit reorder, activation, return and discard", async () => {
    const contractId = addContract(); const plan = await createPlan.execute({ actor: manager, idempotencyKey: key(), contractId, totalAmount: "1000.00" });
    const change = new ChangeDraftPlanTotal(authorization, executor, audit); await change.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, totalAmount: "1000.00" });
    const first = await createInstallment.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, originalAmount: "400.00", dueDate: "2026-09-10" }) as { id: string };
    const second = await createInstallment.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, originalAmount: "600.00", dueDate: "2026-09-10" }) as { id: string };
    await new EditDraftInstallment(authorization, executor, audit).execute({ actor: manager, idempotencyKey: key(), planId: plan.id, installmentId: first.id, originalAmount: "450.00" });
    await new EditDraftInstallment(authorization, executor, audit).execute({ actor: manager, idempotencyKey: key(), planId: plan.id, installmentId: second.id, originalAmount: "550.00" });
    await new ReorderInstallments(authorization, executor, audit).execute({ actor: manager, idempotencyKey: key(), planId: plan.id, installmentIds: [second.id, first.id] });
    await activate.execute({ actor: manager, idempotencyKey: key(), planId: plan.id });
    await expect(new ReturnPlanToDraft(authorization, executor, audit).execute({ actor: manager, idempotencyKey: key(), planId: plan.id, reason: "correction" })).rejects.toThrow();
    await new ReturnPlanToDraft(authorization, executor, audit).execute({ actor: vp, idempotencyKey: key(), planId: plan.id, reason: "correction" });
    await new RemoveDraftInstallment(authorization, executor, audit).execute({ actor: manager, idempotencyKey: key(), planId: plan.id, installmentId: first.id });
    await new DiscardPaymentPlan(authorization, executor, audit).execute({ actor: vp, idempotencyKey: key(), planId: plan.id, reason: "replace draft" });
    expect(await prisma.paymentPlan.findUnique({ where: { id: plan.id } })).toMatchObject({ discardedById: "vp" });
    const replacement = await createPlan.execute({ actor: manager, idempotencyKey: key(), contractId, totalAmount: "1000.00" }); expect(replacement.id).not.toBe(plan.id);
    expect((await new GetContractReceivables(prisma, authorization, contractPort, { todayIn: () => LocalDate.parse("2026-08-18") }).execute("manager", contractId)).paymentPlan!.id).toBe(replacement.id);
    expect((await new GetFinancialAudit(prisma, authorization).execute("manager", contractId)).events.some((event) => event.action === "finance.payment-plan.discarded")).toBe(true);
  });
  it("allocates one receipt across installments and supports multiple partial reversals through total reversal", async () => {
    const contractId = addContract(); const plan = await createPlan.execute({ actor: manager, idempotencyKey: key(), contractId, totalAmount: "1000.00" });
    const first = await createInstallment.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, originalAmount: "400.00", dueDate: "2026-09-10" }) as { id: string }; const second = await createInstallment.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, originalAmount: "600.00", dueDate: "2026-10-10" }) as { id: string }; await activate.execute({ actor: manager, idempotencyKey: key(), planId: plan.id });
    const receipt = await receipts.execute({ actor: manager, idempotencyKey: key(), planId: plan.id, amount: "1000.00", allocations: [{ installmentId: first.id, amount: "400.00" }, { installmentId: second.id, amount: "600.00" }] }) as { id: string; allocations: { id: string; installmentId: string }[] };
    const firstAllocation = receipt.allocations.find((item) => item.installmentId === first.id)!;
    await reversals.execute({ actor: vp, idempotencyKey: key(), receiptId: receipt.id, amount: "100.00", reason: "partial one", allocations: [{ originalAllocationId: firstAllocation.id, amount: "100.00" }] });
    await reversals.execute({ actor: vp, idempotencyKey: key(), receiptId: receipt.id, amount: "100.00", reason: "partial two", allocations: [{ originalAllocationId: firstAllocation.id, amount: "100.00" }] });
    await reversals.execute({ actor: vp, idempotencyKey: key(), receiptId: receipt.id, amount: "200.00", reason: "total", allocations: [{ originalAllocationId: firstAllocation.id, amount: "200.00" }] });
    await expect(reversals.execute({ actor: vp, idempotencyKey: key(), receiptId: receipt.id, amount: "0.01", reason: "excess", allocations: [{ originalAllocationId: firstAllocation.id, amount: "0.01" }] })).rejects.toMatchObject({ code: "REVERSAL_EXCEEDS_AVAILABLE" });
  });
  it("validates combined same-target allocations and rejects foreign plans atomically", async () => {
    const fixture = await activePlan(); const foreign = await activePlan(); const failedKeys = [key(), key()];
    await expect(receipts.execute({ actor: manager, idempotencyKey: failedKeys[0]!, planId: fixture.planId, amount: "1.00", allocations: [{ installmentId: foreign.installmentId, amount: "1.00" }] })).rejects.toMatchObject({ code: "ALLOCATION_PLAN_MISMATCH" });
    await expect(receipts.execute({ actor: manager, idempotencyKey: failedKeys[1]!, planId: fixture.planId, amount: "1200.00", allocations: [{ installmentId: fixture.installmentId, amount: "600.00" }, { installmentId: fixture.installmentId, amount: "600.00" }] })).rejects.toMatchObject({ code: "ALLOCATION_EXCEEDS_OPEN_BALANCE" });
    expect(await prisma.idempotencyRecord.count({ where: { key: { in: failedKeys } } })).toBe(0);
    const receipt = await receipts.execute({ actor: manager, idempotencyKey: key(), planId: fixture.planId, amount: "1000.00", allocations: [{ installmentId: fixture.installmentId, amount: "400.00" }, { installmentId: fixture.installmentId, amount: "600.00" }] }) as { id: string; allocations: { id: string; amount: string }[] };
    const first = receipt.allocations.find((allocation) => allocation.amount === "400.00")!;
    const reversal = await reversals.execute({ actor: vp, idempotencyKey: key(), receiptId: receipt.id, amount: "400.00", reason: "combined", allocations: [{ originalAllocationId: first.id, amount: "100.00" }, { originalAllocationId: first.id, amount: "300.00" }] }) as { allocations: unknown[] };
    expect(reversal.allocations).toHaveLength(2);
  });
  it("serializes concurrent receipts and leaves no partial failed command", async () => {
    const fixture = await activePlan(); const beforeAudit = await prisma.auditEvent.count({ where: { paymentPlanId: fixture.planId } }); const keys = [key(), key()];
    const attempts = await Promise.allSettled([receipts.execute({ actor: manager, idempotencyKey: keys[0]!, planId: fixture.planId, amount: "700.00", allocations: [{ installmentId: fixture.installmentId, amount: "700.00" }] }), secondReceipts.execute({ actor: manager, idempotencyKey: keys[1]!, planId: fixture.planId, amount: "700.00", allocations: [{ installmentId: fixture.installmentId, amount: "700.00" }] })]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1); const failed = attempts.find((result) => result.status === "rejected") as PromiseRejectedResult; expect(failed.reason).toMatchObject({ code: "ALLOCATION_EXCEEDS_OPEN_BALANCE" });
    expect(await prisma.transactionAllocation.aggregate({ where: { installmentId: fixture.installmentId }, _sum: { amountCents: true } })).toMatchObject({ _sum: { amountCents: 70000n } }); expect(await prisma.auditEvent.count({ where: { paymentPlanId: fixture.planId } })).toBe(beforeAudit + 1); expect(await prisma.idempotencyRecord.count({ where: { key: { in: keys } } })).toBe(1);
  });
  it("serializes concurrent reversals and derives restored overdue balance", async () => {
    const fixture = await activePlan(); const receipt = await receipts.execute({ actor: manager, idempotencyKey: key(), planId: fixture.planId, amount: "1000.00", allocations: [{ installmentId: fixture.installmentId, amount: "1000.00" }] }) as { id: string; allocations: { id: string }[] }; const originalAllocationId = receipt.allocations[0]!.id; const keys = [key(), key()];
    const attempts = await Promise.allSettled([reversals.execute({ actor: vp, idempotencyKey: keys[0]!, receiptId: receipt.id, amount: "700.00", reason: "correction", allocations: [{ originalAllocationId, amount: "700.00" }] }), secondReversals.execute({ actor: vp, idempotencyKey: keys[1]!, receiptId: receipt.id, amount: "700.00", reason: "correction", allocations: [{ originalAllocationId, amount: "700.00" }] })]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1); const failed = attempts.find((result) => result.status === "rejected") as PromiseRejectedResult; expect(failed.reason).toMatchObject({ code: "REVERSAL_EXCEEDS_AVAILABLE" }); expect(await prisma.idempotencyRecord.count({ where: { key: { in: keys } } })).toBe(1);
    const query = new GetContractReceivables(prisma, authorization, contractPort, { todayIn: () => LocalDate.parse("2026-08-18") }); const view = await query.execute("manager", fixture.contractId); expect(view.paymentPlan!.installments[0]).toMatchObject({ receivedAmount: "300.00", remainingBalance: "700.00", settlementStatus: "PARTIAL", dueStatus: "OVERDUE" }); expect(view.paymentPlan!.transactions[0]!.allocations[0]).toMatchObject({ reversibleAmount: "300.00" });
  });
});
