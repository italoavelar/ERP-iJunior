import { AuthenticatedCommandContext, FinanceCapability } from "../../finance-contract-receivables/application/FinanceCapability.js";

export const SESSION_COOKIE = "ijunior_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface AuthenticatedPrincipal extends AuthUser {
  readonly sessionId: string;
  readonly capabilities: ReadonlySet<FinanceCapability>;
}

export interface AuthRepository {
  findCredentialByEmail(email: string): Promise<{ user: AuthUser; passwordHash: string; credentialRevokedAt: Date | null } | undefined>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<{ id: string; expiresAt: Date }>;
  findSession(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null; user: AuthUser } | undefined>;
  revokeSession(tokenHash: string): Promise<void>;
  listCapabilities(userId: string, now: Date): Promise<ReadonlySet<FinanceCapability>>;
}

export interface CredentialHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export type AuthenticatedFinanceContext = AuthenticatedCommandContext & { sessionId: string };
