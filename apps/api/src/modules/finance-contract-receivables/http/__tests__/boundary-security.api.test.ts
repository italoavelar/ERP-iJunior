import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../../../../../../..");
const routeSources = [
  readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/http/paymentPlanRoutes.ts"), "utf8"),
  readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/http/receivableTransactionRoutes.ts"), "utf8"),
  readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/http/receivablesQueryRoutes.ts"), "utf8")
];

describe("finance boundary security", () => {
  it("registers every finance mutation and query behind an explicit capability guard", () => {
    for (const source of routeSources) {
      const registrations = source.match(/app\.(?:post|patch|delete|get)\((?:.|\n)*?(?=\n[\x20]{2}app\.|\n\})/g) ?? [];
      expect(registrations.length).toBeGreaterThan(0);
      for (const registration of registrations) expect(registration).toContain("capabilityMiddleware(");
    }
  });

  it("uses only parameterized Prisma SQL boundaries and never unsafe raw execution", () => {
    const source = routeSources.concat([
      readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/application/RegisterReceipt.ts"), "utf8"),
      readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/infrastructure/PrismaFinanceUnitOfWork.ts"), "utf8"),
      readFileSync(join(root, "apps/api/src/modules/platform-auth-shell/infrastructure/PrismaAuthRepository.ts"), "utf8")
    ]).join("\n");
    expect(source).not.toMatch(/\$(?:query|execute)RawUnsafe/);
    expect(source).not.toMatch(/\$(?:query|execute)Raw\s*\([^`]*\+/);
  });

  it("keeps bigint conversion at the finance response boundary", () => {
    const source = readFileSync(join(root, "apps/api/src/modules/finance-contract-receivables/application/GetContractReceivables.ts"), "utf8");
    expect(source).toContain("wireMoney");
    expect(source).not.toMatch(/JSON\.stringify[\s\S]*bigint/i);
  });

  it("does not use Number or floating-point parsing in financial arithmetic", () => {
    const source = ["application", "domain"].flatMap((folder) => {
      const files = folder === "application" ? ["RegisterReceipt.ts", "ReverseReceipt.ts", "GetContractReceivables.ts"] : ["MoneyBRL.ts", "InstallmentProjectionPolicy.ts"];
      return files.map((file) => readFileSync(join(root, `apps/api/src/modules/finance-contract-receivables/${folder}/${file}`), "utf8"));
    }).join("\n");
    expect(source).not.toMatch(/\b(?:Number|parseFloat|parseInt)\s*\(/);
  });
});
