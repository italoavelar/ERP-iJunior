import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/foundation/**/*.api.test.ts",
      "apps/api/src/**/*.api.test.ts"
    ]
  }
});
