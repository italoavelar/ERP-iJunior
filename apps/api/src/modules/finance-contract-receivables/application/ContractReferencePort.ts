import { MoneyBRL } from "../domain/MoneyBRL.js";

export type ReceivablesContractContext =
  | { kind: "available"; contractId: string; clientId: string; currency: "BRL"; financialValue: MoneyBRL; eligibleForReceivables: true }
  | { kind: "unavailable-or-ineligible" };

export interface ContractReferencePort { getReceivablesContext(contractId: string): Promise<ReceivablesContractContext>; }

/** Test adapter containing canonical identifiers only; it intentionally stores no personal data. */
export class FixtureContractReferencePort implements ContractReferencePort {
  constructor(private readonly contexts: ReadonlyMap<string, ReceivablesContractContext>) {}
  async getReceivablesContext(contractId: string): Promise<ReceivablesContractContext> {
    return this.contexts.get(contractId) ?? { kind: "unavailable-or-ineligible" };
  }
}

/** Reusable contract-owner outcomes; unavailable covers both ineligible and non-BRL owner responses. */
export const contractReferenceFixtures = {
  unavailable: { kind: "unavailable-or-ineligible" } as const,
  ineligible: { kind: "unavailable-or-ineligible" } as const,
  nonBrl: { kind: "unavailable-or-ineligible" } as const,
  valid: {
    kind: "available", contractId: "contract-valid", clientId: "client-valid", currency: "BRL",
    financialValue: MoneyBRL.parse("100.00"), eligibleForReceivables: true
  } as const
};
