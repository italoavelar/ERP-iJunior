import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["apps/web/src/test/webSetup.ts"],
    pool: "threads",
    maxWorkers: 1,
    include: [
      "apps/web/src/**/*.web.test.tsx"
    ]
  }
});
