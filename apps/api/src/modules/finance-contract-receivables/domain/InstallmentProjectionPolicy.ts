import { Clock, LocalDate } from "./LocalDate.js";
import { MoneyBRL } from "./MoneyBRL.js";

export type SettlementStatus = "PENDING" | "PARTIAL" | "SETTLED";
export type DueStatus = "NOT_DUE" | "OVERDUE";

export function deriveInstallmentProjection(input: { original: MoneyBRL; receiptAllocated: MoneyBRL; reversed: MoneyBRL; dueDate: LocalDate; clock: Clock }): {
  receivedAmount: MoneyBRL; remainingBalance: MoneyBRL; settlementStatus: SettlementStatus; dueStatus: DueStatus;
} {
  const receivedAmount = input.receiptAllocated.subtract(input.reversed);
  const remainingBalance = input.original.subtract(receivedAmount);
  if (receivedAmount.cents < 0n || remainingBalance.cents < 0n) throw new Error("FINANCIAL_PROJECTION_INTEGRITY_FAULT");
  const settlementStatus: SettlementStatus = receivedAmount.cents === 0n ? "PENDING" : remainingBalance.cents === 0n ? "SETTLED" : "PARTIAL";
  const dueStatus: DueStatus = remainingBalance.cents > 0n && input.clock.todayIn("America/Sao_Paulo").compare(input.dueDate) === 1 ? "OVERDUE" : "NOT_DUE";
  return { receivedAmount, remainingBalance, settlementStatus, dueStatus };
}

export function deriveReversibleAmount(originalAllocation: MoneyBRL, reversed: MoneyBRL): MoneyBRL {
  const remaining = originalAllocation.subtract(reversed);
  if (remaining.cents < 0n) throw new Error("FINANCIAL_PROJECTION_INTEGRITY_FAULT");
  return remaining;
}
