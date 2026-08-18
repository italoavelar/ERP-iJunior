# Fluxo financeiro

**Status:** Visão de domínio e invariantes confirmadas. Políticas operacionais e integrações externas seguem abertas.

## Escopo completo do Financeiro

O Financeiro contempla planos de pagamento, parcelas, recebimentos, notas fiscais, reembolsos, investimentos, orçamento e planejamento, obrigações, patrimônio, caixa e fechamento. A priorização de implementação entre esses temas continua aberta.

Não existe entidade ou agregado chamado “projeto financeiro”. `Project` é a unidade operacional de Projetos. Financeiro fornece uma visão financeira relacionada a `Project` e `Contract`; uma eventual `FinancialSummary` é projeção de leitura, nunca fonte de verdade.

## Fluxo financeiro de referência

```text
Contract assinado e condições aplicáveis
  → PaymentPlan
  → Installment e Obligation
  → Invoice quando aplicável
  → Recebimento, pagamento ou ajuste
  → FinancialTransaction e caixa
  → Encerramento financeiro
  → Histórico e analytics de leitura
```

`Contract` pertence ao Comercial. Financeiro o consome por referência e cria seus próprios registros financeiros. Projetos pode informar progresso, marco, aceite ou mudança aprovada sem se tornar proprietário da liquidação.

## Mudanças contratuais e financeiras

Quando uma `ChangeRequest` aprovada afetar valor ou condição contratual:

```text
ChangeRequest
  → Contract Amendment ou mecanismo equivalente
  → revisão controlada de PaymentPlan
  → atualização apenas de Installment ou Obligation alterável
```

Parcelas já liquidadas nunca são reescritas. Ajustes, estornos e novas liquidações preservam os eventos anteriores.

## Conceitos próprios e migração

Os campos históricos da planilha atual são origem de migração e contexto, não o modelo final.

| Dado histórico | Conceito de destino |
| --- | --- |
| CPF/CNPJ e identificação da contraparte | `Client` e seus identificadores. |
| Contrato e data da assinatura | `Contract` do Comercial e seu histórico. |
| Produto | `Offering` do Comercial e a referência comercial aplicável. |
| Estado do projeto e responsável | `Project` e atribuições, como referências de leitura. |
| Valor total e condições | `Contract`, `PaymentPlan` e `Installment`. |
| Valor pago e valor restante | Valores derivados de `Installment` e `FinancialTransaction`. |
| Estado financeiro, NF e parcela | `Obligation`, `Invoice` e `Installment`. |
| Collab | `Partner` e `PartnerRule` quando aplicável. |
| Observações | Registro contextual ou `Document`, conforme decisão futura de retenção e acesso. |
| `legacy_complexity_score` | Dado histórico de migração; não é métrica canônica. |

## Invariantes confirmadas

- Financeiro consulta `Contract`, `Client` e progresso relacionado, mas não edita pipeline de CRM nem backlog de projeto.
- Valor pago e valor restante derivam de movimentações e parcelas; não são fonte primária manual.
- Parcela liquidada não é sobrescrita silenciosamente.
- Ajustes, estornos, liquidações e alterações financeiras relevantes mantêm histórico.
- Integração preserva referência a `Contract`, `Project`, `Client` e origem comercial quando aplicável.

## Parcerias e repasses

`Partner` é entidade compartilhada. Uma parceria pode ter parceiro, contatos, responsabilidades e documentos vinculados. Um `Partner` pode relacionar-se a múltiplos contratos e projetos.

`PartnerRule` pertence ao Financeiro e representa condição financeira ou repasse específico de uma relação. Fórmula, aprovações e ciclo de vida da regra seguem abertos.

## Decisões realmente abertas

- Ordem de priorização entre subdomínios financeiros para a primeira feature financeira.
- Políticas de criação, alteração e aprovação de `PaymentPlan`, `Installment`, `Obligation`, `Invoice`, reembolso, investimento e fechamento.
- Regras de liquidação parcial, renegociação, desconto, multa, juros, estorno e reabertura.
- Integrações externas necessárias para bancos, emissão fiscal, contabilidade e patrimônio.
- Fórmula, aprovações e ciclo de vida de `PartnerRule` e repasses.
