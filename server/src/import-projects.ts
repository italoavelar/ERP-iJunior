/**
 * Importa projetos, parcelas e sprints de um arquivo JSON.
 *
 *   npm run db:import                 # prisma/data/projetos.json (ou o exemplo)
 *   npm run db:import -- --prune      # também apaga projetos que não estão no arquivo
 *   npm run db:import -- caminho.json
 *
 * Cada projeto do arquivo tem seu plano de parcelas e sprints recriado. Se o
 * arquivo trouxer `check`, a importação falha quando as somas não batem.
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import './env.js'
import { fromISODate } from './lib/serialize.js'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const installmentSchema = z.object({
  description: z.string().default(''),
  amount: z.number().positive(),
  dueDate: isoDate.nullable(),
  paid: z.boolean(),
  paidAt: isoDate.nullable(),
  paidAmount: z.number().positive().optional(),
  nfIssued: z.boolean(),
  sprintNumber: z.number().int().positive().optional(),
  notes: z.string().default(''),
})

const projectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  client: z.string().default(''),
  product: z.enum(['LOOP', 'START']).nullable(),
  po: z.string().default(''),
  description: z.string().default(''),
  notes: z.string().default(''),
  running: z.boolean(),
  sprints: z
    .object({ count: z.number().int().positive(), validated: z.array(z.number().int().positive()) })
    .optional(),
  check: z.object({ total: z.number(), received: z.number() }).optional(),
  installments: z.array(installmentSchema).min(1),
})

const fileSchema = z.object({ source: z.string().optional(), projects: z.array(projectSchema) })

const cents = (n: number) => Math.round(n * 100)

function resolveFile(arg?: string) {
  if (arg) return arg
  const real = fileURLToPath(new URL('../prisma/data/projetos.json', import.meta.url))
  if (existsSync(real)) return real
  return fileURLToPath(new URL('../prisma/data/projetos.example.json', import.meta.url))
}

async function main() {
  const args = process.argv.slice(2)
  const prune = args.includes('--prune')
  const file = resolveFile(args.find((a) => !a.startsWith('--')))
  const data = fileSchema.parse(JSON.parse(readFileSync(file, 'utf8')))

  // Confere tudo antes de gravar qualquer coisa.
  for (const p of data.projects) {
    const total = p.installments.reduce((a, i) => a + cents(i.amount), 0)
    const received = p.installments
      .filter((i) => i.paid)
      .reduce((a, i) => a + cents(i.paidAmount ?? i.amount), 0)
    if (p.check && (total !== cents(p.check.total) || received !== cents(p.check.received))) {
      throw new Error(
        `${p.id}: parcelas somam ${total / 100} / recebido ${received / 100}, ` +
          `mas o esperado é ${p.check.total} / ${p.check.received}`,
      )
    }
    for (const i of p.installments) {
      if (i.paid !== (i.paidAt !== null)) {
        throw new Error(`${p.id}: "${i.description}" — paga e data de pagamento não combinam`)
      }
      if (i.sprintNumber && (!p.sprints || i.sprintNumber > p.sprints.count)) {
        throw new Error(`${p.id}: "${i.description}" aponta para uma sprint que não existe`)
      }
    }
  }

  const prisma = new PrismaClient()
  try {
    await prisma.$transaction(async (tx) => {
      for (const p of data.projects) {
        const fields = {
          name: p.name,
          client: p.client,
          product: p.product,
          po: p.po,
          description: p.description,
          notes: p.notes,
          running: p.running,
        }
        await tx.project.upsert({ where: { id: p.id }, update: fields, create: { id: p.id, ...fields } })
        await tx.installment.deleteMany({ where: { projectId: p.id } })
        await tx.sprint.deleteMany({ where: { projectId: p.id } })

        await tx.installment.createMany({
          data: p.installments.map((i, idx) => ({
            projectId: p.id,
            number: idx + 1,
            description: i.description,
            amount: i.amount,
            dueDate: i.dueDate ? fromISODate(i.dueDate) : null,
            paid: i.paid,
            paidAt: i.paidAt ? fromISODate(i.paidAt) : null,
            paidAmount: i.paidAmount ?? null,
            nfIssued: i.nfIssued,
            sprintNumber: i.sprintNumber ?? null,
            notes: i.notes,
          })),
        })

        if (p.sprints) {
          const validated = new Set(p.sprints.validated)
          await tx.sprint.createMany({
            data: Array.from({ length: p.sprints.count }, (_, k) => ({
              projectId: p.id,
              number: k + 1,
              validated: validated.has(k + 1),
            })),
          })
        }
      }

      if (prune) {
        const keep = data.projects.map((p) => p.id)
        const removed = await tx.project.findMany({
          where: { id: { notIn: keep } },
          select: { name: true },
        })
        await tx.project.deleteMany({ where: { id: { notIn: keep } } })
        if (removed.length) console.log(`removidos: ${removed.map((r) => r.name).join(', ')}`)
      }
    })

    const [projects, installments, sprints] = await Promise.all([
      prisma.project.count(),
      prisma.installment.count(),
      prisma.sprint.count(),
    ])
    console.log(
      `importado de ${file.split('/').slice(-2).join('/')} — ${projects} projetos, ${installments} parcelas, ${sprints} sprints`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
