import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { hasFinancialHistory, lockPlan, requireEditableDraft } from "./financeCommandSupport.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class ReorderInstallments {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; installmentIds: readonly string[] }) {
    await this.authorization.require(input.actor.actorUserId, "INSTALLMENT_REORDER");
    return this.commands.execute({ actor: input.actor, capability: "INSTALLMENT_REORDER", key: input.idempotencyKey, command: "installment.reorder", parameters: { planId: input.planId, installmentIds: [...input.installmentIds] }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const current = await tx.installment.findMany({ where: { paymentPlanId: plan.id }, orderBy: { installmentNumber: "asc" } });
      const requested = new Set(input.installmentIds);
      if (requested.size !== input.installmentIds.length || current.length !== requested.size || current.some((item) => !requested.has(item.id))) throw new FinanceDomainError("INVALID_REORDER_SET");
      for (let index = 0; index < input.installmentIds.length; index += 1) await tx.installment.update({ where: { id: input.installmentIds[index]! }, data: { installmentNumber: -(index + 1) } });
      for (let index = 0; index < input.installmentIds.length; index += 1) await tx.installment.update({ where: { id: input.installmentIds[index]! }, data: { installmentNumber: index + 1 } });
      await this.audit.append(tx, { action: "finance.installments.reordered", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { installmentIds: [...input.installmentIds] } });
      return { type: "PaymentPlan", id: plan.id, payload: { paymentPlanId: plan.id, installmentIds: [...input.installmentIds] } as Prisma.InputJsonValue };
    }});
  }
}
