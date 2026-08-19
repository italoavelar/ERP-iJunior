import { createHash, randomBytes } from "node:crypto";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

export function isSessionValid(expiresAt: Date, revokedAt: Date | null, now = new Date()): boolean {
  return revokedAt === null && expiresAt.getTime() > now.getTime();
}
