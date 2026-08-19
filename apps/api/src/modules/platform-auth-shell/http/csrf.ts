import { MiddlewareHandler } from "hono";

function configuredOrigins(): ReadonlySet<string> {
  const configured = process.env.WEB_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === "production" && !configured?.length) {
    throw new Error("WEB_ORIGINS must explicitly allow production same-origin mutations");
  }
  return new Set(configured?.length ? configured : ["http://localhost:5173", "http://127.0.0.1:5173"]);
}

export function originProtection(): MiddlewareHandler {
  return async (context, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(context.req.method)) return next();
    const origin = context.req.header("Origin");
    if (origin && !configuredOrigins().has(origin)) return context.json({ error: { code: "CSRF_ORIGIN_REJECTED", message: "Origin is not allowed." } }, 403);
    await next();
  };
}
