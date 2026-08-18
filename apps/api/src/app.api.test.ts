import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("API application boundary", () => {
  it("instantiates an isolated Hono application", () => {
    expect(createApp()).toBeDefined();
  });

  it("exposes only the foundation health route", async () => {
    const response = await createApp().request("http://localhost/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
