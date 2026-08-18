export const FinanceCapabilities = [
  "FINANCE_READ", "FINANCIAL_AUDIT_READ", "PAYMENT_PLAN_CREATE", "PAYMENT_PLAN_EDIT_DRAFT", "PAYMENT_PLAN_ACTIVATE",
  "PAYMENT_PLAN_RETURN_TO_DRAFT", "PAYMENT_PLAN_DISCARD", "INSTALLMENT_CREATE", "INSTALLMENT_EDIT_DRAFT",
  "INSTALLMENT_REMOVE", "INSTALLMENT_REORDER", "RECEIVABLE_REGISTER_PAYMENT", "RECEIVABLE_REVERSE_PAYMENT"
] as const;
export type FinanceCapability = (typeof FinanceCapabilities)[number];
export interface AuthenticatedCommandContext { readonly actorUserId: string; readonly capabilities: ReadonlySet<FinanceCapability>; }
export interface AuthorizationPort { require(actorUserId: string, capability: FinanceCapability): Promise<void>; list(actorUserId: string): Promise<ReadonlySet<FinanceCapability>>; }
export class CapabilityMissingError extends Error { override name = "CapabilityMissingError"; }
export class InMemoryAuthorizationPort implements AuthorizationPort {
  constructor(private readonly grants: ReadonlyMap<string, ReadonlySet<FinanceCapability>>) {}
  async list(actorUserId: string): Promise<ReadonlySet<FinanceCapability>> { return this.grants.get(actorUserId) ?? new Set(); }
  async require(actorUserId: string, capability: FinanceCapability): Promise<void> {
    if (!(await this.list(actorUserId)).has(capability)) throw new CapabilityMissingError(`CAPABILITY_MISSING:${capability}`);
  }
}
export const gerenteFinanceiroCapabilities: ReadonlySet<FinanceCapability> = new Set([
  "FINANCE_READ", "FINANCIAL_AUDIT_READ", "PAYMENT_PLAN_CREATE", "PAYMENT_PLAN_EDIT_DRAFT", "PAYMENT_PLAN_ACTIVATE",
  "INSTALLMENT_CREATE", "INSTALLMENT_EDIT_DRAFT", "INSTALLMENT_REMOVE", "INSTALLMENT_REORDER", "RECEIVABLE_REGISTER_PAYMENT"
]);
export const vicePresidenteCapabilities: ReadonlySet<FinanceCapability> = new Set([...gerenteFinanceiroCapabilities, "PAYMENT_PLAN_RETURN_TO_DRAFT", "PAYMENT_PLAN_DISCARD", "RECEIVABLE_REVERSE_PAYMENT"]);
