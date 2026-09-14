export const fmtDate = (iso: string | null) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const today = () => new Date().toISOString().slice(0, 10)
