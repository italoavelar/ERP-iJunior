const MAX_BIGINT = 9_223_372_036_854_775_807n;
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export class MoneyBRLError extends Error {
  override name = "MoneyBRLError";
}

/** Exact BRL amount stored as signed PostgreSQL BIGINT centavos. */
export class MoneyBRL {
  private constructor(readonly cents: bigint) {}

  static readonly zero = new MoneyBRL(0n);

  static parse(value: string, options: { positive?: boolean } = {}): MoneyBRL {
    if (!MONEY_PATTERN.test(value)) {
      throw new MoneyBRLError("BRL must be an unsigned decimal string with at most two decimals");
    }
    const [whole = "", fraction = ""] = value.split(".");
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    if (cents > MAX_BIGINT) throw new MoneyBRLError("BRL amount exceeds BIGINT range");
    if (options.positive && cents <= 0n) throw new MoneyBRLError("BRL amount must be at least 0.01");
    return new MoneyBRL(cents);
  }

  static fromCents(cents: bigint, options: { positive?: boolean } = {}): MoneyBRL {
    if (cents < -MAX_BIGINT - 1n || cents > MAX_BIGINT) throw new MoneyBRLError("BRL amount exceeds BIGINT range");
    if (options.positive && cents <= 0n) throw new MoneyBRLError("BRL amount must be at least 0.01");
    return new MoneyBRL(cents);
  }

  add(other: MoneyBRL): MoneyBRL { return MoneyBRL.fromCents(this.cents + other.cents); }
  subtract(other: MoneyBRL): MoneyBRL { return MoneyBRL.fromCents(this.cents - other.cents); }
  compare(other: MoneyBRL): -1 | 0 | 1 { return this.cents === other.cents ? 0 : this.cents < other.cents ? -1 : 1; }
  equals(other: MoneyBRL): boolean { return this.cents === other.cents; }
  toApi(): string {
    const sign = this.cents < 0n ? "-" : "";
    const absolute = this.cents < 0n ? -this.cents : this.cents;
    return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
  }
}
