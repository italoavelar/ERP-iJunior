import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: [
    { command: "npx tsx scripts/e2e-api.ts", url: "http://127.0.0.1:8787/health", reuseExistingServer: false, timeout: 180_000 },
    { command: "npm run dev --workspace=@ijunior/web -- --host 127.0.0.1 --port 4173", url: "http://127.0.0.1:4173/login", reuseExistingServer: false, timeout: 120_000, env: { VITE_API_PROXY_TARGET: "http://127.0.0.1:8787" } }
  ]
});
