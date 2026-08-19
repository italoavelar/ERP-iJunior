import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { databaseDate, hasFinancialHistory, lockPlan, requireEditableDraft, wireDate, wireMoney } from "./financeCommandSupport.js";
import { LocalDate } from "../domain/LocalDate.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class EditDraftInstallment {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; installmentId: string; originalAmount?: string; dueDate?: string }) {
    await this.authorization.require(input.actor.actorUserId, "INSTALLMENT_EDIT_DRAFT");
    if (input.originalAmount === undefined && input.dueDate === undefined) throw new FinanceDomainError("EMPTY_UPDATE");
    const amount = input.originalAmount === undefined ? undefined : MoneyBRL.parse(input.originalAmount, { positive: true });
    const dueDate = input.dueDate === undefined ? undefined : LocalDate.parse(input.dueDate);
    return this.commands.execute({ actor: input.actor, capability: "INSTALLMENT_EDIT_DRAFT", key: input.idempotencyKey, command: "installment.edit", parameters: { planId: input.planId, installmentId: input.installmentId, originalCents: amount?.cents.toString() ?? "unchanged", dueDate: dueDate?.toString() ?? "unchanged" }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const current = await tx.installment.findFirst({ where: { id: input.installmentId, paymentPlanId: plan.id } });
      if (!current) throw new FinanceDomainError("INSTALLMENT_NOT_FOUND");
      const changed = await tx.installment.update({ where: { id: current.id }, data: { ...(amount ? { originalCents: amount.cents } : {}), ...(dueDate ? { dueDate: databaseDate(dueDate.toString()) } : {}) } });
      await this.audit.append(tx, { action: "finance.installment.updated", actorUserId: input.actor.actorUserId, aggregate: { type: "Installment", id: current.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { installmentId: current.id, beforeCents: current.originalCents.toString(), afterCents: changed.originalCents.toString(), beforeDueDate: wireDate(current.dueDate), afterDueDate: wireDate(changed.dueDate) } });
      return { type: "Installment", id: changed.id, payload: { id: changed.id, paymentPlanId: plan.id, installmentNumber: changed.installmentNumber, originalAmount: wireMoney(changed.originalCents), dueDate: wireDate(changed.dueDate) } as Prisma.InputJsonValue };
    }});
  }
}
