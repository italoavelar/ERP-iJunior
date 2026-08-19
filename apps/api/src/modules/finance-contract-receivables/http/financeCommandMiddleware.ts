import { Context, MiddlewareHandler } from "hono";
import { AuthenticatedCommandContext, FinanceCapability } from "../application/FinanceCapability.js";
import { FinanceDomainError } from "../application/FinanceDomainError.js";

export type FinanceEnv = { Variables: { financeActor: AuthenticatedCommandContext; requestId: string; domainErrorCode: string | undefined } };
export type FinanceAuthenticator = (request: Request) => Promise<AuthenticatedCommandContext | undefined>;

export function authenticationMiddleware(authenticate: FinanceAuthenticator): MiddlewareHandler<FinanceEnv> {
  return async (context, next) => { const actor = await authenticate(context.req.raw); if (!actor) return context.json({ error: { code: "UNAUTHENTICATED", message: "Authentication is required." } }, 401); context.set("financeActor", actor); await next(); };
}
export function capabilityMiddleware(capability: FinanceCapability): MiddlewareHandler<FinanceEnv> {
  return async (context, next) => { if (!context.get("financeActor").capabilities.has(capability)) return context.json({ error: { code: "CAPABILITY_MISSING", message: "The actor lacks the required finance capability." } }, 403); await next(); };
}
export function idempotencyKey(context: Context): string {
  const key = context.req.header("Idempotency-Key");
  if (!key || key.length < 16 || key.length > 128 || !/^[\x21-\x7e]+$/.test(key)) throw new FinanceDomainError("INVALID_IDEMPOTENCY_KEY");
  return key;
}
export async function closedJson(context: Context, allowed: readonly string[]): Promise<Record<string, unknown>> {
  let value: unknown; try { value = await context.req.json(); } catch { throw new FinanceDomainError("INVALID_REQUEST"); }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new FinanceDomainError("INVALID_REQUEST");
  const object = value as Record<string, unknown>;
  if (Object.keys(object).some((key) => !allowed.includes(key))) throw new FinanceDomainError("UNKNOWN_FIELD");
  return object;
}
export async function closedEmptyBody(context: Context): Promise<void> {
  const text = await context.req.text();
  if (text.trim().length === 0) return;
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new FinanceDomainError("INVALID_REQUEST"); }
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length > 0) throw new FinanceDomainError("UNKNOWN_FIELD");
}
export function stringField(body: Record<string, unknown>, name: string, required = true): string | undefined { const value = body[name]; if (value === undefined && !required) return undefined; if (typeof value !== "string") throw new FinanceDomainError(name.toLowerCase().includes("amount") ? "INVALID_MONEY" : "INVALID_REQUEST"); return value; }
export function stringArrayField(body: Record<string, unknown>, name: string): string[] { const value = body[name]; if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new FinanceDomainError("INVALID_REQUEST"); return value; }
export function routeParam(context: Context, name: string): string { const value = context.req.param(name); if (!value) throw new FinanceDomainError("INVALID_REQUEST"); return value; }
