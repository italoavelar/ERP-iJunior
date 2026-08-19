import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { hasFinancialHistory, lockPlan } from "./financeCommandSupport.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class ReturnPlanToDraft {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; reason: string }) {
    await this.authorization.require(input.actor.actorUserId, "PAYMENT_PLAN_RETURN_TO_DRAFT");
    const reason = input.reason.trim(); if (!reason) throw new FinanceDomainError("REASON_REQUIRED");
    return this.commands.execute({ actor: input.actor, capability: "PAYMENT_PLAN_RETURN_TO_DRAFT", key: input.idempotencyKey, command: "payment-plan.return-to-draft", parameters: { planId: input.planId, reason }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); if (plan.status !== "ACTIVE") throw new FinanceDomainError("PAYMENT_PLAN_NOT_ACTIVE");
      if (await hasFinancialHistory(tx, plan.id)) throw new FinanceDomainError("FINANCIAL_HISTORY_PRESENT");
      await tx.paymentPlan.update({ where: { id: plan.id }, data: { status: "DRAFT" } });
      await this.audit.append(tx, { action: "finance.payment-plan.returned-to-draft", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, reason, context: { priorStatus: "ACTIVE", financialHistoryPresent: false } });
      return { type: "PaymentPlan", id: plan.id, payload: { id: plan.id, status: "DRAFT" } as Prisma.InputJsonValue };
    }});
  }
}
