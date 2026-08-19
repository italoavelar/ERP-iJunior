import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const financePage = readFileSync(new URL("./features/finance-contract-receivables/ContractReceivablesPage.tsx", import.meta.url), "utf8");
const client = readFileSync(new URL("./lib/httpClient.ts", import.meta.url), "utf8");
const source = `${financePage}\n${client}`;

describe("finance web security boundaries", () => {
  it("does not persist session secrets or accept client actor/capability overrides", () => {
    expect(source).not.toMatch(/localStorage\.setItem\(["']token|sessionStorage|password/i);
    expect(source).not.toMatch(/actor(?:Id|UserId)|PlatformPrivilege|capabilities\s*:/);
  });

  it("keeps page components tokenized and exact-decimal", () => {
    expect(financePage).not.toMatch(/#[0-9a-f]{3,8}|\bdark:|Number\(|parseFloat\(|parseInt\(|alert\(|confirm\(/i);
    expect(client).toContain('credentials: "include"');
  });
});
