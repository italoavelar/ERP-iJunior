import express from 'express'
import cors from 'cors'
import { env } from './env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { peopleRouter } from './modules/people/routes.js'
import { activitiesRouter } from './modules/activities/routes.js'
import { projectsRouter } from './modules/projects/routes.js'
import { installmentsRouter } from './modules/installments/routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.corsOrigins }))
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  app.use('/api/people', peopleRouter)
  app.use('/api/activities', activitiesRouter)
  app.use('/api/projects', projectsRouter)
  app.use('/api/installments', installmentsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
