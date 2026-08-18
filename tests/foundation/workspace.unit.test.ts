import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface RootPackage {
  readonly workspaces: readonly string[];
  readonly scripts: Readonly<Record<string, string>>;
}

interface TypeScriptConfig {
  readonly compilerOptions: {
    readonly strict: boolean;
    readonly noImplicitAny: boolean;
  };
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readJsonFile<T>(relativePath: string): T {
  const path = resolve(repositoryRoot, relativePath);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

describe("workspace foundation", () => {
  it("declares the planned workspace boundaries and quality commands", () => {
    const packageJson = readJsonFile<RootPackage>("package.json");

    expect(packageJson.workspaces).toEqual(["apps/*"]);
    expect(packageJson.scripts).toMatchObject({
      lint: expect.any(String),
      typecheck: expect.any(String),
      test: expect.any(String),
      "test:unit": expect.any(String),
      "test:integration": expect.any(String),
      "test:api": expect.any(String),
      "test:web": expect.any(String),
      check: expect.any(String)
    });
  });

  it("enforces strict TypeScript without implicit any", () => {
    const tsconfig = readJsonFile<TypeScriptConfig>("tsconfig.json");

    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
  });
});
