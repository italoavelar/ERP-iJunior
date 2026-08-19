import { PrismaClient } from "@prisma/client";
import { AuthorizationPort } from "./FinanceCapability.js";
import { ContractReferencePort } from "./ContractReferencePort.js";
import { FinanceDomainError } from "./FinanceDomainError.js";
import { Clock, LocalDate } from "../domain/LocalDate.js";
import { MoneyBRL } from "../domain/MoneyBRL.js";
import { deriveInstallmentProjection } from "../domain/InstallmentProjectionPolicy.js";
import { wireDate, wireMoney } from "./financeCommandSupport.js";

export class GetContractReceivables {
  constructor(private readonly prisma: PrismaClient, private readonly authorization: AuthorizationPort, private readonly contracts: ContractReferencePort, private readonly clock: Clock) {}
  async execute(actorUserId: string, contractId: string) {
    await this.authorization.require(actorUserId, "FINANCE_READ");
    const plan = await this.prisma.paymentPlan.findFirst({ where: { contractId, discardedAt: null }, include: {
      installments: { orderBy: { installmentNumber: "asc" }, include: { allocations: { include: { transaction: true, reversalAllocations: true } } } },
      transactions: { orderBy: { occurredAt: "asc" }, include: { allocations: { orderBy: { createdAt: "asc" } } } }
    } });
    if (!plan) {
      const context = await this.contracts.getReceivablesContext(contractId);
      if (context.kind !== "available") throw new FinanceDomainError("CONTRACT_UNAVAILABLE");
      return { contractId: context.contractId, clientId: context.clientId, currency: context.currency, paymentPlan: null };
    }
    const reversedByOriginal = new Map<string, bigint>();
    for (const transaction of plan.transactions) for (const allocation of transaction.allocations) if (allocation.originalAllocationId) reversedByOriginal.set(allocation.originalAllocationId, (reversedByOriginal.get(allocation.originalAllocationId) ?? 0n) + allocation.amountCents);
    const installments = plan.installments.map((item) => {
      const receipts = item.allocations.filter((allocation) => allocation.transaction.type === "RECEIPT");
      const receiptCents = receipts.reduce((sum, allocation) => sum + allocation.amountCents, 0n);
      const reversedCents = receipts.reduce((sum, allocation) => sum + allocation.reversalAllocations.reduce((nested, reversal) => nested + reversal.amountCents, 0n), 0n);
      const projection = deriveInstallmentProjection({ original: MoneyBRL.fromCents(item.originalCents), receiptAllocated: MoneyBRL.fromCents(receiptCents), reversed: MoneyBRL.fromCents(reversedCents), dueDate: LocalDate.parse(wireDate(item.dueDate)), clock: this.clock });
      return { id: item.id, installmentNumber: item.installmentNumber, originalAmount: wireMoney(item.originalCents), dueDate: wireDate(item.dueDate), receivedAmount: projection.receivedAmount.toApi(), remainingBalance: projection.remainingBalance.toApi(), settlementStatus: projection.settlementStatus, dueStatus: projection.dueStatus };
    });
    const transactions = plan.transactions.map((transaction) => ({ id: transaction.id, type: transaction.type, amount: wireMoney(transaction.amountCents), occurredAt: transaction.occurredAt.toISOString(), reason: transaction.reason, originalReceiptId: transaction.originalReceiptId, allocations: transaction.allocations.map((allocation) => {
      const original = transaction.type === "RECEIPT";
      const reversed = original ? reversedByOriginal.get(allocation.id) ?? 0n : 0n;
      return { id: allocation.id, installmentId: allocation.installmentId, amount: wireMoney(allocation.amountCents), originalAllocationId: allocation.originalAllocationId, reversibleAmount: original ? wireMoney(allocation.amountCents - reversed) : undefined };
    }) }));
    return { contractId: plan.contractId, clientId: plan.clientId, currency: "BRL", paymentPlan: { id: plan.id, status: plan.status, totalAmount: wireMoney(plan.totalCents), installments, transactions } };
  }
}
