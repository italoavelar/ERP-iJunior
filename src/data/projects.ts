export type Product = 'LOOP' | 'START'

export interface Project {
  id: string
  name: string
  product: Product
  po: string
  running: boolean
  total: number
  paid: number
  /** null quando o contrato já está quitado. */
  nextDate: string | null
  nf: boolean
  description: string
}

export const PROJECTS: Project[] = [
  {
    id: 'swithaus',
    name: 'Swithaus',
    product: 'LOOP',
    po: 'Henrique Góes',
    running: true,
    total: 25992.12,
    paid: 12996.06,
    nextDate: '2026-09-18',
    nf: true,
    description:
      'Plataforma web de gestão de pedidos para a rede de lanchonetes Swithaus, com painel administrativo e integração de pagamentos. Entrega em 6 sprints.',
  },
  {
    id: 'minas',
    name: 'Agência Minas',
    product: 'LOOP',
    po: 'Henrique Góes',
    running: true,
    total: 102095.24,
    paid: 79634.16,
    nextDate: '2026-09-25',
    nf: true,
    description:
      'Reformulação completa do sistema interno de propostas da agência, incluindo migração de base legada e relatórios gerenciais.',
  },
  {
    id: 'junia',
    name: 'Júnia Pereira Teixeira',
    product: 'LOOP',
    po: 'Guilherme Alves',
    running: true,
    total: 25430,
    paid: 21656.5,
    nextDate: '2026-09-20',
    nf: false,
    description:
      'Site institucional com área de agendamento de consultas e envio automático de lembretes por e-mail para os pacientes.',
  },
  {
    id: 'gabriela',
    name: 'START — Gabriela',
    product: 'START',
    po: 'João Vitor Ramos',
    running: true,
    total: 2805,
    paid: 1455,
    nextDate: '2026-10-02',
    nf: false,
    description:
      'Landing page de captação para o serviço de consultoria da cliente, com formulário integrado ao CRM e painel simples de leads.',
  },
  {
    id: 'marcial',
    name: 'Marcial Godoi',
    product: 'LOOP',
    po: 'Paulo Menezes',
    running: true,
    total: 5000,
    paid: 1000,
    nextDate: '2026-09-16',
    nf: false,
    description:
      'Aplicativo interno de controle de estoque para a distribuidora, com leitura de código de barras e exportação em planilha.',
  },
  {
    id: 'robolotto',
    name: 'Robolotto Bloco 0',
    product: 'START',
    po: 'Marina Cruz',
    running: true,
    total: 5500,
    paid: 1387.5,
    nextDate: '2026-09-10',
    nf: false,
    description:
      'Primeiro bloco do projeto: descoberta, arquitetura da informação e protótipo navegável da plataforma de sorteios.',
  },
  {
    id: 'fundep',
    name: 'Reitoria (FUNDEP)',
    product: 'LOOP',
    po: 'Mariana Bastos',
    running: false,
    total: 67020,
    paid: 67020,
    nextDate: null,
    nf: true,
    description:
      'Sistema de acompanhamento de convênios da reitoria, entregue em julho de 2026 com treinamento da equipe interna.',
  },
  {
    id: 'climel',
    name: 'Climel',
    product: 'LOOP',
    po: 'Arthur Maciel',
    running: false,
    total: 2100,
    paid: 2100,
    nextDate: null,
    nf: true,
    description:
      'Manutenção evolutiva do portal de climatização, com correções de performance e novo módulo de orçamentos.',
  },
]

export type Tone = readonly [string, string]

export const productTone = (p: Product): Tone =>
  p === 'START'
    ? ['color-mix(in oklch,var(--blue) 14%,transparent)', 'var(--blue)']
    : ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']

export const nfTone = (has: boolean): Tone =>
  has
    ? ['color-mix(in oklch,var(--primary) 12%,transparent)', 'var(--primary)']
    : ['var(--muted)', 'var(--mutedfg)']

export const pctOf = (p: Project) => Math.round((p.paid / p.total) * 100) + '%'
