import { SESSION_COOKIE } from "../domain/authTypes.js";

export function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

export function sessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  const attributes = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, "HttpOnly", "SameSite=Lax", "Path=/", `Expires=${expiresAt.toUTCString()}`, "Max-Age=28800"];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  const attributes = [`${SESSION_COOKIE}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Max-Age=0"];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}
