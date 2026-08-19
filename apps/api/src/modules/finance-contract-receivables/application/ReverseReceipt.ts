import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { canonicalizeAllocations } from "./IdempotencyPolicy.js";
import { lockPlan } from "./financeCommandSupport.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export interface ReversalAllocationInput { readonly originalAllocationId: string; readonly amount: string; }

export class ReverseReceipt {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; receiptId: string; amount: string; reason: string; allocations: readonly ReversalAllocationInput[] }) {
    await this.authorization.require(input.actor.actorUserId, "RECEIVABLE_REVERSE_PAYMENT");
    const amount = MoneyBRL.parse(input.amount, { positive: true }); const reason = input.reason.trim(); if (!reason) throw new FinanceDomainError("REASON_REQUIRED");
    if (input.allocations.length === 0) throw new FinanceDomainError("REVERSAL_TOTAL_MISMATCH");
    const allocations = input.allocations.map((item) => ({ originalAllocationId: item.originalAllocationId, amount: MoneyBRL.parse(item.amount, { positive: true }) }));
    if (allocations.reduce((sum, item) => sum + item.amount.cents, 0n) !== amount.cents) throw new FinanceDomainError("REVERSAL_TOTAL_MISMATCH");
    return this.commands.execute({ actor: input.actor, capability: "RECEIVABLE_REVERSE_PAYMENT", key: input.idempotencyKey, command: "receipt.reverse", parameters: { receiptId: input.receiptId, amountCents: amount.cents.toString(), reason, allocations: canonicalizeAllocations(allocations.map((item) => ({ installmentId: item.originalAllocationId, amountCents: item.amount.cents }))) }, run: async (tx) => {
      const receipt = await tx.financialTransaction.findUnique({ where: { id: input.receiptId } });
      if (!receipt) throw new FinanceDomainError("ORIGINAL_RECEIPT_REQUIRED");
      if (receipt.type !== "RECEIPT") throw new FinanceDomainError("REVERSAL_OF_REVERSAL_FORBIDDEN");
      const plan = await lockPlan(tx, receipt.paymentPlanId); if (plan.status !== "ACTIVE" || plan.discardedAt) throw new FinanceDomainError("PAYMENT_PLAN_NOT_ACTIVE");
      const originalIds = [...new Set(allocations.map((item) => item.originalAllocationId))];
      const originals = await tx.transactionAllocation.findMany({ where: { id: { in: originalIds }, transactionId: receipt.id, originalAllocationId: null } });
      if (originals.length !== originalIds.length) throw new FinanceDomainError("ORIGINAL_RECEIPT_REQUIRED");
      const reversed = await tx.transactionAllocation.groupBy({ by: ["originalAllocationId"], where: { originalAllocationId: { in: originals.map((item) => item.id) } }, _sum: { amountCents: true } });
      const totals = new Map(reversed.map((row) => [row.originalAllocationId!, row._sum.amountCents ?? 0n]));
      const proposed = new Map<string, bigint>();
      for (const allocation of allocations) proposed.set(allocation.originalAllocationId, (proposed.get(allocation.originalAllocationId) ?? 0n) + allocation.amount.cents);
      for (const original of originals) if ((proposed.get(original.id) ?? 0n) > original.amountCents - (totals.get(original.id) ?? 0n)) throw new FinanceDomainError("REVERSAL_EXCEEDS_AVAILABLE", { originalAllocationId: original.id });
      const reversal = await tx.financialTransaction.create({ data: { paymentPlanId: plan.id, type: "REVERSAL", amountCents: amount.cents, actorUserId: input.actor.actorUserId, reason, originalReceiptId: receipt.id } });
      const created: { id: string; originalAllocationId: string; installmentId: string; amount: string }[] = [];
      for (const allocation of allocations) { const original = originals.find((item) => item.id === allocation.originalAllocationId)!; const row = await tx.transactionAllocation.create({ data: { transactionId: reversal.id, installmentId: original.installmentId, amountCents: allocation.amount.cents, originalAllocationId: original.id } }); created.push({ id: row.id, originalAllocationId: original.id, installmentId: original.installmentId, amount: allocation.amount.toApi() }); }
      await this.audit.append(tx, { action: "finance.receipt.reversed", actorUserId: input.actor.actorUserId, aggregate: { type: "FinancialTransaction", id: reversal.id }, contractId: plan.contractId, paymentPlanId: plan.id, transactionId: reversal.id, reason, context: { originalReceiptId: receipt.id, amountCents: amount.cents.toString(), originalAllocationIds: originals.map((item) => item.id) } });
      return { type: "FinancialTransaction", id: reversal.id, payload: { id: reversal.id, paymentPlanId: plan.id, type: "REVERSAL", originalReceiptId: receipt.id, amount: amount.toApi(), reason, occurredAt: reversal.occurredAt.toISOString(), allocations: created } as Prisma.InputJsonValue };
    }});
  }
}
