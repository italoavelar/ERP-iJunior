import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../../../app.js";
import { ActivatePaymentPlan } from "../application/ActivatePaymentPlan.js";
import { ChangeDraftPlanTotal } from "../application/ChangeDraftPlanTotal.js";
import { CreateInstallment } from "../application/CreateInstallment.js";
import { CreatePaymentPlan } from "../application/CreatePaymentPlan.js";
import { DiscardPaymentPlan } from "../application/DiscardPaymentPlan.js";
import { EditDraftInstallment } from "../application/EditDraftInstallment.js";
import { FixtureContractReferencePort, ReceivablesContractContext } from "../application/ContractReferencePort.js";
import { FinanceCommandExecutor } from "../application/FinanceCommandExecutor.js";
import { AuthenticatedCommandContext, InMemoryAuthorizationPort, gerenteFinanceiroCapabilities, vicePresidenteCapabilities } from "../application/FinanceCapability.js";
import { GetContractReceivables } from "../application/GetContractReceivables.js";
import { GetFinancialAudit } from "../application/GetFinancialAudit.js";
import { RegisterReceipt } from "../application/RegisterReceipt.js";
import { RemoveDraftInstallment } from "../application/RemoveDraftInstallment.js";
import { ReorderInstallments } from "../application/ReorderInstallments.js";
import { ReturnPlanToDraft } from "../application/ReturnPlanToDraft.js";
import { ReverseReceipt } from "../application/ReverseReceipt.js";
import { LocalDate } from "../domain/LocalDate.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { PrismaFinanceUnitOfWork } from "../infrastructure/PrismaFinanceUnitOfWork.js";
import { PrismaIdempotencyStore } from "../infrastructure/PrismaIdempotencyStore.js";
import { PrismaPaymentPlanLookup } from "../infrastructure/PrismaPaymentPlanLookup.js";
import { PrismaTransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error("DATABASE_URL_TEST required");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const contracts = new Map<string, ReceivablesContractContext>();
const authorization = new InMemoryAuthorizationPort(new Map([
  ["manager", gerenteFinanceiroCapabilities],
  ["vp", vicePresidenteCapabilities],
  ["no-finance", new Set()]
]));
const manager: AuthenticatedCommandContext = { actorUserId: "manager", capabilities: gerenteFinanceiroCapabilities };
const vp: AuthenticatedCommandContext = { actorUserId: "vp", capabilities: vicePresidenteCapabilities };
const noFinance: AuthenticatedCommandContext = { actorUserId: "no-finance", capabilities: new Set() };
const unit = new PrismaFinanceUnitOfWork(prisma);
const executor = new FinanceCommandExecutor(authorization, unit, new PrismaIdempotencyStore(prisma));
const audit = new PrismaTransactionalAuditWriter();
const contractPort = new FixtureContractReferencePort(contracts);
const dependencies = {
  authenticate: async (request: Request) => ({ manager, vp, "no-finance": noFinance }[request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""]),
  createPlan: new CreatePaymentPlan(contractPort, authorization, executor, audit),
  changeTotal: new ChangeDraftPlanTotal(authorization, executor, audit),
  createInstallment: new CreateInstallment(authorization, executor, audit),
  editInstallment: new EditDraftInstallment(authorization, executor, audit),
  removeInstallment: new RemoveDraftInstallment(authorization, executor, audit),
  reorderInstallments: new ReorderInstallments(authorization, executor, audit),
  activatePlan: new ActivatePaymentPlan(authorization, executor, contractPort, new PrismaPaymentPlanLookup(prisma), audit),
  returnPlanToDraft: new ReturnPlanToDraft(authorization, executor, audit),
  discardPlan: new DiscardPaymentPlan(authorization, executor, audit),
  registerReceipt: new RegisterReceipt(authorization, executor, audit),
  reverseReceipt: new ReverseReceipt(authorization, executor, audit),
  getReceivables: new GetContractReceivables(prisma, authorization, contractPort, { todayIn: () => LocalDate.parse("2026-08-18") }),
  getAudit: new GetFinancialAudit(prisma, authorization)
};
const app = createApp(dependencies);
const key = () => `acceptance-${crypto.randomUUID()}`;
const headers = (actor: string, idempotency?: string) => ({ Authorization: `Bearer ${actor}`, "Content-Type": "application/json", ...(idempotency ? { "Idempotency-Key": idempotency } : {}) });
const send = (method: string, path: string, actor: string, body?: unknown, idempotency?: string) => app.request(path, { method, headers: headers(actor, idempotency), ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
function addContract(value = "1000.00") {
  const contractId = `acceptance-${crypto.randomUUID()}`;
  contracts.set(contractId, { kind: "available", contractId, clientId: `client-${crypto.randomUUID()}`, currency: "BRL", financialValue: MoneyBRL.parse(value), eligibleForReceivables: true });
  return contractId;
}

afterAll(() => prisma.$disconnect());

describe("finance-contract-receivables cross-layer acceptance", () => {
  it("completes the manager journey through refresh and derived partial balances", async () => {
    const contractId = addContract();
    expect((await send("GET", `/api/finance/contracts/${contractId}/receivables`, "manager")).status).toBe(200);
    const createKey = key();
    const created = await send("POST", `/api/finance/contracts/${contractId}/payment-plans`, "manager", { totalAmount: "1000.00" }, createKey);
    expect(created.status).toBe(200);
    const plan = await created.json() as { id: string };
    expect((await send("POST", `/api/finance/contracts/${contractId}/payment-plans`, "manager", { totalAmount: "1000.00" }, createKey)).status).toBe(200);
    const first = await (await send("POST", `/api/finance/payment-plans/${plan.id}/installments`, "manager", { originalAmount: "400.00", dueDate: "2026-08-18" }, key())).json() as { id: string };
    const second = await (await send("POST", `/api/finance/payment-plans/${plan.id}/installments`, "manager", { originalAmount: "600.00", dueDate: "2026-08-20" }, key())).json() as { id: string };
    expect((await send("PATCH", `/api/finance/payment-plans/${plan.id}/draft-total`, "manager", { totalAmount: "1000.00" }, key())).status).toBe(200);
    expect((await send("PATCH", `/api/finance/payment-plans/${plan.id}/installments/${first.id}`, "manager", { originalAmount: "400.00" }, key())).status).toBe(200);
    expect((await send("POST", `/api/finance/payment-plans/${plan.id}/installments/reorder`, "manager", { installmentIds: [second.id, first.id] }, key())).status).toBe(200);
    expect((await send("POST", `/api/finance/payment-plans/${plan.id}/activate`, "manager", undefined, key())).status).toBe(200);
    const receiptResponse = await send("POST", `/api/finance/payment-plans/${plan.id}/receipts`, "manager", { amount: "700.00", allocations: [{ installmentId: first.id, amount: "400.00" }, { installmentId: second.id, amount: "300.00" }] }, key());
    expect(receiptResponse.status).toBe(200);
    const receipt = await receiptResponse.json() as { id: string };
    const refreshed = await send("GET", `/api/finance/contracts/${contractId}/receivables`, "manager");
    const view = await refreshed.json() as { paymentPlan: { installments: Array<{ originalAmount: string; receivedAmount: string; remainingBalance: string; settlementStatus: string; dueStatus: string }> } };
    expect(view.paymentPlan.installments).toEqual(expect.arrayContaining([
      expect.objectContaining({ originalAmount: "400.00", receivedAmount: "400.00", remainingBalance: "0.00", settlementStatus: "SETTLED", dueStatus: "NOT_DUE" }),
      expect.objectContaining({ originalAmount: "600.00", receivedAmount: "300.00", remainingBalance: "300.00", settlementStatus: "PARTIAL", dueStatus: "NOT_DUE" })
    ]));
    expect((await send("POST", `/api/finance/financial-transactions/${receipt.id}/reversals`, "manager", { amount: "1.00", reason: "spoof", allocations: [] }, key())).status).toBe(403);
  });

  it("completes vice-president reversal, audit and permanent history freeze", async () => {
    const contractId = addContract();
    const plan = await (await send("POST", `/api/finance/contracts/${contractId}/payment-plans`, "manager", { totalAmount: "1000.00" }, key())).json() as { id: string };
    const installment = await (await send("POST", `/api/finance/payment-plans/${plan.id}/installments`, "manager", { originalAmount: "1000.00", dueDate: "2026-08-17" }, key())).json() as { id: string };
    await send("POST", `/api/finance/payment-plans/${plan.id}/activate`, "manager", undefined, key());
    const receipt = await (await send("POST", `/api/finance/payment-plans/${plan.id}/receipts`, "manager", { amount: "1000.00", allocations: [{ installmentId: installment.id, amount: "1000.00" }] }, key())).json() as { id: string; allocations: Array<{ id: string }> };
    expect((await send("POST", `/api/finance/financial-transactions/${receipt.id}/reversals`, "vp", { amount: "1000.00", reason: "full correction", allocations: [{ originalAllocationId: receipt.allocations[0]!.id, amount: "1000.00" }] }, key())).status).toBe(200);
    const view = await (await send("GET", `/api/finance/contracts/${contractId}/receivables`, "manager")).json() as { paymentPlan: { installments: Array<{ receivedAmount: string; remainingBalance: string; settlementStatus: string; dueStatus: string }> } };
    expect(view.paymentPlan.installments[0]).toMatchObject({ receivedAmount: "0.00", remainingBalance: "1000.00", settlementStatus: "PENDING", dueStatus: "OVERDUE" });
    expect((await send("POST", `/api/finance/payment-plans/${plan.id}/return-to-draft`, "vp", { reason: "edit after reversal" }, key())).status).toBe(409);
    expect((await send("PATCH", `/api/finance/payment-plans/${plan.id}/installments/${installment.id}`, "manager", { originalAmount: "900.00" }, key())).status).toBe(409);
    const auditPage = await (await send("GET", `/api/finance/contracts/${contractId}/receivables/audit`, "manager")).json() as { events: Array<{ action: string; reason: string | null }> };
    expect(auditPage.events.some((event) => event.action === "finance.receipt.reversed" && event.reason === "full correction")).toBe(true);
    expect(JSON.stringify(auditPage)).not.toContain("clientId");
  });

  it("denies direct finance access to users without explicit capabilities", async () => {
    const contractId = addContract();
    expect((await send("GET", `/api/finance/contracts/${contractId}/receivables`, "no-finance")).status).toBe(403);
    expect((await send("GET", `/api/finance/contracts/${contractId}/receivables`, "unknown")).status).toBe(401);
  });
});
