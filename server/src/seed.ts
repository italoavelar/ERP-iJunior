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

/** Divide um valor em `parts` parcelas de centavos exatos; a última absorve o resto. */
function split(amount: number, parts: number): number[] {
  if (parts <= 0) return []
  const cents = Math.round(amount * 100)
  const base = Math.floor(cents / parts)
  const out = Array.from({ length: parts }, () => base)
  out[parts - 1] = cents - base * (parts - 1)
  return out.map((c) => c / 100)
}

/** Soma meses a uma data YYYY-MM-DD, preservando o dia. */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1 + months, d!))
  return date.toISOString().slice(0, 10)
}

/**
 * Monta o plano: `paidCount` parcelas pagas que somam exatamente `paid`, e o
 * restante em aberto somando `total - paid`. A âncora é o vencimento da
 * primeira parcela em aberto (ou da última paga, se o contrato está quitado).
 */
function buildInstallments(p: {
  total: number
  paid: number
  count: number
  paidCount: number
  anchor: string
  nf: boolean
}) {
  const paidAmounts = split(p.paid, p.paidCount)
  const openAmounts = split(p.total - p.paid, p.count - p.paidCount)
  const amounts = [...paidAmounts, ...openAmounts]
  // Quitado: a âncora é a última parcela; senão, é a primeira em aberto.
  const anchorIndex = p.paidCount < p.count ? p.paidCount : p.count - 1

  return amounts.map((amount, i) => ({
    number: i + 1,
    dueDate: addMonths(p.anchor, i - anchorIndex),
    amount,
    paid: i < p.paidCount,
    // Parcela paga já teve NF; a próxima segue o que o projeto tinha marcado.
    nfIssued: i < p.paidCount || (i === p.paidCount && p.nf),
  }))
}

const PROJECTS = [
  { id: 'swithaus', name: 'Swithaus', product: Product.LOOP, po: 'Henrique Góes', running: true, total: 25992.12, paid: 12996.06, count: 6, paidCount: 3, anchor: '2026-09-18', nf: true, description: 'Plataforma web de gestão de pedidos para a rede de lanchonetes Swithaus, com painel administrativo e integração de pagamentos. Entrega em 6 sprints.' },
  { id: 'minas', name: 'Agência Minas', product: Product.LOOP, po: 'Henrique Góes', running: true, total: 102095.24, paid: 79634.16, count: 9, paidCount: 7, anchor: '2026-09-25', nf: true, description: 'Reformulação completa do sistema interno de propostas da agência, incluindo migração de base legada e relatórios gerenciais.' },
  { id: 'junia', name: 'Júnia Pereira Teixeira', product: Product.LOOP, po: 'Guilherme Alves', running: true, total: 25430, paid: 21656.5, count: 6, paidCount: 5, anchor: '2026-09-20', nf: false, description: 'Site institucional com área de agendamento de consultas e envio automático de lembretes por e-mail para os pacientes.' },
  { id: 'gabriela', name: 'START — Gabriela', product: Product.START, po: 'João Vitor Ramos', running: true, total: 2805, paid: 1455, count: 3, paidCount: 1, anchor: '2026-10-02', nf: false, description: 'Landing page de captação para o serviço de consultoria da cliente, com formulário integrado ao CRM e painel simples de leads.' },
  { id: 'marcial', name: 'Marcial Godoi', product: Product.LOOP, po: 'Paulo Menezes', running: true, total: 5000, paid: 1000, count: 5, paidCount: 1, anchor: '2026-09-16', nf: false, description: 'Aplicativo interno de controle de estoque para a distribuidora, com leitura de código de barras e exportação em planilha.' },
  { id: 'robolotto', name: 'Robolotto Bloco 0', product: Product.START, po: 'Marina Cruz', running: true, total: 5500, paid: 1387.5, count: 4, paidCount: 1, anchor: '2026-09-10', nf: false, description: 'Primeiro bloco do projeto: descoberta, arquitetura da informação e protótipo navegável da plataforma de sorteios.' },
  { id: 'fundep', name: 'Reitoria (FUNDEP)', product: Product.LOOP, po: 'Mariana Bastos', running: false, total: 67020, paid: 67020, count: 6, paidCount: 6, anchor: '2026-07-10', nf: true, description: 'Sistema de acompanhamento de convênios da reitoria, entregue em julho de 2026 com treinamento da equipe interna.' },
  { id: 'climel', name: 'Climel', product: Product.LOOP, po: 'Arthur Maciel', running: false, total: 2100, paid: 2100, count: 3, paidCount: 3, anchor: '2026-06-10', nf: true, description: 'Manutenção evolutiva do portal de climatização, com correções de performance e novo módulo de orçamentos.' },
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
    }
    await prisma.project.upsert({ where: { id: p.id }, update: data, create: { id: p.id, ...data } })

    const plan = buildInstallments(p)
    const sum = plan.reduce((a, i) => a + i.amount, 0)
    if (Math.abs(sum - p.total) > 0.001) {
      throw new Error(`Plano de ${p.id} soma ${sum}, mas o total é ${p.total}`)
    }
    const paidSum = plan.filter((i) => i.paid).reduce((a, i) => a + i.amount, 0)
    if (Math.abs(paidSum - p.paid) > 0.001) {
      throw new Error(`Parcelas pagas de ${p.id} somam ${paidSum}, mas o pago é ${p.paid}`)
    }

    // Replanejar é recriar: o plano é derivado, não editado parcela a parcela aqui.
    await prisma.installment.deleteMany({ where: { projectId: p.id } })
    await prisma.installment.createMany({
      data: plan.map((i) => ({ ...i, projectId: p.id, dueDate: fromISODate(i.dueDate) })),
    })
  }

  const [people, activities, projects, installments] = await Promise.all([
    prisma.person.count(),
    prisma.activity.count(),
    prisma.project.count(),
    prisma.installment.count(),
  ])
  console.log(
    `seed ok — ${people} pessoas, ${activities} atividades, ${projects} projetos, ${installments} parcelas`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
