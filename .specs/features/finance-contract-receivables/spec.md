# Finance Contract Receivables Specification

**Status:** Closed — ready for design after user authorization.

## Problem Statement

O Financeiro precisa operacionalizar as condições financeiras de um `Contract` já existente sem recriar dados de Comercial. A primeira vertical deve permitir estruturar um plano de pagamento, acompanhar parcelas, registrar recebimentos e estornos auditáveis, e calcular saldos de forma determinística.

## Goals

- [ ] Permitir que atores autorizados criem e operem um único `PaymentPlan` em BRL para cada `Contract` nesta versão.
- [ ] Permitir registrar recebimentos totais ou parciais com allocations e saldo derivado por `Installment`.
- [ ] Preservar histórico, auditoria, autorização por capacidade e integridade financeira em todas as operações críticas.

## Out of Scope

| Item | Motivo |
| --- | --- |
| Criação, edição, correção, exclusão ou exportação de `Client` e `Contract` | Essas entidades pertencem a seus domínios proprietários e são somente consumidas por referência. |
| Emissão de nota fiscal | `Invoice` não faz parte desta vertical. |
| Reembolso, investimento, patrimônio, orçamento e fechamento | São subdomínios financeiros futuros. |
| Conciliação ou integração bancária | Não há integração bancária nesta versão. |
| `PartnerRule`, repasses e parceria financeira | Possuem ciclo financeiro próprio fora desta vertical. |
| Renegociação, aditivo, substituição, revisão ou múltiplos planos de pagamento | Reestruturação financeira é feature futura. |
| `ChangeRequest`, CRM e execução de Projetos | Esta feature somente consulta referências necessárias. |
| Rateio entre `Contract`, `Client` ou `PaymentPlan` distintos | Cada transação desta versão pertence a um único contrato e plano. |
| Crédito do cliente, recebimento não alocado ou overpayment | Toda transação de recebimento deve ser integralmente alocada sem exceder saldos abertos. |
| Estorno de estorno, chargeback bancário ou estorno automático | A reversão é limitada a recebimentos e allocations originais. |
| Backdating de recebimentos ou estornos | O timestamp é gerado pelo sistema no registro. |
| Purga, anonimização, exportação em massa, retenção legal e política de backup | A política global de Plataforma permanece fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Contrato de origem | A feature consome somente `Contract` válido já existente, por identificador canônico e referência ao `Client`; não cria nem altera esses dados. | `Contract` pertence ao Comercial e Financeiro o consome por referência. | yes |
| Moeda e precisão | A moeda é BRL. Valores aceitam no máximo duas casas decimais, mínimo positivo de R$ 0,01 e igualdade exata de domínio; a representação concreta não usa ponto flutuante binário. | Garante cálculo determinístico de planos, allocations e saldos. | yes |
| Calendário e timestamps | `dueDate` é data sem horário em `America/Sao_Paulo`. No dia do vencimento a parcela é `NOT_DUE`; no dia seguinte, com saldo, é `OVERDUE`. Recebimentos e estornos recebem timestamp imutável gerado pelo sistema, sem backdating. | Evita ambiguidade de vencimento e de ocorrência financeira. | yes |
| Sem meta numérica de serviço | Esta feature não define SLO de desempenho ou disponibilidade. | `PLA-004` continua aberto globalmente; a aceitação local cobre integridade, atomicidade, autorização e auditoria. | yes |
| Descarte técnico | O descarte sem histórico preserva evidência auditável; a técnica concreta, como tombstone ou soft delete, será escolhida no design. | A regra de negócio exige rastreabilidade, não estratégia física específica. | yes |
| Idempotência de mutações | Todo comando mutável usa `idempotencyKey`; replay autorizado e semanticamente idêntico retorna o resultado original sem novo efeito, e reutilização conflitante é rejeitada. | Impede repetição técnica de fatos financeiros sem tentar inferir duplicidade de negócio. | yes |
| Numeração irregular na ativação | Ativação rejeita sequência que não seja única e contínua de 1 até N; renumeração ocorre somente por ação explícita em `DRAFT`. | Ativação não pode alterar número de parcela como efeito colateral. | yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Estruturar um plano de pagamento ⭐ MVP

**User Story**: As a usuário com capacidade financeira, I want criar e ativar um `PaymentPlan` para um `Contract` existente so that suas condições sejam operacionalizadas financeiramente.

