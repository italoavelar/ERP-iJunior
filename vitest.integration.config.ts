import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/foundation/**/*.integration.test.ts",
      "apps/api/src/modules/finance-contract-receivables/**/__tests__/*.integration.test.ts",
      "apps/api/src/modules/finance-contract-receivables/**/__tests__/*.postgres.test.ts"
    ]
  }
});
