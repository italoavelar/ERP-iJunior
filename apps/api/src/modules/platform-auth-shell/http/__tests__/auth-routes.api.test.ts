import { describe, expect, it } from "vitest";
import { createApp } from "../../../../app.js";
import { AuthService } from "../../application/AuthService.js";
import { AuthRepository, CredentialHasher } from "../../domain/authTypes.js";

const user = { id: "user-1", name: "Finance Manager", email: "manager@example.com" };
class Hasher implements CredentialHasher {
  async hash(password: string): Promise<string> { return `hash:${password}`; }
  async verify(hash: string, password: string): Promise<boolean> { return hash === `hash:${password}`; }
}
class Repository implements AuthRepository {
  sessions = new Map<string, { id: string; userId: string; expiresAt: Date; revokedAt: Date | null }>();
  async findCredentialByEmail(email: string) { return email === user.email ? { user, passwordHash: "hash:secret", credentialRevokedAt: null } : undefined; }
  async createSession(userId: string, tokenHash: string, expiresAt: Date) { const item = { id: "session-1", userId, expiresAt, revokedAt: null }; this.sessions.set(tokenHash, item); return item; }
  async findSession(tokenHash: string) { const item = this.sessions.get(tokenHash); return item ? { ...item, user } : undefined; }
  async revokeSession(tokenHash: string) { const item = this.sessions.get(tokenHash); if (item) item.revokedAt = new Date(); }
  async listCapabilities() { return new Set(["FINANCE_READ"] as const); }
}

describe("auth Hono routes", () => {
  it("sets a secure boundary cookie and exposes a safe /auth/me projection", async () => {
    const service = new AuthService(new Repository(), new Hasher());
    const app = createApp(undefined, service);
    const login = await app.request("http://localhost/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: "secret" }) });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie");
    expect(cookie).toContain("ijunior_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    const me = await app.request("http://localhost/auth/me", { headers: { Cookie: cookie?.split(";")[0] ?? "" } });
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ user: { id: user.id, name: user.name, email: user.email, capabilities: ["FINANCE_READ"] } });
  });

  it("rejects invalid credentials and unknown DTO fields without revealing account state", async () => {
    const app = createApp(undefined, new AuthService(new Repository(), new Hasher()));
    const invalid = await app.request("http://localhost/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: "wrong" }) });
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toEqual({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } });
    const extra = await app.request("http://localhost/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: "secret", role: "PLATFORM_ADMIN" }) });
    expect(extra.status).toBe(401);
    expect(await extra.json()).toEqual({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } });
  });

  it("rejects untrusted mutation origins and makes logout idempotent", async () => {
    const repository = new Repository();
    const app = createApp(undefined, new AuthService(repository, new Hasher()));
    const blocked = await app.request("http://localhost/auth/logout", { method: "POST", headers: { Origin: "https://evil.example" } });
    expect(blocked.status).toBe(403);
    const logout = await app.request("http://localhost/auth/logout", { method: "POST" });
    expect(logout.status).toBe(204);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    expect((await app.request("http://localhost/auth/me")).status).toBe(401);
  });
});
