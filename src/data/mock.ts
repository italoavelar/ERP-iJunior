/** Dados de demonstração do protótipo. Trocar por chamadas à API quando o back-end existir. */

export type ProjectStatus = 'Em dia' | 'Concluído' | 'Atrasado' | 'Inadimplente' | 'Pausado'

export interface Project {
  id: string
  name: string
  client: string
  payer: string
  manager: string
  product: string
  total: number
  paid: number
  status: ProjectStatus
  nf: boolean
}

export const PROJECTS: Project[] = [
  { id: 'junia', name: 'Júnia Pereira Teixeira', client: 'Júnia P. Teixeira', payer: 'Júnia P. Teixeira', manager: 'Guilherme', product: 'Loop', total: 25430, paid: 21656.5, status: 'Em dia', nf: true },
  { id: 'swithaus', name: 'Swithaus', client: 'Swithaus', payer: 'Camila Reis (financeiro)', manager: 'Henrique', product: 'Loop', total: 25992.12, paid: 12996.06, status: 'Em dia', nf: true },
  { id: 'minas', name: 'Agência Minas', client: 'Agência Minas', payer: 'Rodrigo Alves', manager: 'Henrique', product: 'Loop', total: 102095.24, paid: 79634.16, status: 'Em dia', nf: true },
  { id: 'gabriela', name: 'START — Gabriela', client: 'Gabriela', payer: 'Gabriela', manager: 'João Vitor', product: 'Start', total: 2805, paid: 1455, status: 'Em dia', nf: false },
  { id: 'fundep', name: 'Reitoria (FUNDEP)', client: 'FUNDEP', payer: 'Setor de contratos', manager: 'Mariana', product: 'Loop', total: 67020, paid: 67020, status: 'Concluído', nf: true },
  { id: 'victor', name: 'Victor Mendes', client: 'Victor Mendes', payer: 'Victor Mendes', manager: 'Mariana', product: 'Loop', total: 15800, paid: 5500, status: 'Atrasado', nf: false },
  { id: 'climel', name: 'Climel', client: 'Climel', payer: 'Financeiro Climel', manager: 'Arthur Maciel', product: 'Loop', total: 2100, paid: 2100, status: 'Concluído', nf: true },
  { id: 'robolotto', name: 'Robolotto Bloco 0', client: 'Robolotto', payer: 'Robolotto', manager: '—', product: 'Loop', total: 5500, paid: 1387.5, status: 'Inadimplente', nf: false },
  { id: 'marcial', name: 'Marcial Godoi', client: 'Marcial Godoi', payer: 'Marcial Godoi', manager: 'Paulo', product: 'Loop', total: 5000, paid: 1000, status: 'Em dia', nf: false },
]

export interface Person {
  id: string
  name: string
  initials: string
}

export const PEOPLE: Person[] = [
  { id: 'fs', name: 'Felipe Souza', initials: 'FS' },
  { id: 'ad', name: 'Ana Duarte', initials: 'AD' },
  { id: 'bl', name: 'Bruno Lima', initials: 'BL' },
  { id: 'mc', name: 'Marina Cruz', initials: 'MC' },
  { id: 'hg', name: 'Henrique Góes', initials: 'HG' },
]

export type Priority = 'Alta' | 'Média' | 'Baixa'

export interface KanbanTask {
  col: number
  title: string
  owner: string
  initials: string
  project: string
  prio: Priority
  mine?: boolean
}

export const KANBAN_TASKS: KanbanTask[] = [
  { col: 0, title: 'Emitir NF da parcela 4 — Swithaus', owner: 'Felipe Souza', initials: 'FS', project: 'Swithaus', prio: 'Alta', mine: true },
  { col: 0, title: 'Conferir extrato bancário de agosto', owner: 'Ana Duarte', initials: 'AD', project: 'Tarefa avulsa', prio: 'Média' },
  { col: 1, title: 'Cobrar parcela vencida — Robolotto', owner: 'Felipe Souza', initials: 'FS', project: 'Robolotto Bloco 0', prio: 'Alta', mine: true },
  { col: 1, title: 'Montar plano de parcelas — Marcial Godoi', owner: 'Bruno Lima', initials: 'BL', project: 'Marcial Godoi', prio: 'Média' },
  { col: 1, title: 'Atualizar planilha de previsão', owner: 'Ana Duarte', initials: 'AD', project: 'Tarefa avulsa', prio: 'Baixa' },
  { col: 2, title: 'Revisar contrato — Agência Minas', owner: 'Felipe Souza', initials: 'FS', project: 'Agência Minas', prio: 'Média', mine: true },
  { col: 2, title: 'Validar estorno solicitado pela VP', owner: 'Marina Cruz', initials: 'MC', project: 'Victor Mendes', prio: 'Alta' },
  { col: 3, title: 'Fechar recebimentos de julho', owner: 'Bruno Lima', initials: 'BL', project: 'Tarefa avulsa', prio: 'Baixa' },
  { col: 3, title: 'Emitir NF final — Reitoria (FUNDEP)', owner: 'Marina Cruz', initials: 'MC', project: 'Reitoria (FUNDEP)', prio: 'Média' },
]

