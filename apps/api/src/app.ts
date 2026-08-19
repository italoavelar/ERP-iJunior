import { Hono } from "hono";
import { FinanceEnv } from "./modules/finance-contract-receivables/http/financeCommandMiddleware.js";
import { FinanceRouteDependencies, registerFinanceRoutes } from "./modules/finance-contract-receivables/http/financeRoutes.js";
import { AuthService } from "./modules/platform-auth-shell/application/AuthService.js";
import { registerAuthRoutes } from "./modules/platform-auth-shell/http/authRoutes.js";
import { financeObservability } from "./modules/finance-contract-receivables/http/financeObservability.js";
import { PortfolioRouteDependencies, registerPortfolioRoutes } from "./modules/portfolio/http/portfolioRoutes.js";

/**
 * Registers the application modules at the HTTP boundary.
 *
 * Future verticals register their routes here; HTTP handlers remain adapters
 * that delegate to application use cases rather than owning domain behavior.
 */
export function registerApiModules(app: Hono<FinanceEnv>, finance?: FinanceRouteDependencies, auth?: AuthService, portfolio?: PortfolioRouteDependencies): void {
  app.use("*", financeObservability());
  app.get("/health", (context) => context.json({ status: "ok" }));
  if (auth) registerAuthRoutes(app, auth);
  if (finance) registerFinanceRoutes(app, finance);
  if (portfolio) registerPortfolioRoutes(app, portfolio);
}

/** Creates a fresh Hono application suitable for both runtime and API tests. */
export function createApp(finance?: FinanceRouteDependencies, auth?: AuthService, portfolio?: PortfolioRouteDependencies): Hono<FinanceEnv> {
  const app = new Hono<FinanceEnv>();

  app.onError((error, context) => {
    const requestId = context.get("requestId") ?? "unavailable";
    context.set("domainErrorCode", "INTERNAL_ERROR");
    console.error(JSON.stringify({ event: "http.error", requestId, route: new URL(context.req.url).pathname, errorType: error instanceof Error ? error.name : typeof error }));
    return context.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error.", requestId } }, 500);
  });

  registerApiModules(app, finance, auth, portfolio);

  return app;
}
