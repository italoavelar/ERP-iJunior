import type { Product, Project } from './types'

export type Tone = readonly [string, string]

export const productTone = (p: Product): Tone =>
  p === 'START'
    ? ['color-mix(in oklch,var(--blue) 14%,transparent)', 'var(--blue)']
    : ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']

export const nfTone = (has: boolean): Tone =>
  has
    ? ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']
    : ['var(--muted)', 'var(--mutedfg)']

export const pctOf = (p: Project) => Math.round((p.paid / p.total) * 100) + '%'
