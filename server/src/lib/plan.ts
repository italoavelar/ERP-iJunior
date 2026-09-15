/** Divide um valor em `parts` parcelas de centavos exatos; a última absorve o resto. */
export function split(amount: number, parts: number): number[] {
  if (parts <= 0) return []
  const cents = Math.round(amount * 100)
  const base = Math.floor(cents / parts)
  const out = Array.from({ length: parts }, () => base)
  out[parts - 1] = cents - base * (parts - 1)
  return out.map((c) => c / 100)
}

/** Soma meses a uma data YYYY-MM-DD, preservando o dia. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1 + months, d!))
  return date.toISOString().slice(0, 10)
}
