import { PrismaClient } from '@prisma/client'
import { fromISODate } from './lib/serialize.js'

const prisma = new PrismaClient()

const PEOPLE = [
  { id: 'fs', name: 'Felipe Souza', initials: 'FS' },
  { id: 'ad', name: 'Ana Duarte', initials: 'AD' },
  { id: 'bl', name: 'Bruno Lima', initials: 'BL' },
  { id: 'mc', name: 'Marina Cruz', initials: 'MC' },
  { id: 'hg', name: 'Henrique Góes', initials: 'HG' },
]

const ACTIVITIES = [
  { id: 'a1', title: 'Conferir extrato bancário de setembro', details: 'Bater o extrato do Banco do Brasil com os recebimentos registrados. Sinalizar divergências acima de R$ 50.', people: ['fs', 'ad'], done: false, doneAt: null },
  { id: 'a2', title: 'Montar plano de parcelas — Marcial Godoi', details: 'Contrato fechado em 5 parcelas mensais. Definir vencimentos e cadastrar no financeiro.', people: ['bl'], done: false, doneAt: null },
  { id: 'a3', title: 'Cobrar parcela vencida — Robolotto', details: 'Parcela 2 vencida há 12 dias, sem retorno por e-mail. Tentar contato pelo telefone do responsável.', people: ['mc'], done: false, doneAt: null },
  { id: 'a4', title: 'Fechar recebimentos de agosto', details: 'Consolidar valores do mês e enviar resumo para a VP antes da reunião de diretoria.', people: ['bl', 'hg'], done: true, doneAt: '2026-09-05' },
  { id: 'a5', title: 'Emitir NF da parcela 4 — Swithaus', details: 'Nota emitida no portal da prefeitura e enviada ao contato financeiro do cliente.', people: ['fs'], done: true, doneAt: '2026-09-08' },
  { id: 'a6', title: 'Atualizar planilha de previsão', details: 'Revisão das entradas previstas para o trimestre.', people: ['ad', 'fs'], done: true, doneAt: '2026-09-11' },
]

async function main() {
  for (const p of PEOPLE) {
    await prisma.person.upsert({ where: { id: p.id }, update: p, create: p })
  }

  for (const a of ACTIVITIES) {
    const data = {
      title: a.title,
      details: a.details,
      done: a.done,
      doneAt: a.doneAt ? fromISODate(a.doneAt) : null,
      assignees: { set: a.people.map((id) => ({ id })) },
    }
    await prisma.activity.upsert({
      where: { id: a.id },
      update: data,
      create: {
        id: a.id,
        ...data,
        assignees: { connect: a.people.map((id) => ({ id })) },
      },
    })
  }


  const [people, activities] = await Promise.all([prisma.person.count(), prisma.activity.count()])
  console.log(`seed ok — ${people} pessoas, ${activities} atividades (projetos: npm run db:import)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
