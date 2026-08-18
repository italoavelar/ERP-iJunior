import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("foundation environment", () => {
  it("documents separate empty local and test database variables", () => {
    const environmentExample = readFileSync(resolve(repositoryRoot, ".env.example"), "utf8");

    expect(environmentExample).toContain("DATABASE_URL=\n");
    expect(environmentExample).toContain("DATABASE_URL_TEST=\n");
    expect(environmentExample).not.toMatch(/DATABASE_URL(?:_TEST)?=\S+/);
  });

  it("keeps planned API, web and Prisma boundaries present", () => {
    expect(existsSync(resolve(repositoryRoot, "apps/api/package.json"))).toBe(true);
    expect(existsSync(resolve(repositoryRoot, "apps/web/package.json"))).toBe(true);
    expect(existsSync(resolve(repositoryRoot, "prisma/.gitkeep"))).toBe(true);
  });
});
