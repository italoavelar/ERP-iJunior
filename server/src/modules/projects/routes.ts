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
    client: z.string().trim(),
    description: z.string().trim(),
    notes: z.string().trim(),
    po: z.string().trim(),
    product: z.enum(['LOOP', 'START']).nullable(),
    running: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo.' })

const nfBody = z.object({ issued: z.boolean() })

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')

const installmentBody = z
  .object({
    paid: z.boolean(),
    nfIssued: z.boolean(),
    amount: z.number().positive('O valor da parcela precisa ser maior que zero.'),
    dueDate: isoDate.nullable(),
    paidAt: isoDate.nullable(),
    description: z.string().trim(),
    notes: z.string().trim(),
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

const sprintParams = z.object({
  id: z.string().min(1),
  number: z.coerce.number().int().positive(),
})
const sprintBody = z.object({ validated: z.boolean(), date: isoDate.optional() })

/** Valida uma sprint (libera a cobrança das parcelas ligadas a ela) ou desfaz. */
projectsRouter.patch('/:id/sprints/:number', async (req, res) => {
  const { id, number } = sprintParams.parse(req.params)
  const { validated, date } = sprintBody.parse(req.body)
  res.json(await service.setSprintValidated(id, number, validated, date))
})

/** Pagamento, NF, valor, vencimento ou descrição de uma parcela. */
projectsRouter.patch('/:id/installments/:number', async (req, res) => {
  const { id, number } = installmentParams.parse(req.params)
  const data = installmentBody.parse(req.body)
  res.json(await service.updateInstallment(id, number, data))
})
