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

/** Situação da parcela a partir do pagamento e do vencimento. */
export const installmentStatus = (paid: boolean, dueDate: string) => {
  if (paid) return 'Paga' as const
  return daysTo(dueDate) < 0 ? ('Vencida' as const) : ('A vencer' as const)
}

/** Lê um valor digitado em pt-BR ("1.234,56") ou com ponto decimal. */
export const parseAmount = (s: string) => {
  const cleaned = s.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned) return NaN
  // Com vírgula, ela é o separador decimal e os pontos são de milhar.
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  return Number(normalized)
}
