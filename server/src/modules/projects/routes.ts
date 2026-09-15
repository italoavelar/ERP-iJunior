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

const installmentBody = z
  .object({
    paid: z.boolean(),
    nfIssued: z.boolean(),
    amount: z.number().positive('O valor da parcela precisa ser maior que zero.'),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo.' })

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

const replanBody = z
  .object({
    total: z.number().positive('O preço total precisa ser maior que zero.'),
    count: z
      .number()
      .int('O número de parcelas precisa ser inteiro.')
      .min(1, 'O plano precisa de ao menos uma parcela.')
      .max(120, 'No máximo 120 parcelas.'),
    firstDueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe o primeiro vencimento.'),
    paidCount: z.number().int().min(0, 'Não dá para ter parcelas pagas negativas.'),
  })
  .refine((v) => v.paidCount <= v.count, {
    path: ['paidCount'],
    message: 'Não dá para ter mais parcelas pagas do que parcelas.',
  })

/** Refaz o plano: preço, número de parcelas, primeiro vencimento e pagas. */
projectsRouter.put('/:id/installments', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const input = replanBody.parse(req.body)
  res.json(await service.replan(id, input))
})

/** Pagamento, NF ou valor de uma parcela. */
projectsRouter.patch('/:id/installments/:number', async (req, res) => {
  const { id, number } = installmentParams.parse(req.params)
  const data = installmentBody.parse(req.body)
  res.json(await service.updateInstallment(id, number, data))
})
