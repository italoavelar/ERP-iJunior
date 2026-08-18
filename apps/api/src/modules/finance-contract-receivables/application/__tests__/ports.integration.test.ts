import { describe, expect, it } from "vitest";
import { contractReferenceFixtures, FixtureContractReferencePort, type ReceivablesContractContext } from "../ContractReferencePort.js";
import { gerenteFinanceiroCapabilities, InMemoryAuthorizationPort, vicePresidenteCapabilities } from "../FinanceCapability.js";
import { MoneyBRL } from "../../domain/MoneyBRL.js";

describe("finance external ports", () => {
  it("returns only canonical contract context and no unavailable contract", async () => {
    const contexts: ReadonlyMap<string, ReceivablesContractContext> = new Map<string, ReceivablesContractContext>([["contract-1", { kind: "available", contractId: "contract-1", clientId: "client-1", currency: "BRL", financialValue: MoneyBRL.parse("10"), eligibleForReceivables: true }], ["ineligible", contractReferenceFixtures.ineligible], ["non-brl", contractReferenceFixtures.nonBrl]]);
    const port = new FixtureContractReferencePort(contexts);
    expect(await port.getReceivablesContext("missing")).toEqual({ kind: "unavailable-or-ineligible" });
    expect((await port.getReceivablesContext("contract-1")).kind).toBe("available");
    expect(await port.getReceivablesContext("ineligible")).toEqual(contractReferenceFixtures.ineligible);
    expect(await port.getReceivablesContext("non-brl")).toEqual(contractReferenceFixtures.nonBrl);
  });
  it("does not infer financial access from platform administration", async () => {
    const authorization = new InMemoryAuthorizationPort(new Map([["manager", gerenteFinanceiroCapabilities], ["vp", vicePresidenteCapabilities], ["admin", new Set()]]));
    await expect(authorization.require("manager", "RECEIVABLE_REGISTER_PAYMENT")).resolves.toBeUndefined();
    await expect(authorization.require("manager", "RECEIVABLE_REVERSE_PAYMENT")).rejects.toThrow("CAPABILITY_MISSING");
    await expect(authorization.require("vp", "RECEIVABLE_REVERSE_PAYMENT")).resolves.toBeUndefined();
    await expect(authorization.require("admin", "FINANCE_READ")).rejects.toThrow("CAPABILITY_MISSING");
  });
});
