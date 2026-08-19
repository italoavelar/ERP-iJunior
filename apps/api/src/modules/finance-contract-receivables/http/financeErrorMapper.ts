import { Context } from "hono";
import { CapabilityMissingError } from "../application/FinanceCapability.js";
import { FinanceDomainError } from "../application/FinanceDomainError.js";
import { IdempotencyConflictError } from "../infrastructure/PrismaIdempotencyStore.js";
import { ConcurrentOperationError } from "../infrastructure/PrismaFinanceUnitOfWork.js";
import { LocalDateError } from "../domain/LocalDate.js";
import { MoneyBRLError } from "../domain/MoneyBRL.js";

const conflicts = new Set(["PAYMENT_PLAN_ALREADY_EXISTS", "PAYMENT_PLAN_NOT_DRAFT", "PAYMENT_PLAN_NOT_ACTIVE", "PAYMENT_PLAN_DISCARDED", "PLAN_NOT_EDITABLE", "FINANCIAL_HISTORY_PRESENT", "DUPLICATE_INSTALLMENT_NUMBER", "IDEMPOTENCY_CONFLICT", "CONCURRENT_OPERATION_CONFLICT"]);
const notFound = new Set(["CONTRACT_UNAVAILABLE", "PAYMENT_PLAN_NOT_FOUND", "INSTALLMENT_NOT_FOUND"]);
const forbidden = new Set(["CAPABILITY_MISSING", "FINANCE_CAPABILITY_MISSING", "AUDIT_CAPABILITY_MISSING"]);
const messages: Record<string, string> = {
  PAYMENT_PLAN_ALREADY_EXISTS: "A live payment plan already exists for this contract.", PLAN_NOT_EDITABLE: "The payment plan is not editable.", FINANCIAL_HISTORY_PRESENT: "Financial history permanently freezes this plan.",
  ALLOCATION_EXCEEDS_OPEN_BALANCE: "The requested allocation exceeds the open balance.", UNALLOCATED_AMOUNT: "The transaction amount must equal its allocations.", REVERSAL_EXCEEDS_AVAILABLE: "The reversal exceeds the available amount.",
  IDEMPOTENCY_CONFLICT: "The idempotency key was already used for different command semantics.", CAPABILITY_MISSING: "The actor lacks the required finance capability.",
  FINANCE_CAPABILITY_MISSING: "The actor lacks finance read capability.", AUDIT_CAPABILITY_MISSING: "The actor lacks financial audit capability."
};

export function financeErrorResponse(context: Context, error: unknown): Response {
  let code = "INTERNAL_ERROR"; let status = 500; let details: Record<string, string> | undefined;
  if (error instanceof FinanceDomainError) { code = error.code; details = error.details; status = forbidden.has(code) ? 403 : conflicts.has(code) ? 409 : notFound.has(code) ? 404 : 422; }
  else if (error instanceof CapabilityMissingError) { code = "CAPABILITY_MISSING"; status = 403; }
  else if (error instanceof IdempotencyConflictError) { code = "IDEMPOTENCY_CONFLICT"; status = 409; }
  else if (error instanceof ConcurrentOperationError) { code = "CONCURRENT_OPERATION_CONFLICT"; status = 409; }
  else if (error instanceof MoneyBRLError) { code = "INVALID_MONEY"; status = 422; }
  else if (error instanceof LocalDateError) { code = "INVALID_DUE_DATE"; status = 422; }
  else console.error("finance request failed", { errorType: error instanceof Error ? error.name : typeof error });
  return context.json({ error: { code, message: messages[code] ?? code, ...(details && Object.keys(details).length > 0 ? { details } : {}), ...(code === "CONCURRENT_OPERATION_CONFLICT" ? { retriable: true } : {}) } }, status as 403 | 404 | 409 | 422 | 500);
}