**Why P1**: Sem um plano ativo e consistente não há parcelas nem recebimentos a acompanhar.

**Acceptance Criteria**:

1. WHEN a user with `PAYMENT_PLAN_CREATE` selects a valid `Contract` em BRL sem plano existente THEN the system SHALL create one `PaymentPlan` in `DRAFT` linked by reference to that `Contract`. 
2. IF a `Contract` already has a `PaymentPlan` not discarded THEN the system SHALL reject creation of another `PaymentPlan` atomically. 
3. WHEN a user with `PAYMENT_PLAN_EDIT_DRAFT` changes the total of a `DRAFT` `PaymentPlan` THEN the system SHALL preserve the reference to the same `Contract`. 
4. IF the total of a `DRAFT` `PaymentPlan` differs from the financial value of its referenced `Contract` THEN the system SHALL reject activation atomically. 
5. WHEN a user with `PAYMENT_PLAN_ACTIVATE` activates a `DRAFT` `PaymentPlan` that has a valid `Contract`, BRL, a defined total, and valid installments THEN the system SHALL change its status to `ACTIVE` atomically. 
6. IF a `DRAFT` `PaymentPlan` has zero installments THEN the system SHALL reject activation atomically. 
7. IF the sum of original amounts of a `DRAFT` `PaymentPlan` differs from its total THEN the system SHALL reject activation atomically. 
8. WHILE a `PaymentPlan` is `DRAFT` the system SHALL reject registration of a `FinancialTransaction` for that plan. 
9. WHEN a user with `PAYMENT_PLAN_RETURN_TO_DRAFT` supplies a mandatory reason for an `ACTIVE` `PaymentPlan` without financial history THEN the system SHALL change it to `DRAFT` atomically and record an `AuditEvent`. 
10. IF an `ACTIVE` `PaymentPlan` has financial history THEN the system SHALL reject a transition to `DRAFT` atomically. 
11. WHEN a user with `PAYMENT_PLAN_DISCARD` supplies a mandatory reason for a `DRAFT` `PaymentPlan` without financial history THEN the system SHALL discard it from active operation and record an `AuditEvent` containing the plan, contract, actor, timestamp, reason, prior status, and confirmation of absent history. 
12. IF a `PaymentPlan` has any related `FinancialTransaction`, `TransactionAllocation`, or reversal event THEN the system SHALL reject discard atomically. 

**Independent Test**: Criar um plano DRAFT para contrato sem plano, compor parcelas válidas, ativá-lo e verificar rejeições para segundo plano, total divergente e plano sem parcelas.

### P1: Compor parcelas com identidade estável ⭐ MVP

**User Story**: As a usuário com capacidade financeira, I want organizar parcelas de um plano DRAFT so that o plano possa ser ativado com vencimentos e valores consistentes.

**Why P1**: Parcelas são a unidade de vencimento, saldo e allocation desta vertical.

**Acceptance Criteria**:

1. WHEN a user with `INSTALLMENT_CREATE` creates an installment in a `DRAFT` `PaymentPlan` THEN the system SHALL assign a stable installment identity independent of its presentation number, due date, and original amount. 
2. IF an installment original amount is zero, negative, or has more than two decimal places in BRL THEN the system SHALL reject creation or structural alteration atomically. 
3. IF an installment has no `dueDate` calendar date THEN the system SHALL reject creation or structural alteration atomically. 
4. WHEN a user with `INSTALLMENT_CREATE` creates an installment in a `DRAFT` plan THEN the system SHALL suggest the next positive `installmentNumber` unique within that plan. 
5. WHEN a user with `INSTALLMENT_EDIT_DRAFT`, `INSTALLMENT_REMOVE`, or `INSTALLMENT_REORDER` changes installments in a `DRAFT` plan THEN the system SHALL preserve each surviving installment identity while applying the requested structural change atomically. 
6. WHILE a `PaymentPlan` is `DRAFT` the system SHALL permit installments to share the same `dueDate`. 
7. WHILE an `ACTIVE` `PaymentPlan` has no financial history the system SHALL reject direct structural changes until it is returned to `DRAFT`. 
8. WHILE a `PaymentPlan` has financial history the system SHALL reject changes to its contract, client, currency, total, installment composition, installment identity, number, original amount, or due date atomically. 
9. WHILE a `PaymentPlan` has financial history the system SHALL permit only descriptive changes that do not change contract, client, currency, value, due date, installment identity, balance, or financial history. 
10. IF installment numbers are not a unique continuous sequence from 1 through N when activation is requested THEN the system SHALL reject activation atomically and preserve the `PaymentPlan` in `DRAFT`. 
11. WHEN a `PaymentPlan` activation is requested THEN the system SHALL not alter any `installmentNumber` as a side effect of the activation. 

