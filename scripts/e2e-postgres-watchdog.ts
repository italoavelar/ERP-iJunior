import { access, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const dataDir = process.argv[2];
const parentPid = Number.parseInt(process.argv[3] ?? "", 10);
const pgCtl = "/usr/lib/postgresql/12/bin/pg_ctl";

if (!dataDir || !Number.isInteger(parentPid)) process.exit(0);

const parentAlive = () => {
  try {
    process.kill(parentPid, 0);
    return true;
  } catch {
    return false;
  }
};

const done = async () => {
  try {
    await access(`${dataDir}/.e2e-done`);
    return true;
  } catch {
    return false;
  }
};

while (parentAlive() && !(await done())) await new Promise((resolve) => setTimeout(resolve, 500));
if (!(await done())) spawnSync(pgCtl, ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
await rm(dataDir, { recursive: true, force: true });
