import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: [
      "apps/web/src/**/*.web.test.tsx"
    ]
  }
});