**Independent Test**: Criar e reorganizar parcelas em DRAFT, ativar uma sequência contínua e comprovar que uma allocation congela dados estruturais mesmo após estorno.

### P1: Registrar e acompanhar recebimentos alocados ⭐ MVP

**User Story**: As a usuário com capacidade de recebimento, I want registrar recebimentos totais ou parciais para parcelas de um plano ativo so that o saldo financeiro do contrato seja acompanhado sem edição manual.

**Why P1**: Acompanhar recebimentos e saldo derivado é o objetivo central da vertical.

**Acceptance Criteria**:

1. WHEN a user with `RECEIVABLE_REGISTER_PAYMENT` registers a receipt for an `ACTIVE` `PaymentPlan` THEN the system SHALL create a `FinancialTransaction` of type `RECEIPT` with a system-generated immutable timestamp. 
2. IF a receipt amount is zero, negative, or has more than two decimal places in BRL THEN the system SHALL reject the receipt and all proposed allocations atomically. 
3. WHEN a receipt is registered THEN the system SHALL require one or more positive `TransactionAllocation` records whose sum equals the receipt amount exactly. 
4. IF a proposed receipt has an unallocated amount THEN the system SHALL reject the receipt and all proposed allocations atomically. 
5. IF selected installments do not belong to the same `PaymentPlan`, `Contract`, `Client`, and BRL currency THEN the system SHALL reject the receipt and all proposed allocations atomically. 
6. IF an allocation exceeds the open balance of its installment at registration time THEN the system SHALL reject the receipt and all proposed allocations atomically. 
7. IF the combined proposed allocations to an installment exceed its open balance at registration time THEN the system SHALL reject the receipt and all proposed allocations atomically. 
8. WHEN a valid receipt allocation is persisted THEN the system SHALL derive the installment received amount, remaining balance, `SettlementStatus`, and `DueStatus` from valid events rather than manual fields. 
9. WHEN an installment has net allocated amount equal to zero THEN the system SHALL derive `SettlementStatus` as `PENDING`. 
10. WHEN an installment has net allocated amount greater than zero and less than its original amount THEN the system SHALL derive `SettlementStatus` as `PARTIAL`. 
11. WHEN an installment has net allocated amount equal to its original amount THEN the system SHALL derive `SettlementStatus` as `SETTLED`. 
12. WHEN the `America/Sao_Paulo` calendar date is after an installment `dueDate` and its remaining balance is greater than zero THEN the system SHALL derive `DueStatus` as `OVERDUE`. 
13. WHEN an installment remaining balance is zero THEN the system SHALL derive `DueStatus` as `NOT_DUE`. 
14. WHEN the `America/Sao_Paulo` calendar date is on or before an installment `dueDate` THEN the system SHALL derive `DueStatus` as `NOT_DUE`. 
15. WHEN a valid receipt is persisted THEN the system SHALL record an `AuditEvent` for the receipt operation. 
16. IF a receipt request supplies an occurrence timestamp THEN the system SHALL reject the receipt without creating a financial event. 

**Independent Test**: Registrar uma transação de R$ 800 alocada em R$ 300 e R$ 500 a duas parcelas do mesmo plano e verificar saldo, estados e rejeição de R$ 850.

### P1: Estornar recebimento sem reescrever o histórico ⭐ MVP

**User Story**: As a Vice-Presidente com capacidade de estorno, I want estornar total ou parcialmente um recebimento so that correções financeiras preservem a trilha de eventos.

**Why P1**: Estornos são necessários para correções sem editar ou apagar fatos financeiros já registrados.

**Acceptance Criteria**:

