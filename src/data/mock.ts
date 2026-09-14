/** Dados de demonstração da tela de Atividades. Trocar por chamadas à API quando existir back-end. */

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