export const KANBAN_COLUMNS = ['A fazer', 'Em andamento', 'Em revisão', 'Concluído']

export interface Notification {
  text: string
  project: string
  time: string
  kind: 'warn' | 'bad'
}

export const NOTIFICATIONS: Notification[] = [
  { text: 'Parcela 4 vence em 2 dias', project: 'Swithaus', time: 'há 20 min', kind: 'warn' },
  { text: 'NF da parcela 3 pendente de emissão', project: 'Marcial Godoi', time: 'há 2 h', kind: 'warn' },
  { text: 'Parcela 2 venceu há 12 dias', project: 'Robolotto Bloco 0', time: 'ontem', kind: 'bad' },
  { text: 'Parcela 5 vence em 6 dias', project: 'Agência Minas', time: 'ontem', kind: 'warn' },
  { text: 'NF final pendente após quitação', project: 'Reitoria (FUNDEP)', time: 'há 3 dias', kind: 'warn' },
]

export interface Activity {
  id: number
  title: string
  details: string
  people: string[]
  done: boolean
  doneAt: string | null
}

export const ACTIVITIES: Activity[] = [
  { id: 1, title: 'Conferir extrato bancário de setembro', details: 'Bater o extrato do Banco do Brasil com os recebimentos registrados. Sinalizar divergências acima de R$ 50.', people: ['fs', 'ad'], done: false, doneAt: null },
  { id: 2, title: 'Montar plano de parcelas — Marcial Godoi', details: 'Contrato fechado em 5 parcelas mensais. Definir vencimentos e cadastrar no financeiro.', people: ['bl'], done: false, doneAt: null },
  { id: 3, title: 'Cobrar parcela vencida — Robolotto', details: 'Parcela 2 vencida há 12 dias, sem retorno por e-mail. Tentar contato pelo telefone do responsável.', people: ['mc'], done: false, doneAt: null },
  { id: 4, title: 'Fechar recebimentos de agosto', details: 'Consolidar valores do mês e enviar resumo para a VP antes da reunião de diretoria.', people: ['bl', 'hg'], done: true, doneAt: '2026-09-05' },
  { id: 5, title: 'Emitir NF da parcela 4 — Swithaus', details: 'Nota emitida no portal da prefeitura e enviada ao contato financeiro do cliente.', people: ['fs'], done: true, doneAt: '2026-09-08' },
  { id: 6, title: 'Atualizar planilha de previsão', details: 'Revisão das entradas previstas para o trimestre.', people: ['ad', 'fs'], done: true, doneAt: '2026-09-11' },
]

export const UPCOMING = [
  { project: 'Swithaus', date: '10/09', value: 4332.02, nf: true },
  { project: 'Agência Minas', date: '15/09', value: 11343.91, nf: true },
  { project: 'Marcial Godoi', date: '18/09', value: 1000, nf: false },
  { project: 'START — Gabriela', date: '22/09', value: 450, nf: false },
]

export const PENDING_NF = [
  { project: 'Marcial Godoi', value: 1000 },
  { project: 'START — Gabriela', value: 450 },
  { project: 'Robolotto Bloco 0', value: 1387.5 },
]

export type Role = 'vp' | 'gerente' | 'assessor'

export const ROLE_LABEL: Record<Role, string> = {
  vp: 'VP',
  gerente: 'Gerente do financeiro',
  assessor: 'Assessor',
}

export const permissionsFor = (role: Role) => ({
  edit: role !== 'assessor',
  estorno: role === 'vp',
  task: role !== 'assessor',
})
