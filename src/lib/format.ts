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

export type InstallmentStatus = 'Paga' | 'Vencida' | 'A vencer' | 'Aguarda sprint' | 'Condicionada'

/**
 * Situação da parcela. Sem vencimento, ela depende de um marco: se o marco é
 * uma sprint, "Aguarda sprint"; senão (NF, entrega, contrato), "Condicionada".
 */
export const installmentStatus = (i: {
  paid: boolean
  dueDate: string | null
  sprintNumber: number | null
}): InstallmentStatus => {
  if (i.paid) return 'Paga'
  if (!i.dueDate) return i.sprintNumber ? 'Aguarda sprint' : 'Condicionada'
  return daysTo(i.dueDate) < 0 ? 'Vencida' : 'A vencer'
}

/** Texto e cor do vencimento a partir da distância em dias. */
export const dueLabel = (iso: string) => {
  const d = daysTo(iso)
  if (d < 0) return { label: `vencido há ${Math.abs(d)} ${Math.abs(d) === 1 ? 'dia' : 'dias'}`, tone: 'var(--destructive)' }
  if (d === 0) return { label: 'vence hoje', tone: 'var(--amber)' }
  return { label: `em ${d} ${d === 1 ? 'dia' : 'dias'}`, tone: d <= 5 ? 'var(--amber)' : 'var(--mutedfg)' }
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