1. WHEN a user with `RECEIVABLE_REVERSE_PAYMENT` supplies a mandatory reason for an original receipt THEN the system SHALL create a `FinancialTransaction` of type `REVERSAL` linked to that original receipt. 
2. WHEN a reversal is registered THEN the system SHALL require one or more positive reversal allocations, each linked to exactly one original receipt allocation and its installment. 
3. IF a reversal allocation exceeds the remaining reversible amount of its original allocation THEN the system SHALL reject the reversal and all proposed reversal allocations atomically. 
4. IF the sum of reversal allocations differs from the positive nominal reversal amount THEN the system SHALL reject the reversal and all proposed reversal allocations atomically. 
5. IF a reversal attempts to reference a `REVERSAL` transaction or a reversal allocation THEN the system SHALL reject the operation atomically. 
6. WHEN a valid reversal is persisted THEN the system SHALL derive each affected installment net allocated amount as receipt allocations minus valid reversal allocations. 
7. WHEN a valid reversal restores a positive balance after the installment due date THEN the system SHALL derive `DueStatus` as `OVERDUE` immediately. 
8. WHEN a valid reversal is persisted THEN the system SHALL record an `AuditEvent` containing the original receipt, original allocations, reversal amount, timestamp, actor, and mandatory reason. 
9. The system SHALL preserve original receipts, allocations, reversals, and audit events without in-place editing or deletion to represent a financial correction. 
10. IF a reversal request supplies an occurrence timestamp THEN the system SHALL reject the reversal without creating a financial event. 

**Independent Test**: Registrar R$ 1.000 recebidos, estornar R$ 300 e R$ 200 em eventos distintos, e verificar saldo líquido de R$ 500, histórico preservado e rejeição de estorno acima de R$ 500.

### P1: Repetir comandos sem duplicar fatos financeiros ⭐ MVP

**User Story**: As a interface cliente autorizada, I want reenviar com segurança um comando financeiro so that falhas técnicas não dupliquem efeitos persistidos.

**Why P1**: Recebimentos, estornos e transições de plano são fatos imutáveis; uma repetição técnica não pode criar novo efeito financeiro.

**Acceptance Criteria**:

1. WHEN a client submits creation of `PaymentPlan`, structural change of `PaymentPlan` or `Installment`, activation, return to `DRAFT`, discard, receipt, or reversal THEN the system SHALL require an `idempotencyKey`. 
2. WHEN the first authorized processing of an `idempotencyKey` succeeds THEN the system SHALL persist the key, command, actor, relevant semantic parameters, and result identity atomically with the domain effect. 
3. WHEN the same authorized actor replays an `idempotencyKey` for the same command and relevant semantic parameters THEN the system SHALL return a semantically equivalent original result without creating a second domain effect or `AuditEvent`. 
4. IF a completed `idempotencyKey` is reused for another command, another actor, or materially different parameters THEN the system SHALL reject the request as a conflict without changing state. 
5. IF a caller lacks the capability required by a command THEN the system SHALL reject the command even when the caller presents an `idempotencyKey` from a completed operation. 
6. IF validation or authorization fails before a domain commit THEN the system SHALL not treat the `idempotencyKey` as a completed financial operation. 
7. WHEN concurrent requests submit the same authorized command with the same `idempotencyKey` and parameters THEN the system SHALL persist at most one domain effect. 
8. The system SHALL retain evidence required to prevent replay of completed financial operations without automatic expiry or purge in this version. 

**Independent Test**: Enviar duas vezes a mesma chave para registrar um recebimento e verificar uma única transação, allocation e auditoria; reenviar a chave com outro valor e verificar conflito sem efeito financeiro.

### P1: Aplicar capacidades e proteger histórico financeiro ⭐ MVP

**User Story**: As a usuário autorizado, I want consultar a situação financeira de um contrato conforme minha capacidade so that a operação permaneça segregada e auditável.

**Why P1**: Dados financeiros exigem acesso explícito e não podem ser alterados por administração técnica.

**Acceptance Criteria**:

