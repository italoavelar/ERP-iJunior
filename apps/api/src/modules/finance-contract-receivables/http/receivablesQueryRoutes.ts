import { Context, Hono } from "hono";
import { GetContractReceivables } from "../application/GetContractReceivables.js";
import { GetFinancialAudit } from "../application/GetFinancialAudit.js";
import { FinanceDomainError } from "../application/FinanceDomainError.js";
import { FinanceEnv, capabilityMiddleware, routeParam } from "./financeCommandMiddleware.js";
import { financeErrorResponse } from "./financeErrorMapper.js";

const run = (handler: (context: Context<FinanceEnv>) => Promise<unknown>) => async (context: Context<FinanceEnv>) => { try { return context.json(await handler(context)); } catch (error) { return financeErrorResponse(context, error); } };
export function registerReceivablesQueryRoutes(app: Hono<FinanceEnv>, useCases: { getReceivables: GetContractReceivables; getAudit: GetFinancialAudit }): void {
  app.get("/api/finance/contracts/:contractId/receivables", capabilityMiddleware("FINANCE_READ"), run((c) => useCases.getReceivables.execute(c.get("financeActor").actorUserId, routeParam(c, "contractId"))));
  app.get("/api/finance/contracts/:contractId/receivables/audit", capabilityMiddleware("FINANCIAL_AUDIT_READ"), run((c) => {
    const rawLimit = c.req.query("limit"); const limit = rawLimit === undefined ? undefined : Number(rawLimit);
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) throw new FinanceDomainError("INVALID_REQUEST");
    const cursor = c.req.query("cursor");
    if (cursor && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cursor)) throw new FinanceDomainError("INVALID_REQUEST");
    return useCases.getAudit.execute(c.get("financeActor").actorUserId, routeParam(c, "contractId"), { ...(cursor ? { cursor } : {}), ...(limit === undefined ? {} : { limit }) });
  }));
}
