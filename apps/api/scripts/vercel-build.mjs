import { spawnSync } from "node:child_process";

const schema = "../../prisma/schema.prisma";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function required(name) {
  if (!process.env[name]?.trim()) {
    console.error(`${name} is required for a production API build.`);
    process.exit(1);
  }
}

run("npx", ["prisma", "generate", "--schema", schema]);

if (process.env.VERCEL_ENV === "production") {
  required("DATABASE_URL");
  required("DIRECT_URL");
  run("npx", ["prisma", "migrate", "deploy", "--schema", schema]);
} else {
  console.log("Skipping Prisma migrations outside Vercel production.");
}

run("npm", ["run", "build"]);
