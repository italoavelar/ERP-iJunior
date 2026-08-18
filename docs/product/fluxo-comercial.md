# Fluxo comercial

**Status:** Fluxo principal, entidades comerciais e limite dos campos configuráveis confirmados.

## CRM como plataforma de processos configuráveis

A hierarquia obrigatória é:

```text
Workspace
  → Pipe
    → Stage
      → Card
```

Cada `CrmPipe` pode definir stages, schema de cards, campos customizados, formulários, automações, regras de transição, SLA, views e permissões próprios. `CrmCard` é a unidade visual e processual do pipe; ele pode orquestrar uma oportunidade e referenciar seus artefatos comerciais.

Campos customizados mantêm a extensibilidade do pipe. Eles não representam como fonte primária uma entidade que exija identidade, versionamento, aprovação, auditoria ou integração, como `Proposal`, `Contract`, `SizingAssessment`, `CommercialScope` ou `Pricing`.

## Fluxo comercial principal

```text
Lead
  → Contato
  → Opportunity
  → Diagnóstico
  → SizingAssessment: dimensionamento / estruturação / viabilidade
  → CommercialScope
  → Pricing
  → Proposal
  → Negociação
  → Accepted Proposal
  → Contract
  → Assinatura válida
  → Handoff
```

O pipe representa esse fluxo conforme sua configuração, sem perder a rastreabilidade dos fatos quando aplicáveis.

## Entidades comerciais

| Entidade | Papel no fluxo |
| --- | --- |
| `Opportunity` | Contexto de negócio conduzido pelo CRM. Pode referenciar cliente, contatos, responsáveis, lead score, `Offering` e parceiro. |
| `SizingAssessment` | Fundamenta viabilidade, esforço, complexidade, equipe, sprints, riscos, premissas e versões. |
| `CommercialScope` | Define o que é negociado antes de se tornar baseline contratual. |
| `Pricing` | Registra preços recomendado, mínimo, médio, máximo e oficial, quando aplicável. |
| `Proposal` | Oferta versionada, com status e histórico próprios. |
| `Contract` | Instrumento formalizado pelo Comercial. Após assinatura válida, torna-se fato compartilhado e imutável in-place. |
| `Offering` | Produto ou serviço ofertável. A oportunidade pode referenciá-lo; ele não é sinônimo de escopo. |

`legacy_complexity_score` é mantido somente como informação de migração ou histórico. Novos registros usam `SizingAssessment` como fonte canônica de complexidade e premissas.

## Saída do Comercial

Assinatura válida de `Contract` habilita o handoff Comercial → Projetos. O handoff cria ou prepara o Project Workspace sem redigitação e preserva as referências comerciais.

A criação ou preparação do Project Workspace não inicia automaticamente a execução. A transição de preparação para execução ativa é decisão operacional ainda aberta.

## Decisões realmente abertas

- Estados normativos de oportunidade, proposta, contrato e assinatura, incluindo perda, expiração, cancelamento e reabertura.
- Alçadas para preço mínimo, preço oficial, exceções comerciais e formalização de contrato.
- Governança para criar ou alterar pipes, schemas, formulários, automações, SLA, views e permissões de CRM.
