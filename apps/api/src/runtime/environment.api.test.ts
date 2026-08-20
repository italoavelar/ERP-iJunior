import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment, validateWebOrigins } from "./environment.js";

describe("runtime environment validation", () => {
  it("requires the production database, explicit HTTPS origin, and persisted contract adapter", () => {
    expect(() => validateRuntimeEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://app:secret@db.example.test:5432/erp",
      WEB_ORIGINS: "https://erp.example.test",
      CONTRACT_REFERENCE_ADAPTER: "prisma"
    })).not.toThrow();
  });

  it("fails closed for missing production configuration", () => {
    expect(() => validateRuntimeEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgresql://app:secret@db.example.test:5432/erp" })).toThrow("WEB_ORIGINS");
    expect(() => validateRuntimeEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgresql://app:secret@db.example.test:5432/erp", WEB_ORIGINS: "https://erp.example.test" })).toThrow("CONTRACT_REFERENCE_ADAPTER");
  });

  it("rejects permissive and malformed origin allowlists", () => {
    expect(() => validateWebOrigins("https://*.vercel.app", true)).toThrow("wildcard");
    expect(() => validateWebOrigins("http://erp.example.test", true)).toThrow("HTTPS");
    expect(() => validateWebOrigins("https://erp.example.test/path", true)).toThrow("origin-only");
  });
});
