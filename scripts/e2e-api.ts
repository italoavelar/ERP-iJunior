import { createServer } from "node:net";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const postgresBin = "/usr/lib/postgresql/12/bin";
const apiPort = 8787;
const { startRuntime } = await import(join(root, "apps/api/src/server.ts"));

function run(command: string, args: readonly string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, [...args], { cwd: root, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited ${code}`)));
  });
}

async function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("unable to allocate postgres port"));
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

const dataDir = await mkdtemp(join(tmpdir(), "ijunior-e2e-postgres-"));
const postgresPort = await freePort();
const watchdog = spawn(process.execPath, [join(root, "scripts/e2e-postgres-watchdog.ts"), dataDir, String(process.pid)], { detached: true, stdio: "ignore" });
watchdog.unref();
const databaseUser = process.env.USER ?? process.env.LOGNAME ?? "postgres";
const databaseUrl = `postgresql://${encodeURIComponent(databaseUser)}@127.0.0.1:${postgresPort}/ijunior_e2e?schema=public`;
const environment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DATABASE_URL_TEST: databaseUrl,
  NODE_ENV: "development",
  WEB_ORIGINS: "http://127.0.0.1:4173,http://localhost:4173",
  PORT: String(apiPort),
  DEV_MANAGER_EMAIL: "manager.e2e@example.com",
  DEV_MANAGER_PASSWORD: "manager-e2e-password",
  DEV_VP_EMAIL: "vp.e2e@example.com",
  DEV_VP_PASSWORD: "vp-e2e-password",
  DEV_NO_FINANCE_EMAIL: "no-finance.e2e@example.com",
  DEV_NO_FINANCE_PASSWORD: "no-finance-e2e-password",
  DEV_PLATFORM_ADMIN_EMAIL: "admin.e2e@example.com",
  DEV_PLATFORM_ADMIN_PASSWORD: "admin-e2e-password",
  DEV_CONTRACT_ID: "e2e-contract-manager",
  DEV_CLIENT_ID: "e2e-client-manager",
  DEV_CONTRACT_CENTS: "100000"
};
Object.assign(process.env, environment);
let apiRuntime: ReturnType<typeof startRuntime> | undefined;
let stopping = false;

async function cleanup(): Promise<void> {
  if (stopping) return;
  stopping = true;
  await import("node:fs/promises").then(({ writeFile }) => writeFile(join(dataDir, ".e2e-done"), "done\n").catch(() => undefined));
  apiRuntime?.server.close();
  await apiRuntime?.prisma.$disconnect();
  spawnSync(join(postgresBin, "pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
  await rm(dataDir, { recursive: true, force: true });
}

const handleSignal = () => { void cleanup().finally(() => process.exit(0)); };
process.once("SIGINT", handleSignal);
process.once("SIGTERM", handleSignal);

try {
  await run(join(postgresBin, "initdb"), ["-D", dataDir, "--auth=trust", "--no-locale", "-E", "UTF8"], environment);
  await run(join(postgresBin, "pg_ctl"), ["-D", dataDir, "-l", join(dataDir, "postgres.log"), "-o", `-p ${postgresPort} -h 127.0.0.1 -k ${dataDir}`, "-w", "start"], environment);
  await run(join(postgresBin, "createdb"), ["-h", "127.0.0.1", "-p", String(postgresPort), "-U", databaseUser, "ijunior_e2e"], environment);
  const migrationRoot = join(root, "prisma", "migrations");
  const migrations = (await readdir(migrationRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  for (const migration of migrations) await run("psql", [databaseUrl.split("?")[0]!, "-v", "ON_ERROR_STOP=1", "-f", join(migrationRoot, migration, "migration.sql")], environment);
  await run("npx", ["tsx", "scripts/seed-dev.ts"], environment);
  apiRuntime = startRuntime(apiPort);
  console.log(`iJúnior E2E API listening on http://127.0.0.1:${apiPort}`);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/health`);
      if (response.ok) break;
    } catch {
      // The API is still booting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    if (attempt === 59) throw new Error("API did not become healthy for E2E");
  }
  await new Promise<void>((resolveWait) => {
    const keepAlive = setInterval(() => {
      if (stopping) {
        clearInterval(keepAlive);
        resolveWait();
      }
    }, 250);
  });
} finally {
  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  await cleanup();
}
