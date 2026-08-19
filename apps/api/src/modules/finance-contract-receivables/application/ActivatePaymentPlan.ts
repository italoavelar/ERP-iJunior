import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { ContractReferencePort, ReceivablesContractContext } from "./ContractReferencePort.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { PaymentPlanLookupPort } from "./PaymentPlanLookupPort.js";
import { hasFinancialHistory, lockPlan, requireEditableDraft, wireMoney } from "./financeCommandSupport.js";
import { TransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";

export class ActivatePaymentPlan {
  constructor(private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly contracts: ContractReferencePort, private readonly plans: PaymentPlanLookupPort, private readonly audit: TransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; planId: string }) {
    await this.authorization.require(input.actor.actorUserId, "PAYMENT_PLAN_ACTIVATE");
    return this.commands.execute<Prisma.InputJsonValue, ReceivablesContractContext>({ actor: input.actor, capability: "PAYMENT_PLAN_ACTIVATE", key: input.idempotencyKey, command: "payment-plan.activate", parameters: { planId: input.planId }, prepare: async () => {
      const contractId = await this.plans.getContractId(input.planId); if (!contractId) throw new FinanceDomainError("PAYMENT_PLAN_NOT_FOUND");
      return this.contracts.getReceivablesContext(contractId);
    }, run: async (tx, context) => {
      if (context.kind !== "available") throw new FinanceDomainError("CONTRACT_INELIGIBLE");
      const plan = await lockPlan(tx, input.planId); requireEditableDraft(plan, await hasFinancialHistory(tx, plan.id));
      if (plan.contractId !== context.contractId || plan.clientId !== context.clientId || plan.currency !== "BRL") throw new FinanceDomainError("CONTRACT_REFERENCE_MISMATCH");
      const installments = await tx.installment.findMany({ where: { paymentPlanId: plan.id }, orderBy: { installmentNumber: "asc" } });
      if (installments.length === 0) throw new FinanceDomainError("PLAN_WITHOUT_INSTALLMENTS");
      if (installments.some((item, index) => item.installmentNumber !== index + 1)) throw new FinanceDomainError("INVALID_INSTALLMENT_SEQUENCE");
      const total = installments.reduce((sum, item) => sum + item.originalCents, 0n);
      if (total !== plan.totalCents) throw new FinanceDomainError("PLAN_TOTAL_MISMATCH");
      if (plan.totalCents !== context.financialValue.cents) throw new FinanceDomainError("CONTRACT_VALUE_MISMATCH");
      const changed = await tx.paymentPlan.update({ where: { id: plan.id }, data: { status: "ACTIVE" } });
      await this.audit.append(tx, { action: "finance.payment-plan.activated", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { priorStatus: "DRAFT", totalCents: plan.totalCents.toString(), installmentIds: installments.map((item) => item.id) } });
      return { type: "PaymentPlan", id: plan.id, payload: { id: plan.id, status: changed.status, totalAmount: wireMoney(plan.totalCents) } as Prisma.InputJsonValue };
    }});
  }
}
