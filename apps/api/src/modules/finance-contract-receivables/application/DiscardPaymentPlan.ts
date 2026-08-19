import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { hasFinancialHistory, lockPlan, requireEditableDraft } from "./financeCommandSupport.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class DiscardPaymentPlan {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; reason: string }) {
    await this.authorization.require(input.actor.actorUserId, "PAYMENT_PLAN_DISCARD");
    const reason = input.reason.trim(); if (!reason) throw new FinanceDomainError("REASON_REQUIRED");
    return this.commands.execute({ actor: input.actor, capability: "PAYMENT_PLAN_DISCARD", key: input.idempotencyKey, command: "payment-plan.discard", parameters: { planId: input.planId, reason }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const discardedAt = new Date(); await tx.paymentPlan.update({ where: { id: plan.id }, data: { discardedAt, discardedById: input.actor.actorUserId } });
      await this.audit.append(tx, { action: "finance.payment-plan.discarded", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, reason, context: { priorStatus: "DRAFT", financialHistoryPresent: false, discarded: true } });
      return { type: "PaymentPlan", id: plan.id, payload: { id: plan.id, discardedAt: discardedAt.toISOString() } as Prisma.InputJsonValue };
    }});
  }
}
