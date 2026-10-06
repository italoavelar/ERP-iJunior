import type { InstallmentStatus } from './format'
import type { Product, Project } from './types'

export type Tone = readonly [string, string]

export const productTone = (p: Product | null): Tone =>
  p === null
    ? ['var(--muted)', 'var(--mutedfg)']
    : p === 'START'
    ? ['color-mix(in oklch,var(--blue) 14%,transparent)', 'var(--blue)']
    : ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']

export const pctOf = (p: Project) => Math.round((p.paid / p.total) * 100) + '%'

export const statusTone = (status: InstallmentStatus): Tone => {
  if (status === 'Paga') return ['color-mix(in oklch,var(--blue) 14%,transparent)', 'var(--blue)']
  if (status === 'Vencida')
    return ['color-mix(in oklch,var(--destructive) 12%,transparent)', 'var(--destructive)']
  if (status === 'Aguarda sprint')
    return ['color-mix(in oklch,var(--amber) 16%,transparent)', 'var(--amber)']
  if (status === 'Condicionada') return ['var(--muted)', 'var(--mutedfg)']
  return ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']
}
