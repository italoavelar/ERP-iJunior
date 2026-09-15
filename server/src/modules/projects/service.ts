import { prisma } from '../../lib/prisma.js'
import { toISODate, toNumber } from '../../lib/serialize.js'
import { notFound } from '../../lib/httpError.js'

const withInstallments = {
  include: { installments: { orderBy: { number: 'asc' } } },
} as const

type ProjectRow = Awaited<
  ReturnType<typeof prisma.project.findFirstOrThrow<typeof withInstallments>>
>

const serializeInstallment = (i: ProjectRow['installments'][number]) => ({
  number: i.number,
  dueDate: toISODate(i.dueDate)!,
  amount: toNumber(i.amount),
  paid: i.paid,
  nfIssued: i.nfIssued,
})

/**
 * O "próximo pagamento" das telas é a primeira parcela em aberto. Derivar daqui
 * evita manter no projeto um espelho que pode divergir do plano.
 */
function summarize(p: ProjectRow) {
  const next = p.installments.find((i) => !i.paid) ?? null
  // Somar em centavos evita o arredondamento de ponto flutuante na soma.
  const cents = (list: typeof p.installments) =>
    list.reduce((acc, i) => acc + Math.round(toNumber(i.amount) * 100), 0) / 100

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    product: p.product,
    po: p.po,
    running: p.running,
    total: cents(p.installments),
    paid: cents(p.installments.filter((i) => i.paid)),
    nextDate: next ? toISODate(next.dueDate) : null,
    /// NF do próximo pagamento; num contrato quitado, se todas foram emitidas.
    nf: next ? next.nfIssued : p.installments.every((i) => i.nfIssued),
    nfCount: p.installments.filter((i) => i.nfIssued).length,
    installmentCount: p.installments.length,
    nextNumber: next?.number ?? null,
  }
}

export const serializeSummary = summarize

export const serializeDetail = (p: ProjectRow) => ({
  ...summarize(p),
  installments: p.installments.map(serializeInstallment),
})

export async function listProjects(status?: 'running' | 'finished') {
  const rows = await prisma.project.findMany({
    where: status ? { running: status === 'running' } : undefined,
    orderBy: [{ running: 'desc' }, { name: 'asc' }],
    ...withInstallments,
  })
  return rows.map(summarize)
}

export async function getProject(id: string) {
  const row = await prisma.project.findUnique({ where: { id }, ...withInstallments })
  if (!row) throw notFound('Projeto')
  return serializeDetail(row)
}

export async function updateProject(
  id: string,
  data: {
    name?: string
    description?: string
    po?: string
    product?: 'LOOP' | 'START'
    running?: boolean
  },
) {
  const row = await prisma.project.update({ where: { id }, data, ...withInstallments })
  return serializeDetail(row)
}

/** Edita uma parcela: pagamento, NF ou valor. Total e pago do projeto saem daqui. */
export async function updateInstallment(
  projectId: string,
  number: number,
  data: { paid?: boolean; nfIssued?: boolean; amount?: number },
) {
  const existing = await prisma.installment.findUnique({
    where: { projectId_number: { projectId, number } },
  })
  if (!existing) throw notFound('Parcela')

  await prisma.installment.update({
    where: { projectId_number: { projectId, number } },
    data,
  })
  return getProject(projectId)
}

/** Marca/desmarca a NF de uma parcela específica. */
export const setInstallmentNF = (projectId: string, number: number, issued: boolean) =>
  updateInstallment(projectId, number, { nfIssued: issued })

/** Atalho da tabela: age sobre a NF da primeira parcela em aberto. */
export async function setNextNF(projectId: string, issued: boolean) {
  const next = await prisma.installment.findFirst({
    where: { projectId, paid: false },
    orderBy: { number: 'asc' },
  })
  if (!next) throw notFound('Parcela em aberto')
  return setInstallmentNF(projectId, next.number, issued)
}
