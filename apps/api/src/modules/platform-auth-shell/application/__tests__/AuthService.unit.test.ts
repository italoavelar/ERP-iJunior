import { describe, expect, it } from "vitest";
import { AuthService, InvalidCredentialsError } from "../AuthService.js";
import { AuthRepository, CredentialHasher } from "../../domain/authTypes.js";

const user = { id: "user-1", name: "Manager", email: "manager@example.com" };

class FakeHasher implements CredentialHasher {
  async hash(password: string): Promise<string> { return `hash:${password}`; }
  async verify(hash: string, password: string): Promise<boolean> { return hash === `hash:${password}`; }
}

class FakeRepository implements AuthRepository {
  readonly sessions: Array<{ id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null }> = [];
  async findCredentialByEmail(email: string) { return email === user.email ? { user, passwordHash: "hash:secret", credentialRevokedAt: null } : undefined; }
  async createSession(userId: string, tokenHash: string, expiresAt: Date) { const session = { id: "session-1", userId, tokenHash, expiresAt, revokedAt: null }; this.sessions.push(session); return session; }
  async findSession(tokenHash: string) { const session = this.sessions.find((candidate) => candidate.tokenHash === tokenHash); return session ? { ...session, user } : undefined; }
  async revokeSession(tokenHash: string) { const session = this.sessions.find((candidate) => candidate.tokenHash === tokenHash); if (session) session.revokedAt = new Date(); }
  async listCapabilities() { return new Set(["FINANCE_READ"] as const); }
}

describe("AuthService", () => {
  it("creates a session and resolves explicit capabilities", async () => {
    const repository = new FakeRepository();
    const service = new AuthService(repository, new FakeHasher());
    const result = await service.login(" Manager@Example.COM ", "secret");
    expect(result.principal.id).toBe(user.id);
    expect(result.principal.capabilities.has("FINANCE_READ")).toBe(true);
    expect(repository.sessions).toHaveLength(1);
    expect(repository.sessions[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(await service.resolve(result.token)).toMatchObject({ id: user.id, sessionId: "session-1" });
  });

  it("uses a generic failure for unknown or invalid credentials", async () => {
    const service = new AuthService(new FakeRepository(), new FakeHasher());
    await expect(service.login("missing@example.com", "secret")).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(service.login(user.email, "wrong")).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("revokes a session on logout", async () => {
    const repository = new FakeRepository();
    const service = new AuthService(repository, new FakeHasher());
    const result = await service.login(user.email, "secret");
    await service.logout(result.token);
    expect(await service.resolve(result.token)).toBeUndefined();
    expect(repository.sessions[0]?.revokedAt).toBeInstanceOf(Date);
  });

  it("rejects an expired session without sliding its absolute expiry", async () => {
    const repository = new FakeRepository();
    const service = new AuthService(repository, new FakeHasher());
    const result = await service.login(user.email, "secret");
    const session = repository.sessions[0];
    if (!session) throw new Error("session missing");
    session.expiresAt = new Date(Date.now() - 1);
    expect(await service.resolve(result.token)).toBeUndefined();
  });
});
