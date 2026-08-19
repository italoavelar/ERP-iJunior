import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { canonicalizeAllocations } from "./IdempotencyPolicy.js";
import { lockPlan } from "./financeCommandSupport.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export interface ReceiptAllocationInput { readonly installmentId: string; readonly amount: string; }

export class RegisterReceipt {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; amount: string; allocations: readonly ReceiptAllocationInput[] }) {
    await this.authorization.require(input.actor.actorUserId, "RECEIVABLE_REGISTER_PAYMENT");
    const amount = MoneyBRL.parse(input.amount, { positive: true });
    if (input.allocations.length === 0) throw new FinanceDomainError("UNALLOCATED_AMOUNT");
    const allocations = input.allocations.map((item) => ({ installmentId: item.installmentId, amount: MoneyBRL.parse(item.amount, { positive: true }) }));
    if (allocations.reduce((sum, item) => sum + item.amount.cents, 0n) !== amount.cents) throw new FinanceDomainError("UNALLOCATED_AMOUNT");
    return this.commands.execute({ actor: input.actor, capability: "RECEIVABLE_REGISTER_PAYMENT", key: input.idempotencyKey, command: "receipt.register", parameters: { planId: input.planId, amountCents: amount.cents.toString(), allocations: canonicalizeAllocations(allocations.map((item) => ({ installmentId: item.installmentId, amountCents: item.amount.cents }))) }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId);
      if (plan.status !== "ACTIVE" || plan.discardedAt) throw new FinanceDomainError("PAYMENT_PLAN_NOT_ACTIVE");
      const installmentIds = [...new Set(allocations.map((item) => item.installmentId))];
      const installments = await tx.installment.findMany({ where: { paymentPlanId: plan.id, id: { in: installmentIds } } });
      if (installments.length !== installmentIds.length) throw new FinanceDomainError("ALLOCATION_PLAN_MISMATCH");
      const balances = await tx.$queryRaw<readonly { installmentId: string; netCents: bigint }[]>(Prisma.sql`
        SELECT i."id" AS "installmentId", COALESCE(SUM(CASE WHEN t."type" = 'RECEIPT' THEN a."amountCents" ELSE -a."amountCents" END), 0)::bigint AS "netCents"
        FROM "Installment" i LEFT JOIN "TransactionAllocation" a ON a."installmentId" = i."id"
        LEFT JOIN "FinancialTransaction" t ON t."id" = a."transactionId"
        WHERE i."paymentPlanId" = ${plan.id}::uuid AND i."id" IN (${Prisma.join(allocations.map((item) => Prisma.sql`${item.installmentId}::uuid`))}) GROUP BY i."id"`);
      const net = new Map(balances.map((row) => [row.installmentId, row.netCents]));
      const proposed = new Map<string, bigint>();
      for (const allocation of allocations) proposed.set(allocation.installmentId, (proposed.get(allocation.installmentId) ?? 0n) + allocation.amount.cents);
      for (const installment of installments) {
        if ((proposed.get(installment.id) ?? 0n) > installment.originalCents - (net.get(installment.id) ?? 0n)) throw new FinanceDomainError("ALLOCATION_EXCEEDS_OPEN_BALANCE", { installmentId: installment.id });
      }
      const transaction = await tx.financialTransaction.create({ data: { paymentPlanId: plan.id, type: "RECEIPT", amountCents: amount.cents, actorUserId: input.actor.actorUserId } });
      const created: { id: string; installmentId: string; amount: string }[] = [];
      for (const allocation of allocations) { const row = await tx.transactionAllocation.create({ data: { transactionId: transaction.id, installmentId: allocation.installmentId, amountCents: allocation.amount.cents } }); created.push({ id: row.id, installmentId: row.installmentId, amount: allocation.amount.toApi() }); }
      await this.audit.append(tx, { action: "finance.receipt.registered", actorUserId: input.actor.actorUserId, aggregate: { type: "FinancialTransaction", id: transaction.id }, contractId: plan.contractId, paymentPlanId: plan.id, transactionId: transaction.id, context: { amountCents: amount.cents.toString(), allocationIds: created.map((item) => item.id) } });
      return { type: "FinancialTransaction", id: transaction.id, payload: { id: transaction.id, paymentPlanId: plan.id, type: "RECEIPT", amount: amount.toApi(), occurredAt: transaction.occurredAt.toISOString(), allocations: created } as Prisma.InputJsonValue };
    }});
  }
}
