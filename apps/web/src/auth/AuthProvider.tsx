import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HttpError, httpRequest } from "../lib/httpClient.js";

export interface AuthUser { readonly id: string; readonly name: string; readonly email: string; readonly capabilities: readonly string[]; }
type AuthState = { status: "loading"; user: null } | { status: "authenticated"; user: AuthUser } | { status: "unauthenticated"; user: null };
type AuthContextValue = AuthState & { login(email: string, password: string): Promise<void>; logout(): Promise<void>; refresh(): Promise<void>; hasCapability(capability: string): boolean };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
  const refresh = useCallback(async () => {
    try { const result = await httpRequest<{ user: AuthUser }>("/auth/me"); setState(result?.user ? { status: "authenticated", user: result.user } : { status: "unauthenticated", user: null }); }
    catch (error) { if (error instanceof HttpError && error.status === 401) setState({ status: "unauthenticated", user: null }); else setState({ status: "unauthenticated", user: null }); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const login = useCallback(async (email: string, password: string) => { const result = await httpRequest<{ user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if (!result?.user) throw new Error("LOGIN_RESPONSE_INVALID"); setState({ status: "authenticated", user: result.user }); }, []);
  const logout = useCallback(async () => { await httpRequest("/auth/logout", { method: "POST" }); setState({ status: "unauthenticated", user: null }); }, []);
  const value = useMemo(() => ({ ...state, login, logout, refresh, hasCapability: (capability: string) => state.user?.capabilities.includes(capability) ?? false }), [state, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
