import { Hono } from "hono";
import { AuthService, InvalidCredentialsError } from "../application/AuthService.js";
import { clearSessionCookie, readSessionCookie, sessionCookie } from "./cookies.js";
import { originProtection } from "./csrf.js";
import { FinanceEnv } from "../../finance-contract-receivables/http/financeCommandMiddleware.js";

export interface AuthRouteOptions { secureCookies?: boolean }

function safeUser(principal: { id: string; name: string; email: string; capabilities: ReadonlySet<string> }) {
  return { id: principal.id, name: principal.name, email: principal.email, capabilities: [...principal.capabilities].sort() };
}

async function closedLoginBody(request: Request): Promise<{ email: string; password: string }> {
  let value: unknown;
  try { value = await request.json(); } catch { throw new InvalidCredentialsError("INVALID_CREDENTIALS"); }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidCredentialsError("INVALID_CREDENTIALS");
  const object = value as Record<string, unknown>;
  if (Object.keys(object).some((key) => key !== "email" && key !== "password") || typeof object.email !== "string" || typeof object.password !== "string") throw new InvalidCredentialsError("INVALID_CREDENTIALS");
  return { email: object.email, password: object.password };
}

export function registerAuthRoutes(app: Hono<FinanceEnv>, service: AuthService, options: AuthRouteOptions = {}): void {
  const secureCookies = options.secureCookies ?? process.env.NODE_ENV === "production";
  app.use("/auth/*", originProtection());

  app.post("/auth/login", async (context) => {
    try {
      const body = await closedLoginBody(context.req.raw);
      const result = await service.login(body.email, body.password);
      context.header("Set-Cookie", sessionCookie(result.token, result.expiresAt, secureCookies));
      return context.json({ user: safeUser(result.principal) }, 200);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) return context.json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } }, 401);
      throw error;
    }
  });

  app.get("/auth/me", async (context) => {
    const principal = await service.resolve(readSessionCookie(context.req.raw));
    if (!principal) return context.json({ error: { code: "UNAUTHENTICATED", message: "Authentication is required." } }, 401);
    return context.json({ user: safeUser(principal) }, 200);
  });

  app.post("/auth/logout", async (context) => {
    await service.logout(readSessionCookie(context.req.raw));
    context.header("Set-Cookie", clearSessionCookie(secureCookies));
    return context.body(null, 204);
  });
}
