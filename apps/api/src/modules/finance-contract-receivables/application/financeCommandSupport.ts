import { PaymentPlan, Prisma } from "@prisma/client";
import { FinanceDomainError } from "./FinanceDomainError.js";

export async function lockPlan(tx: Prisma.TransactionClient, planId: string): Promise<PaymentPlan> {
  const rows = await tx.$queryRaw<readonly { id: string }[]>(Prisma.sql`SELECT "id" FROM "PaymentPlan" WHERE "id" = ${planId}::uuid FOR UPDATE`);
  if (rows.length === 0) throw new FinanceDomainError("PAYMENT_PLAN_NOT_FOUND");
  return tx.paymentPlan.findUniqueOrThrow({ where: { id: planId } });
}

export async function hasFinancialHistory(tx: Prisma.TransactionClient, planId: string): Promise<boolean> {
  const [transactions, allocations] = await Promise.all([
    tx.financialTransaction.count({ where: { paymentPlanId: planId } }),
    tx.transactionAllocation.count({ where: { installment: { paymentPlanId: planId } } })
  ]);
  return transactions > 0 || allocations > 0;
}

export function requireEditableDraft(plan: PaymentPlan, history: boolean): void {
  if (history) throw new FinanceDomainError("FINANCIAL_HISTORY_PRESENT");
  if (plan.discardedAt) throw new FinanceDomainError("PAYMENT_PLAN_DISCARDED");
  if (plan.status !== "DRAFT") throw new FinanceDomainError("PAYMENT_PLAN_NOT_DRAFT");
}

export function databaseDate(value: string): Date { return new Date(`${value}T00:00:00.000Z`); }
export function wireDate(value: Date): string { return value.toISOString().slice(0, 10); }
export function wireMoney(cents: bigint): string {
  const whole = cents / 100n;
  return `${whole}.${(cents % 100n).toString().padStart(2, "0")}`;
}
