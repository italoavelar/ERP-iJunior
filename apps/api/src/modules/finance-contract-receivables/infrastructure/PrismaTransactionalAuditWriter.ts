import { Prisma } from "@prisma/client";
import { FinanceTransaction } from "./PrismaFinanceUnitOfWork.js";

export const FinanceAuditActions = [
  "finance.payment-plan.created", "finance.payment-plan.activated", "finance.payment-plan.returned-to-draft", "finance.payment-plan.discarded",
  "finance.installment.created", "finance.installment.updated", "finance.installment.removed", "finance.installments.reordered",
  "finance.receipt.registered", "finance.receipt.reversed"
] as const;
export type FinanceAuditAction = (typeof FinanceAuditActions)[number];
export interface AuditEventInput {
  action: FinanceAuditAction; actorUserId: string; aggregate: { type: string; id: string }; contractId: string; paymentPlanId: string;
  transactionId?: string; reason?: string; context: Record<string, string | string[] | boolean>;
}
export interface TransactionalAuditWriter { append(tx: FinanceTransaction, event: AuditEventInput): Promise<void>; }

export class PrismaTransactionalAuditWriter implements TransactionalAuditWriter {
  async append(tx: FinanceTransaction, event: AuditEventInput): Promise<void> {
    await tx.auditEvent.create({ data: {
      domain: "finance-contract-receivables", action: event.action, aggregateType: event.aggregate.type, aggregateId: event.aggregate.id,
      contractId: event.contractId, paymentPlanId: event.paymentPlanId, transactionId: event.transactionId ?? null,
      actorUserId: event.actorUserId, reason: event.reason ?? null, context: event.context as Prisma.InputJsonValue
    } });
  }
}
