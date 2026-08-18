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
