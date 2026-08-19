import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { hasFinancialHistory, lockPlan, requireEditableDraft, wireMoney } from "./financeCommandSupport.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class ChangeDraftPlanTotal {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; totalAmount: string }) {
    await this.authorization.require(input.actor.actorUserId, "PAYMENT_PLAN_EDIT_DRAFT");
    const amount = MoneyBRL.parse(input.totalAmount, { positive: true });
    return this.commands.execute({ actor: input.actor, capability: "PAYMENT_PLAN_EDIT_DRAFT", key: input.idempotencyKey, command: "payment-plan.change-draft-total", parameters: { planId: input.planId, totalCents: amount.cents.toString() }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId);
      requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const changed = await tx.paymentPlan.update({ where: { id: plan.id }, data: { totalCents: amount.cents } });
      await this.audit.append(tx, { action: "finance.payment-plan.total-changed", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { beforeCents: plan.totalCents.toString(), afterCents: amount.cents.toString() } });
      return { type: "PaymentPlan", id: plan.id, payload: { id: plan.id, totalAmount: wireMoney(changed.totalCents), status: changed.status } as Prisma.InputJsonValue };
    }});
  }
}
