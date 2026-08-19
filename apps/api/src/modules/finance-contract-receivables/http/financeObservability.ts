import { randomUUID } from "node:crypto";
import { MiddlewareHandler } from "hono";
import { FinanceEnv } from "./financeCommandMiddleware.js";

export interface FinanceRequestLog {
  readonly event: "http.request";
  readonly requestId: string;
  readonly method: string;
  readonly route: string;
  readonly status: number;
  readonly durationMs: number;
  readonly actorUserId?: string | undefined;
  readonly domainErrorCode?: string | undefined;
}

export type FinanceRequestLogger = (entry: FinanceRequestLog) => void;

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

export function requestIdFrom(request: Request): string {
  const supplied = request.headers.get("X-Request-ID")?.trim();
  return supplied && requestIdPattern.test(supplied) ? supplied : randomUUID();
}

export function structuredFinanceLogger(entry: FinanceRequestLog): void {
  console.info(JSON.stringify(entry));
}

export function financeObservability(options: { readonly logger?: FinanceRequestLogger } = {}): MiddlewareHandler<FinanceEnv> {
  const logger = options.logger ?? structuredFinanceLogger;
  return async (context, next) => {
    const startedAt = performance.now();
    const requestId = requestIdFrom(context.req.raw);
    context.set("requestId", requestId);
    try {
      await next();
    } finally {
      context.header("X-Request-ID", requestId);
      const actor = context.get("financeActor");
      logger({
        event: "http.request",
        requestId,
        method: context.req.method,
        route: new URL(context.req.url).pathname,
        status: context.res.status,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        ...(actor ? { actorUserId: actor.actorUserId } : {}),
        ...(context.get("domainErrorCode") ? { domainErrorCode: context.get("domainErrorCode") } : {})
      });
    }
  };
}
