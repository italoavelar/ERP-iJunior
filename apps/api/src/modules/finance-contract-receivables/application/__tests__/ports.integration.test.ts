import { describe, expect, it } from "vitest";
import { FixtureContractReferencePort } from "../ContractReferencePort.js";
import { gerenteFinanceiroCapabilities, InMemoryAuthorizationPort, vicePresidenteCapabilities } from "../FinanceCapability.js";
import { MoneyBRL } from "../../domain/MoneyBRL.js";

describe("finance external ports", () => {
  it("returns only canonical contract context and no unavailable contract", async () => {
    const port = new FixtureContractReferencePort(new Map([["contract-1", { kind: "available", contractId: "contract-1", clientId: "client-1", currency: "BRL", financialValue: MoneyBRL.parse("10"), eligibleForReceivables: true }]]));
    expect(await port.getReceivablesContext("missing")).toEqual({ kind: "unavailable-or-ineligible" });
    expect((await port.getReceivablesContext("contract-1")).kind).toBe("available");
  });
  it("does not infer financial access from platform administration", async () => {
    const authorization = new InMemoryAuthorizationPort(new Map([["manager", gerenteFinanceiroCapabilities], ["vp", vicePresidenteCapabilities], ["admin", new Set()]]));
    await expect(authorization.require("manager", "RECEIVABLE_REGISTER_PAYMENT")).resolves.toBeUndefined();
    await expect(authorization.require("manager", "RECEIVABLE_REVERSE_PAYMENT")).rejects.toThrow("CAPABILITY_MISSING");
    await expect(authorization.require("vp", "RECEIVABLE_REVERSE_PAYMENT")).resolves.toBeUndefined();
    await expect(authorization.require("admin", "FINANCE_READ")).rejects.toThrow("CAPABILITY_MISSING");
  });
});
