# Entidades e ownership

**Status:** Catálogo conceitual e matriz inicial de ownership confirmados. Os nomes não definem modelo físico.

## Significado de ownership

Ownership é a autoridade sobre criação, alteração, transição de ciclo de vida, correção e regras de uma entidade. Não representa exclusividade de leitura. Outros domínios podem consumir referências ou projeções autorizadas sem se tornarem proprietários.

## Plataforma Compartilhada e serviços transversais

| Entidade | Owner | Papel |
| --- | --- | --- |
| `User` | Plataforma Compartilhada | Identidade de acesso ao ERP. |
| `Member` | Plataforma Compartilhada | Pessoa vinculada à organização. Pode migrar de ownership para RH se esse domínio for criado. |
| `Client` | Plataforma Compartilhada | Contraparte cliente reutilizada pelos domínios. |
| `Contact` | Plataforma Compartilhada | Interlocutor relacionado a cliente, parceria ou interação. |
| `Partner` | Plataforma Compartilhada | Parceiro estruturado, relacionável a múltiplos contratos e projetos. |
| `Tag` | Plataforma Compartilhada | Classificação transversal que não substitui taxonomias de negócio. |
| `Document` | Serviço transversal | Documento ou anexo vinculado a um contexto de negócio. Versionamento, retenção e acesso detalhados permanecem abertos. |
| `Comment` | Serviço transversal | Discussão vinculada a um contexto de negócio. |
| `Meeting` | Serviço transversal | Reunião, ata e decisões vinculadas a contextos de domínio. |
| `Notification` | Serviço transversal | Comunicação de eventos e pendências. Seus eventos e regras de entrega permanecem abertos. |
| `AuditEvent` | Serviço transversal | Registro de alteração crítica, autor, momento e contexto. |

## CRM / Comercial

| Entidade | Owner | Papel conceitual |
| --- | --- | --- |
| `CrmWorkspace` | Comercial | Agrupa processos configuráveis de CRM. |
| `CrmPipe` | Comercial | Define um fluxo configurável dentro de um workspace. |
| `CrmStage` | Comercial | Define etapa de um pipe. |
| `CrmCard` | Comercial | Unidade visual e processual do pipe; orquestra referências, sem substituir entidades comerciais auditáveis. |
| `CrmCardType` | Comercial | Especializa schema e comportamento de card. |
| `CrmFieldDefinition` | Comercial | Define campo configurável de card. |
| `CrmFieldValue` | Comercial | Guarda valor extensível de card; não é fonte primária para fatos auditáveis ou versionados. |
| `CrmCardRelation` | Comercial | Expressa relação entre cards ou com contextos externos. |
| `CrmActivity` | Comercial | Registra atividade ligada ao CRM. |
| `CrmAutomationRule` | Comercial | Define automação configurável de processo. |
| `CrmView` | Comercial | Define visão configurável de leitura. |
| `CrmForm` | Comercial | Define formulário configurável. |
| `Opportunity` | Comercial | Oportunidade comercial orquestrada por CrmCard. |
| `SizingAssessment` | Comercial | Avaliação versionada que fundamenta preço e proposta. |
| `CommercialScope` | Comercial | Escopo negociado antes de se tornar baseline contratual do projeto. |
| `Pricing` | Comercial | Estrutura de precificação associada à oportunidade, avaliação e proposta. |
| `Proposal` | Comercial | Oferta comercial com versão, status e histórico próprios. |
| `Contract` | Comercial | Instrumento criado e formalizado no ciclo comercial; assinado, torna-se fato compartilhado e imutável in-place. |
| `Offering` | Comercial | Produto ou serviço ofertável pela iJúnior. Não é sinônimo de escopo. |

## Projetos

| Entidade | Owner | Papel conceitual |
| --- | --- | --- |
| `Project` | Projetos | Unidade operacional criada ou preparada após o handoff. |
| `ProjectAssignment` | Projetos | Vincula membro, papel e responsabilidade a um projeto. |
| `ScopeBaseline` / `ScopeVersion` | Projetos | Preserva escopo contratado e sua evolução controlada. |
| `ChangeRequest` | Projetos | Registra mudança com impacto de escopo, prazo, valor ou critério. |
| `Sprint` | Projetos | Organiza ciclos de trabalho. |
| `ProjectTask` | Projetos | Organiza execução operacional em board e sprints. |
| `Risk` | Projetos | Registra risco no contexto de projeto. |
| `CustomerSuccessRecord` | Projetos | Registra acompanhamento de Sucesso do Cliente vinculado ao projeto. |

## Financeiro

| Entidade | Owner | Papel conceitual |
| --- | --- | --- |
| `PaymentPlan` | Financeiro | Organiza condições e programação de pagamento derivadas do contrato aplicável. |
| `Installment` | Financeiro | Parcela com valor, vencimento, situação e histórico de liquidação. |
| `Obligation` | Financeiro | Obrigação financeira a receber ou pagar. |
| `Invoice` | Financeiro | Nota fiscal ou documento fiscal relacionado. |
| `FinancialTransaction` | Financeiro | Movimentação que registra entrada, saída, ajuste, estorno ou liquidação. |
| `Reimbursement` | Financeiro | Reembolso em ciclo próprio. |
| `Investment` | Financeiro | Investimento em ciclo próprio. |
| `PartnerRule` | Financeiro | Condição financeira ou repasse específica de uma relação de parceria. |

## Consequências de consumo entre domínios

- Projetos e Financeiro consomem `Contract` por referência; nenhum deles altera seu ciclo comercial.
- Financeiro pode consultar `Client`, `Contract`, `Project` e progresso relacionado, mas não edita pipeline nem backlog.
- `Partner` é compartilhado. `PartnerRule` é financeira e não substitui o cadastro do parceiro.
- Uma projeção como `FinancialSummary` pode combinar dados para leitura, mas não possui autoridade sobre as entidades de origem.