1. WHEN a user has `FINANCE_READ` THEN the system SHALL permit consultation de `PaymentPlan`, `Installment`, `FinancialTransaction`, `TransactionAllocation`, e histórico financeiro aplicável aos contratos desta feature. 
2. WHEN a user has `FINANCIAL_AUDIT_READ` THEN the system SHALL permit consultation da auditoria financeira aplicável aos contratos desta feature. 
3. IF a user lacks the capability required by an operation THEN the system SHALL reject the operation without changing financial state. 
4. IF a user has only `PLATFORM_ADMIN` and lacks a financial capability THEN the system SHALL reject financial consultation and mutation without bypass. 
5. WHEN a user has `PAYMENT_PLAN_CREATE`, `PAYMENT_PLAN_EDIT_DRAFT`, `PAYMENT_PLAN_ACTIVATE`, `INSTALLMENT_CREATE`, `INSTALLMENT_EDIT_DRAFT`, `INSTALLMENT_REMOVE`, `INSTALLMENT_REORDER`, or `RECEIVABLE_REGISTER_PAYMENT` THEN the system SHALL authorize only its corresponding operation. 
6. WHEN a user has `PAYMENT_PLAN_RETURN_TO_DRAFT`, `PAYMENT_PLAN_DISCARD`, or `RECEIVABLE_REVERSE_PAYMENT` THEN the system SHALL authorize only its corresponding elevated operation. 
7. WHEN the system performs plan creation, plan activation, return to draft, discard, installment structural change, receipt registration, or reversal registration THEN the system SHALL record an `AuditEvent` with actor, timestamp, action, affected financial context, and mandatory reason where required. 
8. The system SHALL reference `Client` and `Contract` by canonical identifiers without copying their personal data into financial records or audit events. 
9. WHILE a `PaymentPlan` has financial history the system SHALL reject normal-operation deletion of the plan, its installments, transactions, allocations, reversals, and audit events. 
10. The system SHALL assign Gerente Financeiro the capabilities `FINANCE_READ`, `FINANCIAL_AUDIT_READ`, `PAYMENT_PLAN_CREATE`, `PAYMENT_PLAN_EDIT_DRAFT`, `PAYMENT_PLAN_ACTIVATE`, `INSTALLMENT_CREATE`, `INSTALLMENT_EDIT_DRAFT`, `INSTALLMENT_REMOVE`, `INSTALLMENT_REORDER`, and `RECEIVABLE_REGISTER_PAYMENT`. 
11. The system SHALL assign Vice-Presidente all Gerente Financeiro capabilities plus `PAYMENT_PLAN_RETURN_TO_DRAFT`, `PAYMENT_PLAN_DISCARD`, and `RECEIVABLE_REVERSE_PAYMENT`. 

**Independent Test**: Verificar que Gerente Financeiro registra pagamento mas não estorna, Vice-Presidente estorna, e `PLATFORM_ADMIN` sem capacidade financeira não consulta nem altera dados financeiros.

## Edge Cases

- **EDGE-01**: IF a `Contract` não estiver disponível ou não possuir valor financeiro BRL aplicável THEN the system SHALL reject criação ou ativação do plano sem criar registros financeiros locais.
- **EDGE-02**: IF a failed validation affects any item of a plan, receipt, allocation, reversal, transition, or discard THEN the system SHALL persist none of that operation's proposed financial changes.
- **EDGE-03**: WHEN a discarded plan sem histórico precisa ser demonstrado THEN the system SHALL expose evidência auditável do descarte sem restaurá-lo à operação ativa nesta versão.

## Requirement Traceability

