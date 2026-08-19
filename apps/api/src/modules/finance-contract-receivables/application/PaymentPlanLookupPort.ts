export interface PaymentPlanLookupPort {
  getContractId(paymentPlanId: string): Promise<string | undefined>;
}
