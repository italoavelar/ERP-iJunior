export const fmtDate = (iso: string | null) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const today = () => new Date().toISOString().slice(0, 10)

export const BRL = (n: number) =>
  'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Dias entre hoje e uma data ISO. Negativo = vencido. */
export const daysTo = (iso: string) =>
  Math.round((new Date(iso).getTime() - new Date(today()).getTime()) / 86400000)
