import { Hono } from "hono";

/**
 * Registers the application modules at the HTTP boundary.
 *
 * Future verticals register their routes here; HTTP handlers remain adapters
 * that delegate to application use cases rather than owning domain behavior.
 */
export function registerApiModules(app: Hono): void {
  app.get("/health", (context) => context.json({ status: "ok" }));
}

/** Creates a fresh Hono application suitable for both runtime and API tests. */
export function createApp(): Hono {
  const app = new Hono();

  registerApiModules(app);

  return app;
}
