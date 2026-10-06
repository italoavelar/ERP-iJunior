import { prisma } from '../../lib/prisma.js'
import { toISODate, toNumber, fromISODate } from '../../lib/serialize.js'
import { HttpError, notFound } from '../../lib/httpError.js'
import { addMonths, split } from '../../lib/plan.js'

const withPlan = {
  include: {
    installments: { orderBy: { number: 'asc' } },
    sprints: { orderBy: { number: 'asc' } },
  },
} as const

type ProjectRow = Awaited<ReturnType<typeof prisma.project.findFirstOrThrow<typeof withPlan>>>
type InstallmentRow = ProjectRow['installments'][number]

/** O que de fato entrou: o valor recebido, quando registrado, senão o previsto. */
const received = (i: InstallmentRow) => toNumber(i.paidAmount ?? i.amount)

const serializeInstallment = (i: InstallmentRow) => ({
  number: i.number,
  description: i.description,
  dueDate: toISODate(i.dueDate),
  amount: toNumber(i.amount),
  paid: i.paid,
  paidAt: toISODate(i.paidAt),
  paidAmount: i.paidAmount === null ? null : toNumber(i.paidAmount),
  nfIssued: i.nfIssued,
  sprintNumber: i.sprintNumber,
  notes: i.notes,
})

/**
 * O "próximo pagamento" das telas é a primeira parcela em aberto. Total e pago
 * são somados das parcelas, em centavos, para não acumular erro de arredondamento.
 */
function summarize(p: ProjectRow) {
  const next = p.installments.find((i) => !i.paid) ?? null
  const sum = (list: InstallmentRow[], f: (i: InstallmentRow) => number) =>
    list.reduce((acc, i) => acc + Math.round(f(i) * 100), 0) / 100
  const validated = p.sprints.filter((s) => s.validated)

  return {
    id: p.id,
    name: p.name,
    client: p.client,
    description: p.description,
    notes: p.notes,
    product: p.product,
    po: p.po,
    running: p.running,
    total: sum(p.installments, (i) => toNumber(i.amount)),
    paid: sum(p.installments.filter((i) => i.paid), received),
    nextNumber: next?.number ?? null,
    nextDate: next ? toISODate(next.dueDate) : null,
    nextDescription: next?.description ?? null,
    nextSprint: next?.sprintNumber ?? null,
    /** NF do próximo pagamento; num contrato quitado, se todas foram emitidas. */
    nf: next ? next.nfIssued : p.installments.every((i) => i.nfIssued),
    nfCount: p.installments.filter((i) => i.nfIssued).length,
    installmentCount: p.installments.length,
    paidCount: p.installments.filter((i) => i.paid).length,
    sprintCount: p.sprints.length,
    lastValidatedSprint: validated.length ? Math.max(...validated.map((s) => s.number)) : null,
  }
}

export const serializeDetail = (p: ProjectRow) => ({
  ...summarize(p),
  installments: p.installments.map(serializeInstallment),
  sprints: p.sprints.map((s) => ({
    number: s.number,
    validated: s.validated,
    validatedAt: toISODate(s.validatedAt),
  })),
})

export async function listProjects(status?: 'running' | 'finished') {
  const rows = await prisma.project.findMany({
    where: status ? { running: status === 'running' } : undefined,
    orderBy: [{ running: 'desc' }, { name: 'asc' }],
    ...withPlan,
  })
  return rows.map(summarize)
}

export async function getProject(id: string) {
  const row = await prisma.project.findUnique({ where: { id }, ...withPlan })
  if (!row) throw notFound('Projeto')
  return serializeDetail(row)
}

export async function updateProject(
  id: string,
  data: {
    name?: string
    client?: string
    description?: string
    notes?: string
    po?: string
    product?: 'LOOP' | 'START' | null
    running?: boolean
  },
) {
  const row = await prisma.project.update({ where: { id }, data, ...withPlan })
  return serializeDetail(row)
}

/**
 * Edita uma parcela. Marcar como paga registra a data (hoje, se não vier) e
 * desmarcar limpa data e valor recebido — senão o pago ficaria inconsistente.
 */
