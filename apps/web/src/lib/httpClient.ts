export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown) { super(message); this.name = "HttpError"; }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export async function httpRequest<T>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: "include", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  if (response.status === 204) return undefined;
  const text = await response.text();
  let payload: unknown;
  try { payload = text ? JSON.parse(text) : undefined; } catch { payload = undefined; }
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: { code?: string; message?: string } }).error : undefined;
    throw new HttpError(response.status, error?.code ?? "HTTP_ERROR", error?.message ?? "Não foi possível concluir a operação.", payload);
  }
  return payload as T | undefined;
}

export function stableIntentKey(): string {
  return crypto.randomUUID();
}
