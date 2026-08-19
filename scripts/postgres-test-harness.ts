import { createServer } from "node:net";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const postgresBin = "/usr/lib/postgresql/12/bin";

function run(command: string, args: readonly string[], env: NodeJS.ProcessEnv = process.env): Promise<void> {
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
      if (typeof address === "string" || address === null) return reject(new Error("unable to allocate test port"));
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

async function withDatabase(command: string): Promise<void> {
  const dataDir = await mkdtemp(join(tmpdir(), "ijunior-postgres-"));
  const port = await freePort();
  const databaseUser = process.env.USER ?? process.env.LOGNAME ?? "postgres";
  const databaseUrl = `postgresql://${encodeURIComponent(databaseUser)}@127.0.0.1:${port}/ijunior_finance_test?schema=public`;
  try {
    await run(join(postgresBin, "initdb"), ["-D", dataDir, "--auth=trust", "--no-locale", "-E", "UTF8"]);
    await run(join(postgresBin, "pg_ctl"), ["-D", dataDir, "-o", `-p ${port} -h 127.0.0.1 -k ${dataDir}`, "-w", "start"]);
    await run(join(postgresBin, "createdb"), ["-h", "127.0.0.1", "-p", String(port), "-U", databaseUser, "ijunior_finance_test"]);
    const env = { ...process.env, DATABASE_URL: databaseUrl, DATABASE_URL_TEST: databaseUrl };
    const migrationRoot = join(root, "prisma", "migrations");
    const migrations = (await readdir(migrationRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const psqlUrl = databaseUrl.split("?")[0] ?? databaseUrl;
    for (const migration of migrations) await run("psql", [psqlUrl, "-v", "ON_ERROR_STOP=1", "-f", join(migrationRoot, migration, "migration.sql")], env);
    if (command === "migrate") return;
    const config = command === "api" ? "vitest.api.config.ts" : "vitest.integration.config.ts";
    await run("npx", ["vitest", "run", "--config", config], env);
  } finally {
    spawnSync(join(postgresBin, "pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
    await rm(dataDir, { recursive: true, force: true });
  }
}

const command = process.argv[2];
if (command !== "migrate" && command !== "test" && command !== "api") throw new Error("expected migrate, test or api");
await withDatabase(command);
