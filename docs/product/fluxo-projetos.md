# Fluxo de projetos

**Status:** Estrutura operacional, preparação e separação entre escopo contratado e execução confirmadas.

## Entrada, preparação e início operacional

Assinatura válida de `Contract` habilita o handoff Comercial → Projetos. O handoff cria ou prepara um Project Workspace próprio sem redigitação, preservando referências à oportunidade, proposta, contrato, escopo, riscos, equipe planejada, cronograma, plano financeiro, decisões e documentos.

Criação ou preparação do Project Workspace não implica início imediato da execução. O fluxo possui estados conceituais distintos:

```text
Handoff
  → Project Workspace em preparação
  → ScopeBaseline inicial
  → Project pronto para execução
  → Execução ativa
  → Entregas e aceite aplicável
  → Encerramento operacional
  → Histórico
```

O evento e as pré-condições que permitem a transição de preparação para execução ativa permanecem abertos. O encerramento operacional não determina, por si só, o encerramento financeiro.

## Estrutura do Project Workspace

| Área | Responsabilidade |
| --- | --- |
| Visão Geral | Contexto, situação e referências do projeto. |
| Escopo | Baseline, versões, critérios e mudanças contratuais. |
| Equipe | Atribuições, papéis e responsabilidades. |
| Board | Operação diária de tasks. |
| Sprints | Planejamento e acompanhamento de ciclos de trabalho. |
| Reuniões e Atas | Vínculos com reuniões, atas e decisões. |
| Sucesso do Cliente | Relacionamento, NPS, feedback, suporte, pendências e acompanhamento vinculado ao projeto. |
| Riscos | Registro e acompanhamento de riscos do projeto. |
| Documentos | Vínculos com evidências e documentação. |
| Financeiro | Visão de leitura do contexto financeiro relacionado, respeitando ownership do Financeiro. |
| Auditoria | Eventos críticos e alterações relevantes. |
| Histórico | Linha do tempo e referências preservadas do projeto. |

Sucesso do Cliente é uma capacidade do Project Workspace, não um banco de dados paralelo.

## Papéis na operação diária

| Papel | Responsabilidades confirmadas |
| --- | --- |
| PO | Organiza backlog, distribui trabalho, conduz Scrum, define prioridades, cria e gerencia tasks, abre e fecha sprints, acompanha critérios de aceite e pode solicitar Change Request. |
| LT | Define ou valida stack, organiza versionamento, revisa PRs, orienta arquitetura, acompanha Docker e deploy, atua em qualidade técnica, pode vincular PRs às tasks e registra decisões técnicas. |
| Desenvolvedor | Implementa, testa, documenta, abre PR e atualiza task. |
| Designer | Atua em UX, prototipação, UI, handoff visual e validação de interface. |

## Execução Scrum/Kanban

A operação diária usa Scrum/Kanban. O board padrão candidato é:

```text
Backlog → Ready → Em andamento → Review → QA/Teste → Concluído
```

O board pode ser configurado localmente sem reescrever escopo contratado ou eliminar histórico de transições relevantes.

## ProjectTask

Uma `ProjectTask` pode possuir, quando aplicável, título, descrição, tipo, prioridade, responsáveis, sprint, estimativa, prazo, labels, checklist, critérios de aceite, dependências, bloqueios, anexos, comentários, referências a PR/Figma e histórico.

Tasks organizam execução operacional. `ProjectTask != escopo contratado`.

## Escopo contratado e Change Request

`CommercialScope` pertence ao Comercial. Depois do handoff, a primeira `ScopeBaseline` preserva o escopo contratado no contexto de Projetos.

```text
ScopeBaseline → ChangeRequest → ScopeVersion
```

- PO pode reorganizar backlog, tasks e sprints sem alterar contrato.
- Mudanças em escopo, valor, prazo contratual ou critérios contratuais exigem `ChangeRequest` ou mecanismo equivalente com histórico.
- Mudança aprovada com efeito em valor ou condição contratual exige `Contract Amendment` ou mecanismo equivalente e revisão controlada de `PaymentPlan`.
- Apenas obrigações ou parcelas legal e operacionalmente alteráveis podem ser atualizadas. Parcela liquidada não é reescrita.

## Decisões realmente abertas

- Evento, pré-condições e responsável para transição de Project Workspace em preparação para execução ativa.
- Conteúdo mínimo da `ScopeBaseline` e fluxo de aprovação de `ChangeRequest`.
- Estados formais de projeto, sprint, task, risco, aceite e suporte.
- Regras locais de configuração do board e permissões para alterá-las.
- Relação detalhada entre aceite, Change Request e efeitos financeiros.
