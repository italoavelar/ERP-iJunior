import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, isSessionValid, normalizeEmail, sessionExpiry } from "../authPrimitives.js";

describe("platform auth primitives", () => {
  it("normalizes email without changing the canonical local identity", () => {
    expect(normalizeEmail("  Manager@Example.COM ")).toBe("manager@example.com");
  });

  it("generates opaque tokens and persists only deterministic hashes", () => {
    const token = createSessionToken();
    expect(token).not.toHaveLength(0);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).not.toBe(token);
  });

  it("uses an absolute eight hour expiry and rejects expired or revoked sessions", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    expect(sessionExpiry(now).toISOString()).toBe("2026-08-18T20:00:00.000Z");
    expect(isSessionValid(sessionExpiry(now), null, now)).toBe(true);
    expect(isSessionValid(new Date("2026-08-18T11:59:59.000Z"), null, now)).toBe(false);
    expect(isSessionValid(sessionExpiry(now), new Date("2026-08-18T13:00:00.000Z"), now)).toBe(false);
  });
});
