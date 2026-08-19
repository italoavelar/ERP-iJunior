import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { hasFinancialHistory, lockPlan, requireEditableDraft } from "./financeCommandSupport.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class RemoveDraftInstallment {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; installmentId: string }) {
    await this.authorization.require(input.actor.actorUserId, "INSTALLMENT_REMOVE");
    return this.commands.execute({ actor: input.actor, capability: "INSTALLMENT_REMOVE", key: input.idempotencyKey, command: "installment.remove", parameters: { planId: input.planId, installmentId: input.installmentId }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const installment = await tx.installment.findFirst({ where: { id: input.installmentId, paymentPlanId: plan.id } });
      if (!installment) throw new FinanceDomainError("INSTALLMENT_NOT_FOUND");
      await tx.installment.delete({ where: { id: installment.id } });
      await this.audit.append(tx, { action: "finance.installment.removed", actorUserId: input.actor.actorUserId, aggregate: { type: "Installment", id: installment.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { installmentId: installment.id, installmentNumber: installment.installmentNumber.toString() } });
      return { type: "Installment", id: installment.id, payload: { removedInstallmentId: installment.id, paymentPlanId: plan.id } as Prisma.InputJsonValue };
    }});
  }
}