| Requirement ID | Story | Normative context | Status |
| --- | --- | --- | --- |
| PLAN-01 | Plano de pagamento | FIN-002, AD-010, AD-014 | Pending |
| PLAN-02 | Plano de pagamento | FIN-002 | Pending |
| PLAN-03 | Plano de pagamento | FIN-002 | Pending |
| PLAN-04 | Plano de pagamento | FIN-002 | Pending |
| PLAN-05 | Plano de pagamento | FIN-002 | Pending |
| PLAN-06 | Plano de pagamento | FIN-002 | Pending |
| PLAN-07 | Plano de pagamento | FIN-002 | Pending |
| PLAN-08 | Plano de pagamento | FIN-002 | Pending |
| PLAN-09 | Plano de pagamento | FIN-002, PLA-001 | Pending |
| PLAN-10 | Plano de pagamento | FIN-002 | Pending |
| PLAN-11 | Plano de pagamento | FIN-002, PLA-001, PLA-003 | Pending |
| PLAN-12 | Plano de pagamento | FIN-002 | Pending |
| INST-01 | Parcelas | FIN-002 | Pending |
| INST-02 | Parcelas | FIN-002 | Pending |
| INST-03 | Parcelas | FIN-002 | Pending |
| INST-04 | Parcelas | FIN-002 | Pending |
| INST-05 | Parcelas | FIN-002, PLA-001 | Pending |
| INST-06 | Parcelas | FIN-002 | Pending |
| INST-07 | Parcelas | FIN-002 | Pending |
| INST-08 | Parcelas | FIN-002 | Pending |
| INST-09 | Parcelas | FIN-002, FIN-003 | Pending |
| INST-10 | Parcelas | FIN-002 | Pending |
| INST-11 | Parcelas | FIN-002 | Pending |
| RECEIPT-01 | Recebimentos | FIN-003, PLA-001 | Pending |
| RECEIPT-02 | Recebimentos | FIN-003 | Pending |
| RECEIPT-03 | Recebimentos | FIN-003 | Pending |
| RECEIPT-04 | Recebimentos | FIN-003 | Pending |
| RECEIPT-05 | Recebimentos | FIN-003 | Pending |
| RECEIPT-06 | Recebimentos | FIN-003 | Pending |
| RECEIPT-07 | Recebimentos | FIN-003 | Pending |
| RECEIPT-08 | Recebimentos | FIN-003 | Pending |
| RECEIPT-09 | Recebimentos | FIN-003 | Pending |
| RECEIPT-10 | Recebimentos | FIN-003 | Pending |
| RECEIPT-11 | Recebimentos | FIN-003 | Pending |
| RECEIPT-12 | Recebimentos | FIN-003 | Pending |
| RECEIPT-13 | Recebimentos | FIN-003 | Pending |
| RECEIPT-14 | Recebimentos | FIN-003 | Pending |
| RECEIPT-15 | Recebimentos | FIN-003, PLA-003 | Pending |
| RECEIPT-16 | Recebimentos | FIN-003 | Pending |
| REVERSE-01 | Estornos | FIN-003, PLA-001 | Pending |
| REVERSE-02 | Estornos | FIN-003 | Pending |
| REVERSE-03 | Estornos | FIN-003 | Pending |
| REVERSE-04 | Estornos | FIN-003 | Pending |
| REVERSE-05 | Estornos | FIN-003 | Pending |
| REVERSE-06 | Estornos | FIN-003 | Pending |
| REVERSE-07 | Estornos | FIN-003 | Pending |
| REVERSE-08 | Estornos | FIN-003, PLA-003 | Pending |
| REVERSE-09 | Estornos | FIN-003, PLA-003 | Pending |
| REVERSE-10 | Estornos | FIN-003 | Pending |
| IDEMP-01 | Idempotência | FIN-003, PLA-003 | Pending |
| IDEMP-02 | Idempotência | FIN-003, PLA-003 | Pending |
| IDEMP-03 | Idempotência | FIN-003, PLA-003 | Pending |
| IDEMP-04 | Idempotência | FIN-003 | Pending |
| IDEMP-05 | Idempotência | PLA-001 | Pending |
| IDEMP-06 | Idempotência | FIN-003 | Pending |
| IDEMP-07 | Idempotência | FIN-003 | Pending |
| IDEMP-08 | Idempotência | PLA-003 | Pending |
| ACCESS-01 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-02 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-03 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-04 | Acesso e histórico | PLA-001, AD-013 | Pending |
| ACCESS-05 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-06 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-07 | Acesso e histórico | PLA-001, PLA-003 | Pending |
| ACCESS-08 | Acesso e histórico | PLA-003, AD-012 | Pending |
| ACCESS-09 | Acesso e histórico | FIN-002, FIN-003, PLA-003 | Pending |
| ACCESS-10 | Acesso e histórico | PLA-001 | Pending |
| ACCESS-11 | Acesso e histórico | PLA-001 | Pending |
| EDGE-01 | Casos de borda | AD-010, AD-014 | Pending |
| EDGE-02 | Casos de borda | FIN-002, FIN-003 | Pending |
| EDGE-03 | Casos de borda | FIN-002, PLA-003 | Pending |

**Coverage:** 71 total, 0 mapped to tasks, 71 unmapped until design and tasks are approved.

## Success Criteria

- [ ] Um Gerente Financeiro consegue ativar um plano válido e registrar recebimentos totais ou parciais autorizados, sem alterar `Contract` ou `Client`.
- [ ] Um Vice-Presidente consegue retornar plano sem histórico a DRAFT, descartá-lo ou registrar estorno autorizado com histórico preservado.
- [ ] Toda operação inválida é rejeitada integralmente, sem mudança parcial em saldos, allocations, estados ou auditoria.
- [ ] Saldo, `SettlementStatus` e `DueStatus` são reprodutíveis apenas a partir de valores originais e eventos financeiros válidos.
