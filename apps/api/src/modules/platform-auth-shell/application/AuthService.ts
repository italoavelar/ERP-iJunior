import { AuthRepository, AuthenticatedPrincipal, CredentialHasher, SESSION_TTL_MS } from "../domain/authTypes.js";
import { createSessionToken, hashSessionToken, isSessionValid, normalizeEmail, sessionExpiry } from "../domain/authPrimitives.js";

export class InvalidCredentialsError extends Error { override name = "InvalidCredentialsError"; }

export class AuthService {
  constructor(private readonly repository: AuthRepository, private readonly hasher: CredentialHasher) {}

  async login(emailInput: string, password: string): Promise<{ principal: AuthenticatedPrincipal; token: string; expiresAt: Date }> {
    const email = normalizeEmail(emailInput);
    const credential = await this.repository.findCredentialByEmail(email);
    const valid = credential ? await this.hasher.verify(credential.passwordHash, password) : false;
    if (!credential || credential.credentialRevokedAt || !valid) throw new InvalidCredentialsError("INVALID_CREDENTIALS");
    const token = createSessionToken();
    const expiresAt = sessionExpiry();
    const session = await this.repository.createSession(credential.user.id, hashSessionToken(token), expiresAt);
    const capabilities = await this.repository.listCapabilities(credential.user.id, new Date());
    return { principal: { ...credential.user, sessionId: session.id, capabilities }, token, expiresAt: new Date(session.expiresAt.getTime() || expiresAt.getTime()) };
  }

  async resolve(token: string | undefined): Promise<AuthenticatedPrincipal | undefined> {
    if (!token) return undefined;
    const session = await this.repository.findSession(hashSessionToken(token));
    if (!session || !isSessionValid(session.expiresAt, session.revokedAt)) return undefined;
    return { ...session.user, sessionId: session.id, capabilities: await this.repository.listCapabilities(session.userId, new Date()) };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.repository.revokeSession(hashSessionToken(token));
  }

  static readonly sessionTtlMs = SESSION_TTL_MS;
}
