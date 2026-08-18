# Modelo de domínio

**Status:** Contexto conceitual confirmado. Os nomes não obrigam modelo físico.

## Princípios de modelagem

- Cada entidade possui um domínio proprietário com autoridade sobre seu ciclo de vida. Ownership não impede leitura autorizada por outros domínios.
- Integrações preservam referências de origem; não recriam relações de negócio manualmente.
- O ERP usa modelos próprios por domínio. Não existe tipo universal de card, tarefa ou workspace.
- `CrmCard` organiza uma unidade visual e processual de CRM. `ProjectTask` organiza trabalho operacional de projeto.
- `CrmFieldValue` oferece extensibilidade de pipe, mas não substitui entidades com identidade, ciclo de vida, versionamento, aprovação, auditoria ou integração própria.
- Contrato assinado, escopo contratado, parcela liquidada e valores financeiros derivados são fatos históricos protegidos por auditoria e histórico.

## Modelos distintos

### CRM / Comercial

O CRM é uma plataforma de processos configuráveis com hierarquia obrigatória:

```text
CrmWorkspace
  → CrmPipe
    → CrmStage
      → CrmCard
```

Um pipe pode possuir stages, schema de cards, campos customizados, formulários, automações, regras de transição, SLA, views e permissões próprios. `CrmCard` pode orquestrar uma `Opportunity` e referenciar entidades comerciais first-class, mas não absorve seus ciclos de vida.

### Projetos

O Project Workspace é criado ou preparado após o handoff. Ele organiza escopo, equipe, board, sprints, riscos, Sucesso do Cliente, documentos, visão financeira de leitura, auditoria e histórico. A criação ou preparação não inicia automaticamente a execução operacional.

### Financeiro

Financeiro consome `Contract` por referência e cria seus próprios `PaymentPlan`, `Installment`, `Obligation`, `Invoice` e `FinancialTransaction` conforme as condições aplicáveis. Existe somente `Project` como unidade operacional. Uma eventual `FinancialSummary` é projeção ou read model, nunca fonte de verdade.

## Grafo comercial, contratual e de execução confirmado

```text
Opportunity
  → SizingAssessment
  → CommercialScope
  → Pricing
  → Proposal
  → Accepted Proposal
  → Contract
  → Signature
  → Handoff
  → ScopeBaseline
  → Project
```

O handoff habilita a criação ou preparação do Project Workspace sem redigitação. A primeira `ScopeBaseline` preserva o escopo contratual que fundamenta o projeto. O evento que permite sair de preparação para execução ativa continua aberto.

Durante a execução:

```text
ScopeBaseline
  → ChangeRequest
  → ScopeVersion
```

Se uma `ChangeRequest` aprovada impactar valor ou condição contratual:

```text
ChangeRequest
  → Contract Amendment ou mecanismo equivalente
  → revisão controlada de PaymentPlan
  → atualização somente de obrigações ou parcelas legal e operacionalmente alteráveis
```

Parcelas já liquidadas nunca são reescritas.

## SizingAssessment

`SizingAssessment` é uma entidade comercial que fundamenta `Pricing` e `Proposal`. Ela pode registrar complexidade técnica, integrações, dependências, incerteza, riscos, esforço estimado, tamanho estimado da equipe, quantidade estimada de sprints, premissas, responsável, versão e histórico.

`legacy_complexity_score` é apenas dado de migração ou histórico. Ele não é métrica canônica de novos registros.

## Relações conceituais principais

| Origem | Relação | Destino |
| --- | --- | --- |
| `CrmCard` | orquestra e referencia | `Opportunity` e seus artefatos comerciais. |
| `Opportunity` | pode referenciar | `Offering`, `Client`, `Contact` e `Partner`. |
| `Opportunity` | fundamenta | `SizingAssessment`, `CommercialScope`, `Pricing` e `Proposal`. |
| `Proposal` | possui | versão, histórico e status próprio. |
| `Accepted Proposal` | fundamenta | `Contract`. |
| `Contract` | pertence ao ciclo Comercial e é consumido por referência | Projetos e Financeiro. |
| `Contract` | fundamenta | `ScopeBaseline` e condições para `PaymentPlan`. |
| `Project` | possui | `ScopeBaseline`, `ScopeVersion`, `ProjectAssignment`, `Sprint`, `ProjectTask`, `Risk` e `CustomerSuccessRecord`. |
| `ChangeRequest` | pode alterar de forma controlada | escopo, prazo, valor ou critérios contratuais. |
| `PaymentPlan` | organiza | `Installment`. |
| `Installment` | pode ser liquidada por | `FinancialTransaction`. |
| `Partner` | pode relacionar-se a | múltiplos contratos e projetos. |
| `PartnerRule` | define | condição financeira ou repasse de uma relação de parceria. |

## Ciclos de vida ainda abertos

Continuam abertas as transições detalhadas, alçadas, dados obrigatórios e exceções de cada ciclo. Essas decisões estão concentradas em [Pendências de definição](pendencias-de-definicao.md).
