/** Contrato servido pela API em server/. */

export type Product = 'LOOP' | 'START'

export interface Person {
  id: string
  name: string
  initials: string
}

export interface Activity {
  id: string
  title: string
  details: string
  /** Ids dos responsáveis. */
  people: string[]
  done: boolean
  /** `YYYY-MM-DD` ou null enquanto aberta. */
  doneAt: string | null
}

export interface Installment {
  number: number
  /** Ex.: "Entrada", "Após Sprint 4". */
  description: string
  /** `YYYY-MM-DD`; null = condicionada a um marco que ainda não ocorreu. */
  dueDate: string | null
  amount: number
  paid: boolean
  paidAt: string | null
  /** Valor efetivamente recebido, quando difere do previsto. */
  paidAmount: number | null
  /** Sprint cuja validação libera a cobrança. */
  sprintNumber: number | null
  notes: string
}

export interface Sprint {
  number: number
  validated: boolean
  validatedAt: string | null
}

export interface Project {
  id: string
  name: string
  /** Quem contrata e paga. */
  client: string
  description: string
  /** Observação financeira principal. */
  notes: string
  /** null enquanto não foi definido. */
  product: Product | null
  po: string
  running: boolean
  total: number
  paid: number
  /** `YYYY-MM-DD`; null quando o contrato está quitado. */
  nextDate: string | null
  installmentCount: number
  /** Número da primeira parcela em aberto; null se o contrato está quitado. */
  nextNumber: number | null
  nextDescription: string | null
  /** Sprint que libera a próxima parcela, se ela depende de uma. */
  nextSprint: number | null
  paidCount: number
  sprintCount: number
  lastValidatedSprint: number | null
}

export interface ProjectDetail extends Project {
  installments: Installment[]
  sprints: Sprint[]
}

export interface ProjectInput {
  name: string
  client: string
  description: string
  notes: string
  po: string
  product: Product | null
  running: boolean
}

export interface InstallmentPatch {
  paid?: boolean
  amount?: number
  dueDate?: string | null
  paidAt?: string | null
}
