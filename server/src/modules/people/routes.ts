import { Router } from 'express'
import { prisma } from '../../lib/prisma.js'

export const peopleRouter = Router()

peopleRouter.get('/', async (_req, res) => {
  const people = await prisma.person.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, initials: true },
  })
  res.json(people)
})
