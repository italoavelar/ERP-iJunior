import { PrismaClient } from "@prisma/client";
import { PaymentPlanLookupPort } from "../application/PaymentPlanLookupPort.js";

export class PrismaPaymentPlanLookup implements PaymentPlanLookupPort {
  constructor(private readonly prisma: PrismaClient) {}
  async getContractId(paymentPlanId: string): Promise<string | undefined> {
    return (await this.prisma.paymentPlan.findUnique({ where: { id: paymentPlanId }, select: { contractId: true } }))?.contractId;
  }
}
