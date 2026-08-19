import { PrismaClient } from "@prisma/client";
import { ContractReferencePort, ReceivablesContractContext } from "../application/ContractReferencePort.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";

/** Reads the shared, canonical Contract without exposing its persistence model to Finance. */
export class PrismaContractReferenceAdapter implements ContractReferencePort {
  constructor(private readonly prisma: PrismaClient) {}

  async getReceivablesContext(contractId: string): Promise<ReceivablesContractContext> {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId }, select: { id: true, clientId: true, contractValueCents: true } });
    if (!contract) return { kind: "unavailable-or-ineligible" };
    return { kind: "available", contractId: contract.id, clientId: contract.clientId, currency: "BRL", financialValue: MoneyBRL.fromCents(contract.contractValueCents), eligibleForReceivables: true };
  }
}
