import { PrismaClient } from "@prisma/client";
import { ContractReferencePort, ReceivablesContractContext } from "../application/ContractReferencePort.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";

/**
 * Development/test-only adapter. Commercial remains the owner of Contract;
 * this table stores canonical fixture references and no personal data.
 */
export class PrismaDevContractReferenceAdapter implements ContractReferencePort {
  constructor(private readonly prisma: PrismaClient, private readonly enabled = process.env.NODE_ENV !== "production") {}

  async getReceivablesContext(contractId: string): Promise<ReceivablesContractContext> {
    if (!this.enabled) return { kind: "unavailable-or-ineligible" };
    const rows = await this.prisma.$queryRaw<readonly { contractId: string; clientId: string; currency: string; financialCents: bigint; eligible: boolean }[]>`
      SELECT "contractId", "clientId", "currency", "financialCents", "eligible"
      FROM "DevContractReference" WHERE "contractId" = ${contractId} LIMIT 1
    `;
    const row = rows[0];
    if (!row || row.currency !== "BRL" || !row.eligible) return { kind: "unavailable-or-ineligible" };
    return { kind: "available", contractId: row.contractId, clientId: row.clientId, currency: "BRL", financialValue: MoneyBRL.fromCents(row.financialCents), eligibleForReceivables: true };
  }
}
