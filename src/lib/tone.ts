/** Pares [background, foreground] derivados dos tokens do design. */
export type Tone = readonly [string, string]

export const STATUS_TONE: Record<string, Tone> = {
  'Em dia': ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)'],
  Concluído: ['color-mix(in oklch,var(--blue) 14%,transparent)', 'var(--blue)'],
  Atrasado: ['color-mix(in oklch,var(--amber) 16%,transparent)', 'var(--amber)'],
  Inadimplente: ['color-mix(in oklch,var(--destructive) 12%,transparent)', 'var(--destructive)'],
  Pausado: ['var(--muted)', 'var(--mutedfg)'],
}

export const PRIO_TONE: Record<string, Tone> = {
  Alta: ['color-mix(in oklch,var(--destructive) 12%,transparent)', 'var(--destructive)'],
  Média: ['color-mix(in oklch,var(--amber) 16%,transparent)', 'var(--amber)'],
  Baixa: ['var(--muted)', 'var(--mutedfg)'],
}

export const nfTone = (has: boolean): Tone =>
  has
    ? ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']
    : ['var(--muted)', 'var(--mutedfg)']

export const statusTone = (status: string): Tone => STATUS_TONE[status] ?? STATUS_TONE.Pausado
