import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { App } from "./App.js";

describe("web application shell", () => {
  it("is a private ESM React/Vite workspace", () => {
    const testDirectory = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = resolve(testDirectory, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      readonly name: string;
      readonly private: boolean;
      readonly type: string;
    };

    expect(packageJson).toMatchObject({
      name: "@ijunior/web",
      private: true,
      type: "module"
    });
  });

  it("mounts without a backend connection", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(<App />);
    });

    expect(container.querySelector("h1")?.textContent).toBe("ERP iJúnior");
    expect(container.textContent).toContain("Base da aplicação web.");

    act(() => {
      root.unmount();
    });
  });
});
