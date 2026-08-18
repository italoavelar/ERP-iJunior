const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class LocalDateError extends Error { override name = "LocalDateError"; }

/** A calendar date, deliberately without a time zone or time of day. */
export class LocalDate {
  private constructor(readonly value: string) {}

  static parse(value: string): LocalDate {
    const match = LOCAL_DATE_PATTERN.exec(value);
    if (!match) throw new LocalDateError("LocalDate must use YYYY-MM-DD");
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new LocalDateError("LocalDate is not a calendar date");
    }
    return new LocalDate(value);
  }

  compare(other: LocalDate): -1 | 0 | 1 { return this.value === other.value ? 0 : this.value < other.value ? -1 : 1; }
  equals(other: LocalDate): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

export interface Clock { todayIn(timeZone: "America/Sao_Paulo"): LocalDate; }

export class SystemClock implements Clock {
  todayIn(timeZone: "America/Sao_Paulo"): LocalDate {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value;
    return LocalDate.parse(`${get("year")}-${get("month")}-${get("day")}`);
  }
}
