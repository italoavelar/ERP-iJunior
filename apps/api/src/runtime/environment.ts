type Environment = NodeJS.ProcessEnv;

function required(environment: Environment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required to start the API runtime`);
  return value;
}

function validateDatabaseUrl(value: string, name: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL`);
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(`${name} must use the PostgreSQL protocol`);
  }
}

export function validateWebOrigins(value: string, production: boolean): void {
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length) throw new Error("WEB_ORIGINS must contain at least one explicit origin");

  for (const origin of origins) {
    if (origin.includes("*")) throw new Error("WEB_ORIGINS must not contain wildcard origins");
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("WEB_ORIGINS must contain valid origins");
    }
    if (parsed.origin !== origin || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
      throw new Error("WEB_ORIGINS entries must be origin-only URLs");
    }
    if (production && parsed.protocol !== "https:") throw new Error("WEB_ORIGINS must use HTTPS in production");
  }
}

/** Validates startup configuration without connecting to PostgreSQL. */
export function validateRuntimeEnvironment(environment: Environment = process.env): void {
  validateDatabaseUrl(required(environment, "DATABASE_URL"), "DATABASE_URL");

  if (environment.NODE_ENV !== "production") return;

  validateWebOrigins(required(environment, "WEB_ORIGINS"), true);
  if (environment.CONTRACT_REFERENCE_ADAPTER !== "prisma") {
    throw new Error("CONTRACT_REFERENCE_ADAPTER=prisma is required in production");
  }
}
