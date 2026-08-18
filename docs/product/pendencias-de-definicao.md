# Pendências de definição

**Status:** Aberto. A lista contém somente decisões que o contexto consolidado ainda não respondeu.

Cada item indica a feature que ele bloqueia. Não há pendência genérica marcada como bloqueadora sem relação direta com uma capacidade futura.

## Comercial

| ID | Decisão aberta | Bloqueia |
| --- | --- | --- |
| COM-002 | Definir estados normativos de `Opportunity`, `Proposal`, `Contract` e assinatura, incluindo perda, expiração, cancelamento e reabertura. | Feature de ciclo comercial correspondente. |
| COM-003 | Definir alçadas para preço, exceções, valor oficial e formalização de contrato. | Feature de precificação, proposta ou contrato. |
| COM-004 | Definir governança para criar ou alterar pipes, schemas, formulários, automações, SLA, views e permissões de CRM. | Feature de configuração de CRM. |

## Projetos

| ID | Decisão aberta | Bloqueia |
| --- | --- | --- |
| PRO-002 | Definir conteúdo mínimo de `ScopeBaseline` e fluxo de aprovação de `ChangeRequest`. | Feature de baseline, escopo ou Change Request. |
| PRO-003 | Definir estados formais de projeto, sprint, task, risco, aceite e suporte. | Feature do ciclo operacional correspondente. |
| PRO-004 | Definir regras locais de configuração do board e permissões para alterá-las. | Feature de board de projetos. |
| PRO-005 | Definir evento, pré-condições e responsável pela transição de Project Workspace em preparação para execução ativa. | Feature de ativação ou início operacional de projeto. |
| PRO-006 | Definir relação detalhada entre aceite, Change Request e efeitos financeiros. | Feature de aceite, mudança contratual ou integração Projetos–Financeiro. |

## Financeiro

| ID | Decisão aberta | Bloqueia |
| --- | --- | --- |
| FIN-001 | Definir a ordem de priorização entre subdomínios financeiros. | Escolha da primeira feature financeira. |
| FIN-002 | Definir políticas de criação, alteração e aprovação de `PaymentPlan`, `Installment`, `Obligation`, `Invoice`, reembolso, investimento e fechamento. | Feature da entidade financeira correspondente. |
| FIN-003 | Definir regras de liquidação parcial, renegociação, desconto, multa, juros, estorno e reabertura. | Feature de recebimento, pagamento ou ajuste. |
| FIN-004 | Definir integrações externas necessárias para bancos, emissão fiscal, contabilidade e patrimônio. | Feature de integração financeira externa. |
| FIN-005 | Definir fórmula, aprovações e ciclo de vida de `PartnerRule` e repasses. | Feature de parceria ou repasse. |

## Plataforma Compartilhada e serviços transversais

| ID | Decisão aberta | Bloqueia |
| --- | --- | --- |
| PLA-001 | Definir matriz de capacidades, domínio, cargo, papel, `PlatformPrivilege` e alçada, incluindo concessão, revogação e revisão de privilégios. | Feature com acesso, ação restrita ou aprovação. |
| PLA-003 | Definir política de dados pessoais, auditoria, retenção, exportação, correção e descarte. | Feature que trate dados pessoais, documentos, auditoria ou ciclo de retenção. |
| PLA-004 | Definir metas mensuráveis de desempenho, disponibilidade, recuperação e acessibilidade. | Feature cuja aceitação dependa desses requisitos. |
| PLA-005 | Definir estratégia de migração da planilha financeira, qualidade dos dados, mapeamento e corte. | Feature de migração financeira. |
| PLA-006 | Definir retenção, acesso, versionamento quando aplicável e eventos de `Document`, `Meeting` e `Notification`. | Feature do serviço transversal correspondente. |

## Pendências removidas nesta revisão

- Gatilho de handoff Comercial → Projetos: resolvido como assinatura válida de `Contract`.
- Criação ou preparação de Project Workspace: resolvida como efeito do handoff; início operacional permanece em `PRO-001`.
- Ownership de entidades compartilhadas e de `Contract`: consolidado na matriz de ownership.
- “Projeto financeiro”: removido como termo ambíguo; `Project` é a unidade operacional e `FinancialSummary` é somente projeção de leitura.
