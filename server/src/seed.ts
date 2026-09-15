import { PrismaClient, Product } from '@prisma/client'
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

const PROJECTS = [
  { id: 'swithaus', name: 'Swithaus', product: Product.LOOP, po: 'Henrique Góes', running: true, total: 25992.12, paid: 12996.06, nextDate: '2026-09-18', nf: true, description: 'Plataforma web de gestão de pedidos para a rede de lanchonetes Swithaus, com painel administrativo e integração de pagamentos. Entrega em 6 sprints.' },
  { id: 'minas', name: 'Agência Minas', product: Product.LOOP, po: 'Henrique Góes', running: true, total: 102095.24, paid: 79634.16, nextDate: '2026-09-25', nf: true, description: 'Reformulação completa do sistema interno de propostas da agência, incluindo migração de base legada e relatórios gerenciais.' },
  { id: 'junia', name: 'Júnia Pereira Teixeira', product: Product.LOOP, po: 'Guilherme Alves', running: true, total: 25430, paid: 21656.5, nextDate: '2026-09-20', nf: false, description: 'Site institucional com área de agendamento de consultas e envio automático de lembretes por e-mail para os pacientes.' },
  { id: 'gabriela', name: 'START — Gabriela', product: Product.START, po: 'João Vitor Ramos', running: true, total: 2805, paid: 1455, nextDate: '2026-10-02', nf: false, description: 'Landing page de captação para o serviço de consultoria da cliente, com formulário integrado ao CRM e painel simples de leads.' },
  { id: 'marcial', name: 'Marcial Godoi', product: Product.LOOP, po: 'Paulo Menezes', running: true, total: 5000, paid: 1000, nextDate: '2026-09-16', nf: false, description: 'Aplicativo interno de controle de estoque para a distribuidora, com leitura de código de barras e exportação em planilha.' },
  { id: 'robolotto', name: 'Robolotto Bloco 0', product: Product.START, po: 'Marina Cruz', running: true, total: 5500, paid: 1387.5, nextDate: '2026-09-10', nf: false, description: 'Primeiro bloco do projeto: descoberta, arquitetura da informação e protótipo navegável da plataforma de sorteios.' },
  { id: 'fundep', name: 'Reitoria (FUNDEP)', product: Product.LOOP, po: 'Mariana Bastos', running: false, total: 67020, paid: 67020, nextDate: null, nf: true, description: 'Sistema de acompanhamento de convênios da reitoria, entregue em julho de 2026 com treinamento da equipe interna.' },
  { id: 'climel', name: 'Climel', product: Product.LOOP, po: 'Arthur Maciel', running: false, total: 2100, paid: 2100, nextDate: null, nf: true, description: 'Manutenção evolutiva do portal de climatização, com correções de performance e novo módulo de orçamentos.' },
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

  for (const p of PROJECTS) {
    const data = {
      name: p.name,
      description: p.description,
      product: p.product,
      po: p.po,
      running: p.running,
      total: p.total,
      paid: p.paid,
      nextDate: p.nextDate ? fromISODate(p.nextDate) : null,
      nfIssued: p.nf,
    }
    await prisma.project.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } })
  }

  const [people, activities, projects] = await Promise.all([
    prisma.person.count(),
    prisma.activity.count(),
    prisma.project.count(),
  ])
  console.log(`seed ok — ${people} pessoas, ${activities} atividades, ${projects} projetos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