export async function updateInstallment(
  projectId: string,
  number: number,
  data: {
    paid?: boolean
    nfIssued?: boolean
    amount?: number
    dueDate?: string | null
    paidAt?: string | null
    description?: string
    notes?: string
  },
) {
  const key = { projectId_number: { projectId, number } }
  const existing = await prisma.installment.findUnique({ where: key })
  if (!existing) throw notFound('Parcela')

  const paid = data.paid ?? existing.paid
  if (data.paidAt && !paid) {
    throw new HttpError(422, 'Só uma parcela paga tem data de pagamento.')
  }

  let paidAt: Date | null | undefined
  if (data.paid === false) paidAt = null
  else if (data.paidAt !== undefined) paidAt = data.paidAt ? fromISODate(data.paidAt) : null
  else if (data.paid === true && !existing.paid) paidAt = fromISODate(new Date().toISOString().slice(0, 10))

  await prisma.installment.update({
    where: key,
    data: {
      paid: data.paid,
      nfIssued: data.nfIssued,
      amount: data.amount,
      description: data.description,
      notes: data.notes,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? fromISODate(data.dueDate) : null,
      paidAt,
      paidAmount: data.paid === false || data.amount !== undefined ? null : undefined,
    },
  })
  return getProject(projectId)
}

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

/**
 * Valida (ou desfaz a validação de) uma sprint. Validar libera a cobrança: as
 * parcelas em aberto ligadas à sprint e ainda sem vencimento passam a vencer
 * na data da validação. Desfazer volta só as que receberam essa data.
 */
export async function setSprintValidated(
  projectId: string,
  number: number,
  validated: boolean,
  date?: string,
) {
  const key = { projectId_number: { projectId, number } }
  const sprint = await prisma.sprint.findUnique({ where: key })
  if (!sprint) throw notFound('Sprint')

  const when = fromISODate(date ?? new Date().toISOString().slice(0, 10))

  await prisma.$transaction(async (tx) => {
    if (validated) {
      await tx.sprint.update({ where: key, data: { validated: true, validatedAt: when } })
      await tx.installment.updateMany({
        where: { projectId, sprintNumber: number, paid: false, dueDate: null },
        data: { dueDate: when },
      })
    } else {
      await tx.sprint.update({ where: key, data: { validated: false, validatedAt: null } })
      if (sprint.validatedAt) {
        await tx.installment.updateMany({
          where: { projectId, sprintNumber: number, paid: false, dueDate: sprint.validatedAt },
          data: { dueDate: null },
        })
      }
    }
  })
  return getProject(projectId)
}

/**
 * Refaz o plano: preço, número de parcelas, primeiro vencimento e quantas já
 * foram pagas. Descrição, observações, NF e vínculo com sprint de uma parcela
 * são preservados quando o número dela sobrevive ao novo plano.
 */
export async function replan(
  projectId: string,
  input: { total: number; count: number; firstDueDate: string; paidCount: number },
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { installments: true },
  })
  if (!project) throw notFound('Projeto')

  const previous = new Map(project.installments.map((i) => [i.number, i]))
  const amounts = split(input.total, input.count)
  const today = fromISODate(new Date().toISOString().slice(0, 10))

  const rows = amounts.map((amount, idx) => {
    const number = idx + 1
    const old = previous.get(number)
    const paid = number <= input.paidCount
    return {
      projectId,
      number,
      description: old?.description ?? '',
      dueDate: fromISODate(addMonths(input.firstDueDate, idx)),
      amount,
      paid,
      paidAt: paid ? (old?.paid && old.paidAt ? old.paidAt : today) : null,
      nfIssued: old?.nfIssued ?? false,
      sprintNumber: old?.sprintNumber ?? null,
      notes: old?.notes ?? '',
    }
  })

  await prisma.$transaction([
    prisma.installment.deleteMany({ where: { projectId } }),
    prisma.installment.createMany({ data: rows }),
  ])
  return getProject(projectId)
}
