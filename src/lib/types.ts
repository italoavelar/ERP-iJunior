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
  /** `YYYY-MM-DD` */
  dueDate: string
  amount: number
  paid: boolean
  nfIssued: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  product: Product
  po: string
  running: boolean
  total: number
  paid: number
  /** `YYYY-MM-DD`; null quando o contrato está quitado. */
  nextDate: string | null
  /** NF do próximo pagamento já emitida. */
  nf: boolean
  /** Quantas parcelas já tiveram NF emitida. */
  nfCount: number
  installmentCount: number
  /** Número da primeira parcela em aberto; null se o contrato está quitado. */
  nextNumber: number | null
}

export interface ProjectDetail extends Project {
  installments: Installment[]
}

export interface ProjectInput {
  name: string
  description: string
  po: string
  product: Product
  running: boolean
}
