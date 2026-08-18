import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface WorkspacePackage {
  readonly name: string;
  readonly private: boolean;
  readonly type: string;
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("API workspace boundary", () => {
  it("is a private ESM workspace ready for the API scaffold", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "apps/api/package.json"), "utf8")
    ) as WorkspacePackage;

    expect(packageJson).toEqual({
      name: "@ijunior/api",
      version: "0.0.0",
      private: true,
      type: "module"
    });
  });
});
