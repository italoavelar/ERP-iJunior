import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort } from "./FinanceCapability.js";
import { ContractReferencePort } from "./ContractReferencePort.js";
import { FinanceCommandExecutor } from "./FinanceCommandExecutor.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { PrismaTransactionalAuditWriter } from "../infrastructure/PrismaTransactionalAuditWriter.js";
import { PaymentPlanAlreadyExistsError } from "../infrastructure/PrismaFinanceUnitOfWork.js";

export class CreatePaymentPlan {
  constructor(private readonly contracts: ContractReferencePort, private readonly authorization: AuthorizationPort, private readonly commands: FinanceCommandExecutor, private readonly audit: PrismaTransactionalAuditWriter) {}
  async execute(input: { actor: AuthenticatedCommandContext; idempotencyKey: string; contractId: string; totalAmount: string }): Promise<{ id: string; contractId: string; clientId: string; totalAmount: string; status: "DRAFT" }> {
    await this.authorization.require(input.actor.actorUserId, "PAYMENT_PLAN_CREATE");
    const total = MoneyBRL.parse(input.totalAmount, { positive: true });
    const context = await this.contracts.getReceivablesContext(input.contractId);
    if (context.kind !== "available") throw new FinanceDomainError("CONTRACT_INELIGIBLE");
    return this.commands.execute({ actor: input.actor, capability: "PAYMENT_PLAN_CREATE", key: input.idempotencyKey, command: "payment-plan.create", parameters: { contractId: input.contractId, totalCents: total.cents.toString() }, run: async (tx) => {
      try {
        const plan = await tx.paymentPlan.create({ data: { contractId: context.contractId, clientId: context.clientId, currency: "BRL", totalCents: total.cents } });
        const payload = { id: plan.id, contractId: plan.contractId, clientId: plan.clientId, totalAmount: total.toApi(), status: "DRAFT" as const };
        await this.audit.append(tx, { action: "finance.payment-plan.created", actorUserId: input.actor.actorUserId, aggregate: { type: "PaymentPlan", id: plan.id }, contractId: plan.contractId, paymentPlanId: plan.id, context: { clientId: plan.clientId, totalCents: total.cents.toString(), currency: "BRL" } });
        return { type: "PaymentPlan", id: plan.id, payload: payload as Prisma.InputJsonValue };
      } catch (error) {
        if (error instanceof PaymentPlanAlreadyExistsError || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw new FinanceDomainError("PAYMENT_PLAN_ALREADY_EXISTS");
        throw error;
      }
    }) as Promise<{ id: string; contractId: string; clientId: string; totalAmount: string; status: "DRAFT" }>;
  }
}
