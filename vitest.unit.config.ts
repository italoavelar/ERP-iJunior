import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/foundation/**/*.unit.test.ts",
      "apps/api/src/modules/finance-contract-receivables/**/__tests__/*.unit.test.ts"
    ]
  }
});
