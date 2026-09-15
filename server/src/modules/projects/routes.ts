import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { toISODate, toNumber } from '../../lib/serialize.js'
import { notFound } from '../../lib/httpError.js'
import type { Prisma, Project } from '@prisma/client'

export const projectsRouter = Router()

const serialize = (p: Project) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  product: p.product,
  po: p.po,
  running: p.running,
  total: toNumber(p.total as Prisma.Decimal),
  paid: toNumber(p.paid as Prisma.Decimal),
  nextDate: toISODate(p.nextDate),
  nf: p.nfIssued,
})

const listQuery = z.object({ status: z.enum(['running', 'finished']).optional() })
const idParam = z.object({ id: z.string().min(1) })
const nfBody = z.object({ issued: z.boolean() })

projectsRouter.get('/', async (req, res) => {
  const { status } = listQuery.parse(req.query)
  const rows = await prisma.project.findMany({
    where: status ? { running: status === 'running' } : undefined,
    orderBy: [{ running: 'desc' }, { name: 'asc' }],
  })
  res.json(rows.map(serialize))
})

projectsRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const row = await prisma.project.findUnique({ where: { id } })
  if (!row) throw notFound('Projeto')
  res.json(serialize(row))
})

/** Marca ou desmarca a NF do próximo pagamento. */
projectsRouter.patch('/:id/nf', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const { issued } = nfBody.parse(req.body)
  const row = await prisma.project.update({ where: { id }, data: { nfIssued: issued } })
  res.json(serialize(row))
})
