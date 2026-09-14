export const BRL = (n: number) =>
  'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtDate = (iso: string | null) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const today = () => new Date().toISOString().slice(0, 10)

/** Converte "4.332,02" (pt-BR) para número. NaN quando não parseável. */
export const parseBRL = (s: string) => parseFloat(String(s).replace(/\./g, '').replace(',', '.'))
