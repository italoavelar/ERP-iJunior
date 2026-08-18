import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/foundation/**/*.web.test.ts",
      "apps/web/src/features/finance-contract-receivables/**/__tests__/*.test.tsx"
    ]
  }
});
