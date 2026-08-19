import { PrismaClient } from "@prisma/client";
import { AuthRepository, AuthUser } from "../domain/authTypes.js";
import { FinanceCapabilities, FinanceCapability } from "../../finance-contract-receivables/application/FinanceCapability.js";

type UserRow = { id: string; name: string; email: string; passwordHash: string; credentialRevokedAt: Date | null };
type SessionRow = { id: string; userId: string; expiresAt: Date; revokedAt: Date | null; name: string; email: string };

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCredentialByEmail(email: string): Promise<{ user: AuthUser; passwordHash: string; credentialRevokedAt: Date | null } | undefined> {
    const rows = await this.prisma.$queryRaw<UserRow[]>`
      SELECT u."id", u."name", u."email", c."passwordHash", c."revokedAt" AS "credentialRevokedAt"
      FROM "User" u JOIN "Credential" c ON c."userId" = u."id"
      WHERE u."email" = ${email} AND u."status" = 'ACTIVE'
      LIMIT 1
    `;
    const row = rows[0];
    return row ? { user: { id: row.id, name: row.name, email: row.email }, passwordHash: row.passwordHash, credentialRevokedAt: row.credentialRevokedAt } : undefined;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<{ id: string; expiresAt: Date }> {
    const rows = await this.prisma.$queryRaw<{ id: string; expiresAt: Date }[]>`
      INSERT INTO "Session" ("userId", "tokenHash", "expiresAt")
      VALUES (${userId}::uuid, ${tokenHash}, ${expiresAt})
      RETURNING "id", "expiresAt"
    `;
    const row = rows[0];
    if (!row) throw new Error("SESSION_CREATE_FAILED");
    return row;
  }

  async findSession(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null; user: AuthUser } | undefined> {
    const rows = await this.prisma.$queryRaw<SessionRow[]>`
      SELECT s."id", s."userId", s."expiresAt", s."revokedAt", u."name", u."email"
      FROM "Session" s JOIN "User" u ON u."id" = s."userId"
      WHERE s."tokenHash" = ${tokenHash} AND u."status" = 'ACTIVE'
      LIMIT 1
    `;
    const row = rows[0];
    return row ? { id: row.id, userId: row.userId, expiresAt: row.expiresAt, revokedAt: row.revokedAt, user: { id: row.userId, name: row.name, email: row.email } } : undefined;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.prisma.$executeRaw`UPDATE "Session" SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP) WHERE "tokenHash" = ${tokenHash}`;
  }

  async listCapabilities(userId: string, now: Date): Promise<ReadonlySet<FinanceCapability>> {
    const rows = await this.prisma.$queryRaw<{ capabilityCode: string }[]>`
      SELECT "capabilityCode" FROM "PlatformPrivilege"
      WHERE "userId" = ${userId}::uuid AND "domain" = 'finance'
        AND "revokedAt" IS NULL AND ("expiresAt" IS NULL OR "expiresAt" > ${now})
    `;
    const allowed = new Set<string>(FinanceCapabilities);
    return new Set(rows.map((row) => row.capabilityCode).filter((code): code is FinanceCapability => allowed.has(code)));
  }
}
