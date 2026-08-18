import { MoneyBRL } from "./MoneyBRL.js";

export type PlanLifecycle = "DRAFT" | "ACTIVE";
export interface PlanForPolicy { status: PlanLifecycle; discardedAt: Date | null; total: MoneyBRL; }

export class FinancePolicyError extends Error { override name = "FinancePolicyError"; }

export function assertDraftStructuralMutation(plan: PlanForPolicy, hasFinancialHistory: boolean): void {
  if (hasFinancialHistory) throw new FinancePolicyError("FINANCIAL_HISTORY_FREEZES_PLAN");
  if (plan.discardedAt) throw new FinancePolicyError("PAYMENT_PLAN_DISCARDED");
  if (plan.status !== "DRAFT") throw new FinancePolicyError("PAYMENT_PLAN_NOT_DRAFT");
}

export function assertReturnToDraft(plan: PlanForPolicy, hasFinancialHistory: boolean, reason: string): void {
  if (hasFinancialHistory) throw new FinancePolicyError("FINANCIAL_HISTORY_FREEZES_PLAN");
  if (plan.status !== "ACTIVE") throw new FinancePolicyError("PAYMENT_PLAN_NOT_ACTIVE");
  if (!reason.trim()) throw new FinancePolicyError("REASON_REQUIRED");
}

export function assertDraftDiscard(plan: PlanForPolicy, hasFinancialHistory: boolean, reason: string): void {
  assertDraftStructuralMutation(plan, hasFinancialHistory);
  if (!reason.trim()) throw new FinancePolicyError("REASON_REQUIRED");
}
