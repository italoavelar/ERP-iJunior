import { Hono } from "hono";
import { FinanceEnv } from "./modules/finance-contract-receivables/http/financeCommandMiddleware.js";
import { FinanceRouteDependencies, registerFinanceRoutes } from "./modules/finance-contract-receivables/http/financeRoutes.js";

/**
 * Registers the application modules at the HTTP boundary.
 *
 * Future verticals register their routes here; HTTP handlers remain adapters
 * that delegate to application use cases rather than owning domain behavior.
 */
export function registerApiModules(app: Hono<FinanceEnv>, finance?: FinanceRouteDependencies): void {
  app.get("/health", (context) => context.json({ status: "ok" }));
  if (finance) registerFinanceRoutes(app, finance);
}

/** Creates a fresh Hono application suitable for both runtime and API tests. */
export function createApp(finance?: FinanceRouteDependencies): Hono<FinanceEnv> {
  const app = new Hono<FinanceEnv>();

  registerApiModules(app, finance);

  return app;
}
