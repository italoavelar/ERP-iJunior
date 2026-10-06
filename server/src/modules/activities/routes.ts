import { Router } from 'express'
import { z } from 'zod'
import {
  createActivitySchema,
  listQuerySchema,
  updateActivitySchema,
} from './schemas.js'
import * as service from './service.js'

export const activitiesRouter = Router()

const idParam = z.object({ id: z.string().min(1) })

activitiesRouter.get('/', async (req, res) => {
  const { status } = listQuerySchema.parse(req.query)
  res.json(await service.listActivities(status))
})

activitiesRouter.post('/', async (req, res) => {
  const input = createActivitySchema.parse(req.body)
  res.status(201).json(await service.createActivity(input))
})

activitiesRouter.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  const input = updateActivitySchema.parse(req.body)
  res.json(await service.updateActivity(id, input))
})

activitiesRouter.post('/:id/toggle', async (req, res) => {
  const { id } = idParam.parse(req.params)
  res.json(await service.toggleActivity(id))
})

activitiesRouter.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params)
  await service.deleteActivity(id)
  res.status(204).end()
})
