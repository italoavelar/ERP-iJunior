import { describe, expect, it } from "vitest";
import { canonicalizeAllocations, fingerprintCommand } from "../../application/IdempotencyPolicy.js";
import { Clock, LocalDate } from "../LocalDate.js";
import { MoneyBRL, MoneyBRLError } from "../MoneyBRL.js";
import { deriveInstallmentProjection } from "../InstallmentProjectionPolicy.js";
import { assertDraftStructuralMutation, FinancePolicyError } from "../PaymentPlanPolicy.js";

const clock: Clock = { todayIn: () => LocalDate.parse("2026-08-19") };

describe("MoneyBRL", () => {
  it("uses bigint centavos and exact two-decimal wire formatting", () => {
    const value = MoneyBRL.parse("1000.50", { positive: true });
    expect(value.cents).toBe(100050n);
    expect(value.add(MoneyBRL.parse("0.01")).toApi()).toBe("1000.51");
    expect(value.subtract(MoneyBRL.parse("0.50")).toApi()).toBe("1000.00");
    expect(value.compare(MoneyBRL.parse("1000.50"))).toBe(0);
  });

  it.each(["1e3", "1,00", "1.001", " 1.00", "-1.00", "", "92233720368547758.08"])("rejects invalid decimal %s", (value) => {
    expect(() => MoneyBRL.parse(value)).toThrow(MoneyBRLError);
  });
  it("requires at least one cent for positive values", () => expect(() => MoneyBRL.parse("0", { positive: true })).toThrow(MoneyBRLError));
});

describe("calendar and projections", () => {
  it("keeps due dates as calendar values and makes the next Sao Paulo day overdue", () => {
    expect(() => LocalDate.parse("2026-08-18T00:00:00Z")).toThrow();
    const result = deriveInstallmentProjection({ original: MoneyBRL.parse("10.00"), receiptAllocated: MoneyBRL.zero, reversed: MoneyBRL.zero, dueDate: LocalDate.parse("2026-08-18"), clock });
    expect(result.settlementStatus).toBe("PENDING");
    expect(result.dueStatus).toBe("OVERDUE");
  });
  it("uses immutable event netting for partial and settled status", () => {
    const partial = deriveInstallmentProjection({ original: MoneyBRL.parse("10"), receiptAllocated: MoneyBRL.parse("10"), reversed: MoneyBRL.parse("4"), dueDate: LocalDate.parse("2026-08-20"), clock });
    expect(partial.receivedAmount.toApi()).toBe("6.00");
    expect(partial.settlementStatus).toBe("PARTIAL");
    const settled = deriveInstallmentProjection({ ...{ original: MoneyBRL.parse("10"), receiptAllocated: MoneyBRL.parse("10"), reversed: MoneyBRL.zero, dueDate: LocalDate.parse("2026-08-20"), clock } });
    expect(settled.settlementStatus).toBe("SETTLED");
  });
});

describe("policies and canonical idempotency", () => {
  it("permanently blocks draft mutation after any history", () => {
    expect(() => assertDraftStructuralMutation({ status: "DRAFT", discardedAt: null, total: MoneyBRL.parse("1") }, true)).toThrow(FinancePolicyError);
  });
  it("normalizes allocation ordering and has a stable sha256 fingerprint", () => {
    const left = canonicalizeAllocations([{ installmentId: "b", amountCents: 200n }, { installmentId: "a", amountCents: "100" }]);
    const right = canonicalizeAllocations([{ installmentId: "a", amountCents: 100n }, { installmentId: "b", amountCents: "200" }]);
    expect(fingerprintCommand("receipt", left)).toEqual(fingerprintCommand("receipt", right));
    expect(fingerprintCommand("receipt", left).fingerprint).not.toBe(fingerprintCommand("reversal", left).fingerprint);
  });
});
