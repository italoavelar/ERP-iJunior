import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { CapabilityMissingError } from "../../application/FinanceCapability.js";
import { FinanceDomainError } from "../../application/FinanceDomainError.js";
import { LocalDateError } from "../../domain/LocalDate.js";
import { MoneyBRLError } from "../../domain/MoneyBRL.js";
import { ConcurrentOperationError } from "../../infrastructure/PrismaFinanceUnitOfWork.js";
import { IdempotencyConflictError } from "../../infrastructure/PrismaIdempotencyStore.js";
import { financeErrorResponse } from "../financeErrorMapper.js";

async function map(error: unknown): Promise<{ status: number; body: { error: { code: string; retriable?: boolean } }; text: string }> {
  const app = new Hono();
  app.get("/", (context) => financeErrorResponse(context, error));
  const response = await app.request("/");
  const text = await response.text();
  return { status: response.status, body: JSON.parse(text) as { error: { code: string; retriable?: boolean } }, text };
}

const domainCases: readonly [string, number][] = [
  ["CAPABILITY_MISSING", 403], ["FINANCE_CAPABILITY_MISSING", 403], ["AUDIT_CAPABILITY_MISSING", 403],
  ["CONTRACT_UNAVAILABLE", 404], ["PAYMENT_PLAN_NOT_FOUND", 404],
  ["PAYMENT_PLAN_ALREADY_EXISTS", 409], ["PAYMENT_PLAN_NOT_DRAFT", 409], ["PAYMENT_PLAN_NOT_ACTIVE", 409],
  ["PAYMENT_PLAN_DISCARDED", 409], ["FINANCIAL_HISTORY_PRESENT", 409], ["DUPLICATE_INSTALLMENT_NUMBER", 409],
  ["IDEMPOTENCY_CONFLICT", 409],
  ["CONTRACT_INELIGIBLE", 422], ["CONTRACT_NOT_BRL", 422], ["INVALID_MONEY", 422], ["INVALID_AMOUNT", 422],
  ["INVALID_DUE_DATE", 422], ["INVALID_INSTALLMENT_SEQUENCE", 422], ["PLAN_WITHOUT_INSTALLMENTS", 422],
  ["PLAN_TOTAL_MISMATCH", 422], ["CONTRACT_VALUE_MISMATCH", 422], ["ALLOCATION_PLAN_MISMATCH", 422],
  ["ALLOCATION_EXCEEDS_OPEN_BALANCE", 422], ["UNALLOCATED_AMOUNT", 422], ["REVERSAL_TOTAL_MISMATCH", 422],
  ["REVERSAL_EXCEEDS_AVAILABLE", 422], ["ORIGINAL_RECEIPT_REQUIRED", 422], ["REVERSAL_OF_REVERSAL_FORBIDDEN", 422],
  ["REASON_REQUIRED", 422], ["CLIENT_OCCURRENCE_TIMESTAMP_FORBIDDEN", 422]
];

describe("finance error mapper", () => {
  it.each(domainCases)("maps %s to %i", async (code, status) => {
    const mapped = await map(new FinanceDomainError(code));
    expect(mapped.status).toBe(status);
    expect(mapped.body.error.code).toBe(code);
  });

  it.each([
    [new CapabilityMissingError(), "CAPABILITY_MISSING", 403],
    [new IdempotencyConflictError(), "IDEMPOTENCY_CONFLICT", 409],
    [new MoneyBRLError(), "INVALID_MONEY", 422],
    [new LocalDateError(), "INVALID_DUE_DATE", 422]
  ] as const)("translates typed infrastructure/domain errors", async (error, code, status) => {
    const mapped = await map(error);
    expect(mapped.status).toBe(status);
    expect(mapped.body.error.code).toBe(code);
  });

  it("marks exhausted concurrency as retriable", async () => {
    const mapped = await map(new ConcurrentOperationError());
    expect(mapped.status).toBe(409);
    expect(mapped.body.error).toMatchObject({ code: "CONCURRENT_OPERATION_CONFLICT", retriable: true });
  });

  it("logs unknown failures without exposing raw infrastructure details", async () => {
    const logging = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mapped = await map(new Error("postgres password=secret Prisma raw failure"));
    expect(mapped.status).toBe(500);
    expect(mapped.body.error.code).toBe("INTERNAL_ERROR");
    expect(mapped.text).not.toMatch(/postgres|password|secret|Prisma/i);
    expect(logging).toHaveBeenCalledWith(JSON.stringify({ event: "finance.request.error", requestId: "unavailable", route: "/", errorType: "Error" }));
    logging.mockRestore();
  });
});
