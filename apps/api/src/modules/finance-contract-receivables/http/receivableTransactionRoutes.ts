import { Context, Hono } from "hono";
import { RegisterReceipt, ReceiptAllocationInput } from "../application/RegisterReceipt.js";
import { ReverseReceipt, ReversalAllocationInput } from "../application/ReverseReceipt.js";
import { FinanceDomainError } from "../application/FinanceDomainError.js";
import { FinanceEnv, capabilityMiddleware, closedJson, idempotencyKey, routeParam, stringField } from "./financeCommandMiddleware.js";
import { financeErrorResponse } from "./financeErrorMapper.js";

function objectArray(body: Record<string, unknown>, field: string, keys: readonly string[]): Record<string, unknown>[] {
  const value = body[field]; if (!Array.isArray(value)) throw new FinanceDomainError("INVALID_REQUEST");
  return value.map((item) => { if (typeof item !== "object" || item === null || Array.isArray(item)) throw new FinanceDomainError("INVALID_REQUEST"); const object = item as Record<string, unknown>; if (Object.keys(object).some((key) => !keys.includes(key))) throw new FinanceDomainError("UNKNOWN_FIELD"); return object; });
}
const run = (handler: (context: Context<FinanceEnv>) => Promise<unknown>) => async (context: Context<FinanceEnv>) => { try { return context.json(await handler(context)); } catch (error) { return financeErrorResponse(context, error); } };

export function registerReceivableTransactionRoutes(app: Hono<FinanceEnv>, useCases: { registerReceipt: RegisterReceipt; reverseReceipt: ReverseReceipt }): void {
  app.post("/api/finance/payment-plans/:planId/receipts", capabilityMiddleware("RECEIVABLE_REGISTER_PAYMENT"), run(async (c) => {
    const body = await closedJson(c, ["amount", "allocations", "occurredAt"]);
    if (body.occurredAt !== undefined) throw new FinanceDomainError("CLIENT_OCCURRENCE_TIMESTAMP_FORBIDDEN");
    const allocations: ReceiptAllocationInput[] = objectArray(body, "allocations", ["installmentId", "amount"]).map((item) => ({ installmentId: stringField(item, "installmentId")!, amount: stringField(item, "amount")! }));
    return useCases.registerReceipt.execute({ actor: c.get("financeActor"), idempotencyKey: idempotencyKey(c), planId: routeParam(c, "planId"), amount: stringField(body, "amount")!, allocations });
  }));
  app.post("/api/finance/financial-transactions/:receiptId/reversals", capabilityMiddleware("RECEIVABLE_REVERSE_PAYMENT"), run(async (c) => {
    const body = await closedJson(c, ["amount", "reason", "allocations", "occurredAt"]);
    if (body.occurredAt !== undefined) throw new FinanceDomainError("CLIENT_OCCURRENCE_TIMESTAMP_FORBIDDEN");
    const allocations: ReversalAllocationInput[] = objectArray(body, "allocations", ["originalAllocationId", "amount"]).map((item) => ({ originalAllocationId: stringField(item, "originalAllocationId")!, amount: stringField(item, "amount")! }));
    return useCases.reverseReceipt.execute({ actor: c.get("financeActor"), idempotencyKey: idempotencyKey(c), receiptId: routeParam(c, "receiptId"), amount: stringField(body, "amount")!, reason: stringField(body, "reason")!, allocations });
  }));
}
