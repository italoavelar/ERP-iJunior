import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../../app.js";
import { financeObservability, requestIdFrom, FinanceRequestLog } from "../financeObservability.js";

describe("finance request observability", () => {
  it("normalizes trusted request ids and emits safe structured fields", async () => {
    const entries: FinanceRequestLog[] = [];
    const app = new Hono();
    app.use("*", financeObservability({ logger: (entry) => entries.push(entry) }));
    app.get("/health", (context) => context.json({ status: "ok" }));
    const response = await app.request("http://localhost/health", { headers: { "X-Request-ID": "client.request-01" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Request-ID")).toBe("client.request-01");
    expect(entries[0]).toMatchObject({ event: "http.request", requestId: "client.request-01", method: "GET", route: "/health", status: 200 });
    expect(entries[0]).not.toHaveProperty("body");
  });

  it("replaces untrusted request ids with a server-generated uuid", () => {
    const request = new Request("http://localhost/", { headers: { "X-Request-ID": "password=secret" } });
    expect(requestIdFrom(request)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("maps unexpected failures to a generic response with correlation", async () => {
    const app = createApp();
    app.get("/boom", () => { throw new Error("database password=secret"); });
    const response = await app.request("http://localhost/boom", { headers: { "X-Request-ID": "safe-correlation" } });
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(response.headers.get("X-Request-ID")).toBe("safe-correlation");
    expect(text).toContain('"code":"INTERNAL_ERROR"');
    expect(text).not.toMatch(/database|password|secret|Prisma|SQLSTATE/i);
  });
});
