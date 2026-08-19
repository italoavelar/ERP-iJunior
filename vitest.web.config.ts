import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    pool: "threads",
    maxWorkers: 1,
    include: [
      "apps/web/src/**/*.web.test.tsx"
    ]
  }
});
