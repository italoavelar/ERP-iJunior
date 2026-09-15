import { prisma } from '../../lib/prisma.js'
import { toISODate } from '../../lib/serialize.js'
import { HttpError, notFound } from '../../lib/httpError.js'

const withAssignees = {
  include: { assignees: { select: { id: true }, orderBy: { name: 'asc' } } },
} as const

type ActivityRow = Awaited<ReturnType<typeof prisma.activity.findFirstOrThrow<typeof withAssignees>>>

/** Formato que o front consome: responsáveis como lista de ids. */
export const serialize = (a: ActivityRow) => ({
  id: a.id,
  title: a.title,
  details: a.details,
  done: a.done,
  doneAt: toISODate(a.doneAt),
  people: a.assignees.map((p) => p.id),
})

/** Falha cedo se algum id de responsável não existir, em vez de deixar o Prisma
 *  estourar um erro de conexão pouco informativo. */
async function assertPeopleExist(ids: string[]) {
  const found = await prisma.person.findMany({ where: { id: { in: ids } }, select: { id: true } })
  const missing = ids.filter((id) => !found.some((p) => p.id === id))
  if (missing.length) {
    throw new HttpError(422, `Responsável inexistente: ${missing.join(', ')}`)
  }
}

export async function listActivities(status?: 'open' | 'done') {
  const rows = await prisma.activity.findMany({
    where: status ? { done: status === 'done' } : undefined,
    orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
    ...withAssignees,
  })
  return rows.map(serialize)
}

export async function createActivity(input: { title: string; details: string; people: string[] }) {
  await assertPeopleExist(input.people)
  const row = await prisma.activity.create({
    data: {
      title: input.title,
      details: input.details,
      assignees: { connect: input.people.map((id) => ({ id })) },
    },
    ...withAssignees,
  })
  return serialize(row)
}

export async function updateActivity(
  id: string,
  input: { title?: string; details?: string; people?: string[] },
) {
  if (input.people) await assertPeopleExist(input.people)
  const row = await prisma.activity.update({
    where: { id },
    data: {
      title: input.title,
      details: input.details,
      // `set` troca a lista inteira, que é o que a tela de edição faz.
      assignees: input.people ? { set: input.people.map((pid) => ({ id: pid })) } : undefined,
    },
    ...withAssignees,
  })
  return serialize(row)
}

/** Alterna concluída/aberta. `doneAt` acompanha: recebe hoje ao concluir, zera ao reabrir. */
export async function toggleActivity(id: string) {
  const current = await prisma.activity.findUnique({ where: { id }, select: { done: true } })
  if (!current) throw notFound('Atividade')

  const done = !current.done
  const row = await prisma.activity.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
    ...withAssignees,
  })
  return serialize(row)
}

export async function deleteActivity(id: string) {
  await prisma.activity.delete({ where: { id } })
}
