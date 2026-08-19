import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { databaseDate, hasFinancialHistory, lockPlan, requireEditableDraft } from "./financeCommandSupport.js";
import { LocalDate } from "../domain/LocalDate.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class CreateInstallment {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string; originalAmount: string; dueDate: string; installmentNumber?: number }) {
    await this.authorization.require(input.actor.actorUserId, "INSTALLMENT_CREATE");
    const amount = MoneyBRL.parse(input.originalAmount, { positive: true });
    const dueDate = LocalDate.parse(input.dueDate);
    if (input.installmentNumber !== undefined && (!Number.isInteger(input.installmentNumber) || input.installmentNumber < 1)) throw new FinanceDomainError("INVALID_INSTALLMENT_NUMBER");
    return this.commands.execute({ actor: input.actor, capability: "INSTALLMENT_CREATE", key: input.idempotencyKey, command: "installment.create", parameters: { planId: input.planId, originalCents: amount.cents.toString(), dueDate: dueDate.toString(), installmentNumber: input.installmentNumber?.toString() ?? "suggested" }, run: async (tx) => {
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      const maximum = await tx.installment.aggregate({ where: { paymentPlanId: plan.id }, _max: { installmentNumber: true } });
      const number = input.installmentNumber ?? (maximum._max.installmentNumber ?? 0) + 1;
      try {
        const installment = await tx.installment.create({ data: { paymentPlanId: plan.id, installmentNumber: number, originalCents: amount.cents, dueDate: databaseDate(dueDate.toString()) } });
        await this.audit.append(tx, { action: "finance.installment.created", actorUserId: input.actor.actorUserId, aggregate: { type: "Installment", id: installment.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { installmentId: installment.id, originalCents: amount.cents.toString(), dueDate: dueDate.toString(), installmentNumber: number.toString() } });
        return { type: "Installment", id: installment.id, payload: { id: installment.id, paymentPlanId: plan.id, installmentNumber: number, originalAmount: amount.toApi(), dueDate: dueDate.toString() } as Prisma.InputJsonValue };
      } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new FinanceDomainError("DUPLICATE_INSTALLMENT_NUMBER"); throw error; }
    }});
  }
}
