import { Hono } from "hono";
import { FinanceEnv } from "./modules/finance-contract-receivables/http/financeCommandMiddleware.js";
import { FinanceRouteDependencies, registerFinanceRoutes } from "./modules/finance-contract-receivables/http/financeRoutes.js";
import { AuthService } from "./modules/platform-auth-shell/application/AuthService.js";
import { registerAuthRoutes } from "./modules/platform-auth-shell/http/authRoutes.js";

/**
 * Registers the application modules at the HTTP boundary.
 *
 * Future verticals register their routes here; HTTP handlers remain adapters
 * that delegate to application use cases rather than owning domain behavior.
 */
export function registerApiModules(app: Hono<FinanceEnv>, finance?: FinanceRouteDependencies, auth?: AuthService): void {
  app.get("/health", (context) => context.json({ status: "ok" }));
  if (auth) registerAuthRoutes(app, auth);
  if (finance) registerFinanceRoutes(app, finance);
}

/** Creates a fresh Hono application suitable for both runtime and API tests. */
export function createApp(finance?: FinanceRouteDependencies, auth?: AuthService): Hono<FinanceEnv> {
  const app = new Hono<FinanceEnv>();

  registerApiModules(app, finance, auth);

  return app;
}
