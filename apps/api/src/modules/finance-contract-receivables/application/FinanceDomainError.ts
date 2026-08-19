export class FinanceDomainError extends Error {
  constructor(readonly code: string, readonly details: Record<string, string> = {}) { super(code); this.name = "FinanceDomainError"; }
}

export function financeAssert(condition: unknown, code: string, details?: Record<string, string>): asserts condition {
  if (!condition) throw new FinanceDomainError(code, details);
}
