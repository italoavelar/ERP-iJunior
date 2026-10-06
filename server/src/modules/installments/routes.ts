import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'
import { toISODate, toNumber } from '../../lib/serialize.js'

export const installmentsRouter = Router()

/**
 * Todas as parcelas de todos os projetos, já com o nome do projeto, para as
 * visões que cruzam projetos (calendário e tabela de parcelas).
 */
installmentsRouter.get('/', async (_req, res) => {
  const rows = await prisma.installment.findMany({
    orderBy: [{ projectId: 'asc' }, { number: 'asc' }],
    include: { project: { select: { name: true, client: true, running: true } } },
  })

  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.projectId, (counts.get(r.projectId) ?? 0) + 1)

  res.json(
    rows.map((i) => ({
      projectId: i.projectId,
      projectName: i.project.name,
      client: i.project.client,
      running: i.project.running,
      number: i.number,
      count: counts.get(i.projectId) ?? 0,
      description: i.description,
      dueDate: toISODate(i.dueDate),
      amount: toNumber(i.amount),
      paid: i.paid,
      paidAt: toISODate(i.paidAt),
      paidAmount: i.paidAmount === null ? null : toNumber(i.paidAmount),
      sprintNumber: i.sprintNumber,
    })),
  )
})
