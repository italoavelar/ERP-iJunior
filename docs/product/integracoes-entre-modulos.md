# Integrações entre Comercial, Projetos e Financeiro

**Status:** Handoff, ownership e rastreabilidade confirmados. Regras operacionais de ativação e integração específica seguem abertas.

## Princípio

Integração é continuidade de negócio. Relações não são redigitadas entre módulos. Cada passagem mantém referência de origem, domínio proprietário e histórico suficiente para explicar a trajetória completa.

## Handoff Comercial → Projetos

Assinatura válida de `Contract` habilita o handoff. `Contract` continua pertencendo ao Comercial como fato contratual compartilhado e imutável in-place.

O handoff cria ou prepara o Project Workspace sem redigitação e transfere ou referencia:

- `Client` e `Contact`;
- `Opportunity`, diagnóstico, `SizingAssessment`, `CommercialScope`, `Pricing` e `Proposal`;
- `Contract` assinado;
- riscos, equipe planejada, cronograma e plano financeiro;
- decisões, `Document` e demais evidências vinculadas.

O Project Workspace preparado não está necessariamente em execução ativa. A transição para execução ativa é uma decisão operacional de Projetos ainda aberta.

## Limites de ownership após o handoff

| Fato ou entidade | Owner após handoff | Consumo permitido |
| --- | --- | --- |
| Pipeline, `CrmCard`, `Opportunity`, proposta e `Contract` | Comercial | Projetos e Financeiro consultam referências autorizadas. |
| `Project`, baseline, tasks, sprints, riscos e CS | Projetos | Comercial e Financeiro recebem leitura ou efeitos de negócio autorizados. |
| `PaymentPlan`, `Installment`, `Obligation`, `Invoice` e transações | Financeiro | Comercial e Projetos consultam situação e referências autorizadas. |

## Contrato de handoff confirmado

Toda implementação de handoff deve preservar:

1. identificador canônico do `Contract` e referências para `Opportunity`, `Proposal` e `Project`;
2. quais dados são referência e quais são snapshot de preparação;
3. ator ou automação autorizada a criar ou preparar o Project Workspace;
4. idempotência para que reprocessamento não gere projeto duplicado;
5. tratamento auditável de falha, cancelamento, correção e reprocessamento;
6. `ScopeBaseline` inicial derivada do contexto contratado;
7. impacto de `ChangeRequest`, aditivo e correção histórica.

## Financeiro e contratos

Financeiro consome o `Contract` assinado por referência. A partir de suas condições aplicáveis, cria `PaymentPlan`, `Installment`, `Obligation` e `Invoice` próprios. Uma `ChangeRequest` com impacto de valor ou condição segue o fluxo de aditivo e revisão controlada, sem reescrever parcela liquidada.

## Encerramentos independentes

Encerramento operacional e financeiro são independentes. Os dois preservam referências um ao outro, mas nenhum deve ocorrer implicitamente como efeito do outro.
