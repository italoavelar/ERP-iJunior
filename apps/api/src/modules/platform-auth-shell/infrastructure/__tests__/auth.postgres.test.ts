import { PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { AuthService } from "../../application/AuthService.js";
import { Argon2CredentialHasher } from "../Argon2CredentialHasher.js";
import { PrismaAuthRepository } from "../PrismaAuthRepository.js";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error("DATABASE_URL_TEST required");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const hasher = new Argon2CredentialHasher();
afterAll(() => prisma.$disconnect());

describe("platform auth PostgreSQL persistence", () => {
  it("persists only a session hash and rejects a revoked session", async () => {
    const userId = crypto.randomUUID();
    await prisma.$executeRaw`INSERT INTO "User" ("id", "name", "email") VALUES (${userId}::uuid, 'Auth Test', ${`${userId}@example.com`})`;
    const passwordHash = await hasher.hash("secret");
    await prisma.$executeRaw`INSERT INTO "Credential" ("userId", "passwordHash") VALUES (${userId}::uuid, ${passwordHash})`;
    const service = new AuthService(new PrismaAuthRepository(prisma), hasher);
    const result = await service.login(`${userId}@example.com`, "secret");
    const rows = await prisma.$queryRaw<{ tokenHash: string; expiresAt: Date; revokedAt: Date | null }[]>`SELECT "tokenHash", "expiresAt", "revokedAt" FROM "Session" WHERE "id" = ${result.principal.sessionId}::uuid`;
    expect(rows[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0]?.tokenHash).not.toBe(result.token);
    expect(rows[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    await service.logout(result.token);
    expect(await service.resolve(result.token)).toBeUndefined();
    expect((await prisma.$queryRaw<{ revokedAt: Date | null }[]>`SELECT "revokedAt" FROM "Session" WHERE "id" = ${result.principal.sessionId}::uuid`)[0]?.revokedAt).toBeInstanceOf(Date);
  });

  it("resolves only active, unrevoked finance privileges", async () => {
    const userId = crypto.randomUUID();
    await prisma.$executeRaw`INSERT INTO "User" ("id", "name", "email") VALUES (${userId}::uuid, 'Privilege Test', ${`${userId}@example.com`})`;
    await prisma.$executeRaw`INSERT INTO "PlatformPrivilege" ("userId", "capabilityCode", "domain") VALUES (${userId}::uuid, 'FINANCE_READ', 'finance')`;
    await prisma.$executeRaw`INSERT INTO "PlatformPrivilege" ("userId", "capabilityCode", "domain", "revokedAt") VALUES (${userId}::uuid, 'PAYMENT_PLAN_CREATE', 'finance', CURRENT_TIMESTAMP)`;
    const capabilities = await new PrismaAuthRepository(prisma).listCapabilities(userId, new Date());
    expect(capabilities.has("FINANCE_READ")).toBe(true);
    expect(capabilities.has("PAYMENT_PLAN_CREATE")).toBe(false);
    expect(capabilities.has("RECEIVABLE_REVERSE_PAYMENT")).toBe(false);
  });
});
