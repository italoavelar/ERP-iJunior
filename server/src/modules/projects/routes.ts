import { Router } from 'express'
import { z } from 'zod'
import * as service from './service.js'

export const projectsRouter = Router()

const listQuery = z.object({ status: z.enum(['running', 'finished']).optional() })
const idParam = z.object({ id: z.string().min(1) })
const installmentParams = z.object({
  id: z.string().min(1),
  number: z.coerce.number().int().positive(),
})

const updateBody = z
  .object({
    name: z.string().trim().min(1, 'O projeto precisa de um nome.'),
    description: z.string().trim().min(1, 'Descreva o projeto.'),
    po: z.string().trim().min(1, 'Informe o P.O. responsável.'),
    product: z.enum(['LOOP', 'START']),
    running: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo.' })

const nfBody = z.object({ issued: z.boolean() })

projectsRouter.get('/', async (req, res) => {
  const { status } = listQuery.parse(req.query)
  res.json(await service.listProjects(status))
})

projectsRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  res.json(await service.getProject(id))
})

projectsRouter.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const data = updateBody.parse(req.body)
  res.json(await service.updateProject(id, data))
})

/** Atalho: NF da primeira parcela em aberto. */
projectsRouter.patch('/:id/nf', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const { issued } = nfBody.parse(req.body)
  res.json(await service.setNextNF(id, issued))
})

projectsRouter.patch('/:id/installments/:number/nf', async (req, res) => {
  const { id, number } = installmentParams.parse(req.params)
  const { issued } = nfBody.parse(req.body)
  res.json(await service.setInstallmentNF(id, number, issued))
})
