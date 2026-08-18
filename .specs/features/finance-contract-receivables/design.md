# Finance Contract Receivables Design

**Spec:** .specs/features/finance-contract-receivables/spec.md
**Status:** Draft — ready for design review; tasks and implementation remain blocked.
**Scope:** Only the first Financeiro vertical for PaymentPlan, Installment, receipt allocations, reversals, derived balance, authorization, audit, and idempotency.

## Design Constraints and Non-goals

This design implements the 71 approved requirements without changing their product behavior.

- Contract is owned by Comercial and Client by Plataforma Compartilhada. This feature only consumes their canonical references and a financial context exposed by their owner.
- PaymentPlan, Installment, FinancialTransaction, and TransactionAllocation are Financeiro records. AuditEvent remains a transversal service.
- The stack is React, TypeScript, and Vite in the frontend; Node.js, TypeScript, and Hono in the API; PostgreSQL and Prisma ORM for persistence. No Express, Fastify, or alternative HTTP framework is introduced.
- No endpoint writes Contract, Client, CRM, Project, Invoice, PartnerRule, or a non-receivables Financeiro concept.
- No new product lifecycle state is created. PaymentPlan keeps only DRAFT and ACTIVE; discard is a lifecycle marker outside its operational state.
- There are no tasks or implementation artifacts in this phase.

## Architecture Overview

### Approaches considered

| Approach | Assessment | Decision |
| --- | --- | --- |
| Place validation, Prisma calls, and financial arithmetic in Hono handlers | Fewer initial files, but mixes HTTP, authorization, money, and transactional rules. It makes atomicity and independent tests fragile. | Rejected. |
| Modular vertical: thin Hono adapters, application commands, pure financial policies, repository ports, and Prisma adapters | Keeps domain invariants independent of transport while retaining a small, local architecture. It supports transactional boundaries, idempotency, and focused tests. | **Selected.** |
| Full event-sourced ledger with projections, event store, and asynchronous consumers | Would support broader Financeiro evolution, but adds event-store and consistency machinery beyond the approved vertical. The approved relational FinancialTransaction records already preserve immutable financial facts. | Rejected as overengineering. |

The selected approach is intentionally a modular monolith vertical. A command enters through a Hono route, is authorized by capability, validated into an application command, and runs through one short Prisma transaction. The transaction persists its domain effect, AuditEvent, and idempotency evidence together.

~~~mermaid
flowchart LR
  U[Finance user in React/Vite] --> FE[Receivables screens and typed API client]
  FE -->|HTTPS + Idempotency-Key| H[Hono routes]
  H --> AM[Authentication and capability middleware]
  AM --> AC[Application command or query]
  AC --> DP[Financial domain policies]
  AC --> CP[Contract reference port]
  AC --> AP[Authorization and audit ports]
  AC --> RP[Prisma repositories and Unit of Work]
  RP --> PG[(PostgreSQL)]
  AP --> AE[AuditEvent port in the same PostgreSQL transaction]
  DP --> Q[Derived balance and status projection]
  Q --> FE
~~~

### Responsibility boundaries

| Layer | Responsibility | Must not do |
| --- | --- | --- |
| React / Vite | Render read models, collect explicit user intent, generate one idempotency key per mutation attempt, and hide unavailable actions for usability. | Authorize a command, calculate authoritative balances, or decide financial validity. |
| Hono API | Authenticate, require a capability, parse transport DTOs, require Idempotency-Key on mutations, call one use case, and map typed errors to HTTP. | Contain allocation arithmetic, status rules, direct role checks, or scattered Prisma writes. |
| Application / use cases | Orchestrate commands, obtain Contract context, open Unit of Work, apply idempotency, call domain policies, persist records, and return DTOs. | Reimplement HTTP parsing or mutate an external Client or Contract. |
| Financial domain | Define exact BRL values, plan transition rules, allocation and reversal validation, derived balance, SettlementStatus, and DueStatus. | Query HTTP context or perform database I/O. |
| Prisma / PostgreSQL | Persist Financeiro records, atomic transactions, constraints, indexes, locks, and immutable-record guardrails. | Infer business meaning from arbitrary custom fields or silently correct invalid values. |
| Shared authorization | Resolve explicit capabilities for the authenticated User. | Treat organizational role or PLATFORM_ADMIN as a financial capability by itself. |
| Transversal audit | Append immutable, minimal-context AuditEvent records in the same PostgreSQL transaction as the financial command. | Depend on an HTTP/service call after committing a financial fact, duplicate Client or Contract personal data, or become a source of financial truth. |

### Proposed module boundaries

The repository currently has no application source, API, or Prisma schema to reuse. The following are proposed locations, not files created by this Design phase.

| Proposed location | Responsibility |
| --- | --- |
| apps/api/src/modules/finance-contract-receivables/http | Hono route registration, request parsing, response and error mapping. |
| apps/api/src/modules/finance-contract-receivables/application | Command and query use cases, DTOs, Unit of Work coordination. |
| apps/api/src/modules/finance-contract-receivables/domain | MoneyBRL, LocalDate, plan/allocation/reversal policies, and derived projections. |
| apps/api/src/modules/finance-contract-receivables/infrastructure | Prisma repositories, raw locking queries, ContractReferencePort adapter, AuditWriter adapter, and IdempotencyStore. |
| apps/web/src/features/finance-contract-receivables | React pages, view models, dialogs, forms, and typed API client. |
| prisma/schema.prisma and Prisma migrations | Models in this design and the database constraints described below. |

### Code reuse analysis

| Existing component or pattern | Location | Design response |
| --- | --- | --- |
| Application/API/frontend implementation | Not present in the repository | Establish the vertical boundaries above rather than inventing a dependency on nonexistent code. |
| Product ownership and lifecycle rules | docs/product and .specs/STATE.md | Treat as normative inputs; do not duplicate ownership logic in the Financeiro module. |
| Closed feature specification | .specs/features/finance-contract-receivables/spec.md | Map every requirement in the traceability matrix below. |

The absence of source code is an implementation risk, not a product blocker. The first implementation task must confirm the actual monorepo layout and place these modules consistently with the scaffold, without changing this design's interfaces or behavior.

## Domain Model and Ownership

### References owned outside this vertical

The vertical stores canonical identifiers only; it never copies names, CPF/CNPJ, address, or other Client data.

| External concept | Owner | Required Financeiro view |
| --- | --- | --- |
| Contract | Comercial | Canonical contract ID, canonical client ID, BRL financial value applicable to this plan, BRL currency, and an owner-defined indication that it is eligible for receivables. |
| Client | Plataforma Compartilhada | Canonical client ID returned through the Contract context. |
| User and capabilities | Plataforma Compartilhada | Authenticated user ID and explicit capabilities. |
| AuditEvent | Transversal service | Append-only audit writer and read projection filtered by Financeiro context; for this vertical, its storage adapter participates in the same PostgreSQL transaction. |

The ContractReferencePort makes this boundary explicit:

~~~typescript
interface ContractReferencePort {
  getReceivablesContext(contractId: string): Promise<
    | {
        kind: 'available'
        contractId: string
        clientId: string
        currency: 'BRL'
        financialValue: MoneyBRL
        eligibleForReceivables: true
      }
    | { kind: 'unavailable-or-ineligible' }
  >
}
~~~

Comercial owns the exact Contract lifecycle semantics behind eligibleForReceivables. The Financeiro vertical does not infer or mutate a commercial status. This conforms to Contract ownership and avoids inventing a new Contract state.

CreatePaymentPlan and ActivatePaymentPlan obtain a fresh ContractReferencePort result before their database transaction. If the Contract is unavailable, ineligible, lacks the applicable BRL value, or returns a Client reference inconsistent with the plan, the command fails before any local write. Financeiro stores only the canonical Contract and Client IDs returned by this port. It neither copies Client personal data nor tries to repair a Contract changed outside Financeiro; a signed Contract is expected to remain an immutable shared fact under AD-010. Existing historical Financeiro rows retain their canonical references even if a read projection later cannot enrich display data from the owner.

### Financeiro aggregates and records

| Concept | Identity and ownership | Essential relationships |
| --- | --- | --- |
| PaymentPlan | Financeiro-owned stable ID. One non-discarded plan per Contract in this version. | References one Contract and one Client; contains Installments and all FinancialTransactions. |
| Installment | Financeiro-owned stable ID, independent of installmentNumber, value, date, and visual order. | Belongs to one PaymentPlan; is the target of receipt and reversal allocations. |
| FinancialTransaction | Financeiro-owned immutable ID. Its type is RECEIPT or REVERSAL. | References one PaymentPlan and actor; its exactly-one Contract, Client, and BRL context are inherited from that plan. REVERSAL references exactly one original RECEIPT. |
| TransactionAllocation | Financeiro-owned immutable ID. | Belongs to one FinancialTransaction and one Installment. A reversal allocation points to exactly one original receipt allocation. |
| IdempotencyRecord | Feature-local technical record with stable ID and globally unique key. | Identifies a completed command, actor, fingerprint, and original result. |
| AuditEvent | Transversal immutable record. | References Financeiro aggregate IDs and actor through minimal, non-PII context. |

### Exact BRL value object

The implementation will persist BRL as integer centavos in PostgreSQL BIGINT fields, represented in Prisma as BigInt. This is an equivalent exact monetary representation, chosen over Decimal because this version has one currency and exactly two permitted fractional digits.

| Concern | Design |
| --- | --- |
| API representation | A decimal string, never a JSON number: for example, "10", "10.5", or "10.50". |
| Input parsing | MoneyBRL.parse accepts at most two fractional digits, normalizes to centavos, and rejects precision above two decimals before persistence. A positive-only factory rejects zero and negative values where the specification requires positivity. |
| Persistence | totalCents, originalCents, amountCents, and allocation amountCents use PostgreSQL BIGINT and Prisma BigInt. |
| Arithmetic | Domain and repository aggregation use integer arithmetic only. TypeScript uses BigInt, never Number, for financial arithmetic. |
| Comparison and equality | Exact BigInt comparison and equality; no epsilon or floating-point tolerance. |
| Response formatting | A formatter converts centavos to an immutable two-decimal BRL string, for example "10.50". |
| Currency | PaymentPlan persists BRL explicitly. FinancialTransaction and TransactionAllocation inherit the parent plan currency and do not duplicate it. |

BIGINT's physical range is a technical storage limit, not a product price rule. Input outside the database range is rejected as invalid monetary input. A future multi-currency feature may revisit the Money value object and currency exponent; it does not alter this version's BRL behavior.

### Monetary wire contract

The following contract is mandatory across Hono, Node.js, Prisma, and React:

| Boundary | Exact type and behavior |
| --- | --- |
| HTTP request | Every monetary input is a JSON string in fixed decimal notation, never a JSON number. The accepted grammar is nonnegative whole digits optionally followed by a period and one or two fractional digits; positivity is then enforced where required. Examples: "1000.50", "10", and "10.5" are valid; "10.501", "-1", "1e3", "1,00", and whitespace are rejected. |
| Hono DTO parser | Receives a string only. It does not call Number, parseFloat, or a JSON numeric coercion. It splits the validated string, pads the fractional part to two digits, and creates cents with BigInt. |
| Node.js / TypeScript domain | MoneyBRL contains a bigint cents value. Addition, subtraction, comparisons, exact equality, and the BigInt maximum-range test use bigint operators only. |
| Prisma runtime | Prisma returns BIGINT columns as JavaScript bigint. Repositories map them to MoneyBRL before a value reaches a use case or response DTO. |
| PostgreSQL | totalCents, originalCents, and amountCents are BIGINT. The parser rejects a cent amount above 9223372036854775807 before a write; SQL CHECK constraints preserve positivity where required. |
| HTTP response | Every monetary field is serialized by an explicit formatter as a two-decimal string, for example "1000.50". Raw Prisma objects are never passed to JSON.stringify because native bigint is not JSON-serializable. |
| React | The typed API client and view models keep monetary values as decimal strings. UI formatting uses the same string-to-centavos formatter or bigint, never Number or implicit arithmetic. The API projection remains authoritative. |

An aggregate can contain many historical events, so database aggregation may return PostgreSQL numeric for SUM(BIGINT). The projection repository either iterates bigint values or converts an aggregate textual integer to bigint; it never converts an aggregate to JavaScript number. Net amount and remaining balance stay bounded by the positive original installment amount because allocation policies enforce that invariant.

### Calendar and timestamp value objects

| Concern | Design |
| --- | --- |
| dueDate | PostgreSQL DATE, mapped in Prisma as DateTime with @db.Date. At the domain/API boundary it is a YYYY-MM-DD LocalDate, never an instant. |
| Financial timestamp | FinancialTransaction.occurredAt is a database-generated, immutable TIMESTAMPTZ instant. The client payload contains no occurrence timestamp field. |
| Storage timezone | PostgreSQL TIMESTAMPTZ stores an instant; the database/session and API serialize it as UTC ISO-8601. |
| Business calendar | Clock.todayIn('America/Sao_Paulo') returns a LocalDate. Due status compares canonical LocalDate values, not JavaScript Date milliseconds. |
| No backdating | Receipt and reversal DTO parsers reject an occurrence timestamp field. The use case never accepts a caller-provided time. |

The Prisma persistence adapter is the only layer allowed to translate LocalDate to Prisma DateTime: it writes the UTC date components while PostgreSQL connection sessions are configured to UTC, and reconstructs YYYY-MM-DD with UTC getters when reading. It never calls local-time Date getters or compares JavaScript Date instants for due logic. PostgreSQL DATE remains timezone-free; America/Sao_Paulo is applied only by Clock.todayIn when deriving DueStatus.

DueStatus is calculated as follows, in this precedence order:

1. remainingBalance equals zero: NOT_DUE.
2. today in America/Sao_Paulo is after dueDate and remainingBalance is positive: OVERDUE.
3. otherwise: NOT_DUE.

Thus the due date itself remains NOT_DUE, and a reversal after the due date immediately makes an open installment OVERDUE.

## Proposed Prisma / PostgreSQL Model

The following is a conceptual Prisma model. External Contract, Client, and User identifiers are scalar canonical references because their physical schemas are not part of this feature. If the shared schema later exposes compatible foreign keys, an adapter-level migration may add them without changing the domain boundary.

~~~prisma
enum PaymentPlanStatus {
  DRAFT
  ACTIVE
}

enum FinancialTransactionType {
  RECEIPT
  REVERSAL
}

enum CurrencyCode {
  BRL
}

model PaymentPlan {
  id              String            @id @default(uuid()) @db.Uuid
  contractId      String            @db.VarChar(128)
  clientId        String            @db.VarChar(128)
  currency        CurrencyCode      @default(BRL)
  totalCents      BigInt            @db.BigInt
  status          PaymentPlanStatus @default(DRAFT)
  discardedAt     DateTime?         @db.Timestamptz(6)
  discardedById   String?           @db.VarChar(128)
  createdAt       DateTime          @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime          @updatedAt @db.Timestamptz(6)

  installments    Installment[]
  transactions    FinancialTransaction[]

  @@index([contractId, discardedAt])
  @@index([clientId])
}

model Installment {
  id                String        @id @default(uuid()) @db.Uuid
  paymentPlanId     String        @db.Uuid
  installmentNumber Int
  originalCents     BigInt        @db.BigInt
  dueDate           DateTime      @db.Date
  createdAt         DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt         DateTime      @updatedAt @db.Timestamptz(6)

  paymentPlan       PaymentPlan   @relation(fields: [paymentPlanId], references: [id], onDelete: Restrict)
  allocations       TransactionAllocation[]

  @@unique([paymentPlanId, installmentNumber])
  @@index([paymentPlanId, dueDate])
}

model FinancialTransaction {
  id                       String                   @id @default(uuid()) @db.Uuid
  paymentPlanId            String                   @db.Uuid
  type                     FinancialTransactionType
  amountCents              BigInt                   @db.BigInt
  occurredAt               DateTime                 @default(now()) @db.Timestamptz(6)
  actorUserId              String                   @db.VarChar(128)
  reason                   String?                  @db.Text
  originalReceiptId        String?                  @db.Uuid

  paymentPlan              PaymentPlan              @relation(fields: [paymentPlanId], references: [id], onDelete: Restrict)
  originalReceipt           FinancialTransaction?    @relation("ReceiptReversals", fields: [originalReceiptId], references: [id], onDelete: Restrict)
  reversals                 FinancialTransaction[]   @relation("ReceiptReversals")
  allocations               TransactionAllocation[]

  @@index([paymentPlanId, occurredAt])
  @@index([originalReceiptId])
}

model TransactionAllocation {
  id                   String                 @id @default(uuid()) @db.Uuid
  transactionId        String                 @db.Uuid
  installmentId        String                 @db.Uuid
  amountCents          BigInt                 @db.BigInt
  originalAllocationId String?                @db.Uuid
  createdAt            DateTime               @default(now()) @db.Timestamptz(6)

  transaction          FinancialTransaction   @relation(fields: [transactionId], references: [id], onDelete: Restrict)
  installment          Installment            @relation(fields: [installmentId], references: [id], onDelete: Restrict)
  originalAllocation   TransactionAllocation? @relation("AllocationReversals", fields: [originalAllocationId], references: [id], onDelete: Restrict)
  reversalAllocations  TransactionAllocation[] @relation("AllocationReversals")

  @@index([transactionId])
  @@index([installmentId])
  @@index([originalAllocationId])
}

model IdempotencyRecord {
  id                 String   @id @default(uuid()) @db.Uuid
  key                String   @unique @db.VarChar(128)
  commandType        String   @db.VarChar(96)
  actorUserId        String   @db.VarChar(128)
  semanticParameters Json
  requestFingerprint String   @db.Char(64)
  resultType         String   @db.VarChar(64)
  resultId           String   @db.VarChar(128)
  resultPayload      Json
  completedAt        DateTime @default(now()) @db.Timestamptz(6)

  @@index([actorUserId, commandType])
}

model AuditEvent {
  id               String   @id @default(uuid()) @db.Uuid
  domain           String   @db.VarChar(64)
  action           String   @db.VarChar(96)
  aggregateType    String   @db.VarChar(64)
  aggregateId      String   @db.VarChar(128)
  contractId       String?  @db.VarChar(128)
  paymentPlanId    String?  @db.Uuid
  transactionId    String?  @db.Uuid
  actorUserId      String   @db.VarChar(128)
  reason           String?  @db.Text
  context          Json
  occurredAt       DateTime @default(now()) @db.Timestamptz(6)

  @@index([contractId, occurredAt])
  @@index([paymentPlanId, occurredAt])
  @@index([transactionId])
}
~~~

FinancialTransaction.occurredAt is its only persisted financial timestamp in v1; it is database generated and immutable. The later distinction between occurredAt, recordedAt, and bank settlement date is not modeled here.

FinancialTransaction obtains its exactly-one Contract, Client, and BRL context through its non-null PaymentPlan. PaymentPlan keeps those canonical references and the design makes them write-once. This avoids copying the same cross-domain references into every transaction while preserving the required relationship:

~~~text
FinancialTransaction -> one PaymentPlan -> one Contract, one Client, BRL
TransactionAllocation -> one Installment -> that same PaymentPlan
~~~

AuditEvent is owned conceptually by the transversal service, but **in this first vertical its append-only table is in the same PostgreSQL database and AuditWriter uses the transaction-scoped Prisma client**. It is not an HTTP, queue, or remote-service call. A future architecture change must preserve this local atomic AuditEvent evidence; no extraction mechanism is introduced in v1.

### Entity fields, relationships, and indexes

| Entity | Relevant fields and relations | Index / uniqueness intent |
| --- | --- | --- |
| PaymentPlan | contractId and clientId canonical references; BRL currency; operational total; DRAFT or ACTIVE; nullable discard marker. | Partial unique index for one non-discarded plan per Contract; contract and client read indexes. |
| Installment | Stable ID; paymentPlanId; presentation installmentNumber; original value; calendar due date. | paymentPlanId plus installmentNumber unique; plan plus dueDate supports list and overdue views. |
| FinancialTransaction | Plan, immutable type/value/time/actor; reversal points to original receipt. Contract, Client, and currency are inherited through the non-null parent plan. | Plan timeline and reversal-origin indexes; Contract consultation joins through PaymentPlan. |
| TransactionAllocation | Parent transaction, target installment, positive amount; reversal allocation points to original receipt allocation. | Parent, installment, and original-allocation indexes support projections and reversal limit queries. |
| IdempotencyRecord | Opaque key, command, actor, normalized semantic parameters, fingerprint, and sanitized original result. JSON represents cent values as strings, never raw bigint. | Globally unique key is the concurrency gate; actor and command index assists diagnostics only. |
| AuditEvent | Minimal aggregate references, action, actor, time, reason, and sanitized context. | Contract, plan, and transaction timelines. |

### Database-enforced invariants

Prisma schema declarations are supplemented by named PostgreSQL migrations for constraints Prisma cannot express.

The migration must create a partial unique index equivalent to:

~~~sql
CREATE UNIQUE INDEX payment_plan_one_live_contract
  ON "PaymentPlan" ("contractId")
  WHERE "discardedAt" IS NULL;
~~~

The physical table/column names may follow the Prisma mapping adopted by the repository, but the partial predicate and uniqueness semantics are mandatory. A normal Prisma @@unique on contractId would be incorrect because it would make a discarded plan continue to occupy the v1 0..1 cardinality.

| Invariant | Enforcement |
| --- | --- |
| At most one non-discarded plan per Contract | Partial unique index: unique contractId where discardedAt is null. A discarded plan therefore does not prevent a new plan. |
| Explicit BRL storage | CHECK currency equals BRL on PaymentPlan. Every transaction inherits this sole plan currency. |
| Positive Installment, transaction, and allocation values | CHECK originalCents greater than 0, amountCents greater than 0. |
| A receipt has no originalReceiptId; a reversal has one | CHECK based on FinancialTransactionType and originalReceiptId nullability. |
| Stable installment number uniqueness | Unique paymentPlanId plus installmentNumber. |
| Prevent cascaded history deletion | All financial relationships use ON DELETE RESTRICT; the normal application exposes no delete for immutable history. |
| No in-place change to immutable facts | PostgreSQL trigger rejects UPDATE or DELETE on FinancialTransaction and TransactionAllocation. A second append-only trigger protects AuditEvent. |
| One persisted idempotency result per key | Unique key on IdempotencyRecord. |
| Financeiro relation integrity beyond Prisma FKs | A named deferred PostgreSQL constraint trigger checks that every allocation's transaction and installment have the same PaymentPlan; a RECEIPT allocation has no originalAllocationId; a REVERSAL allocation references an allocation of its parent original RECEIPT; and that the original transaction is a RECEIPT in the same plan. |
| Permanent historical freeze | A named PostgreSQL guard trigger rejects structural UPDATE or DELETE of PaymentPlan and Installment whenever any FinancialTransaction exists for that plan. It also rejects updates to PaymentPlan Contract, Client, or currency references after creation. |

Named migration artifacts are limited to:

- payment_plan_one_live_contract for the partial unique index;
- CHECK constraints for BRL and positive cent values;
- finance_ledger_relationship_integrity as a deferred constraint trigger;
- finance_plan_history_freeze and finance_plan_reference_immutable as guard triggers;
- finance_ledger_append_only and audit_event_append_only as immutable-history triggers.

No raw SQL is used to implement ordinary CRUD or domain arithmetic. It is reserved for these PostgreSQL-only guarantees, the transaction-scoped advisory lock, the PaymentPlan row lock, and set-based projection reads.

The following invariants remain application/domain responsibilities because they span rows, external Contract context, or command intent:

- 1 through N continuous numbering at activation.
- Sum of Installments exactly equals PaymentPlan total and Contract financial value at activation.
- DRAFT-only structural mutation; ACTIVE to DRAFT and discard preconditions; permanent freeze after any financial history.
- Contract eligibility, Client reference, and BRL value returned by the external owner.
- Allocation open-balance checks, multiple allocations in one command, and reversal remaining-value checks.
- Exact sum of allocations to a transaction and exact sum of reversal allocations to a reversal amount.
- Required capabilities and required reasons.
- Full command atomicity and idempotent replay behavior.

The domain enforces these inside the same locked transaction as persistence. Database constraints are defense in depth, not substitutes for financial policies.

### Discard persistence strategy

Discard uses a soft lifecycle marker, not a CANCELLED state and not a hard delete:

- It is allowed only after a plan is DRAFT and has no financial history.
- The plan gets discardedAt and discardedById in the same transaction as its discard AuditEvent and IdempotencyRecord.
- All active-plan reads filter discardedAt is null.
- The partial unique index allows Contract to return to zero active PaymentPlans and receive a future plan.
- The audit query exposes discard evidence. The normal Financeiro operation never restores a discarded plan.

## Derived Financial Projection

SettlementStatus and DueStatus are runtime projections, never writable database columns. This avoids stale materialized state after a receipt or reversal and makes the approved formulas reproducible from immutable records.

For each Installment:

~~~text
receiptAllocatedCents =
  sum(all allocation amountCents whose parent type is RECEIPT)

reversedCents =
  sum(all reversal allocation amountCents that reference those receipt allocations)

netAllocatedCents = receiptAllocatedCents - reversedCents
remainingBalanceCents = originalCents - netAllocatedCents
receivedAmountCents = netAllocatedCents

For each original receipt allocation:
reversibleAmountCents =
  original receipt allocation amountCents
  - sum(all reversal allocation amountCents that reference it)

SettlementStatus:
  PENDING  when netAllocatedCents = 0
  PARTIAL  when 0 < netAllocatedCents < originalCents
  SETTLED  when netAllocatedCents = originalCents

DueStatus:
  NOT_DUE  when remainingBalanceCents = 0
  OVERDUE  when todayAmericaSaoPaulo > dueDate and remainingBalanceCents > 0
  NOT_DUE  otherwise
~~~

The query repository loads the plan, its Installments, and allocation aggregates in bounded set-based queries. The domain projection computes receivedAmount, remainingBalance, reversibleAmount, and statuses with MoneyBRL and LocalDate. None is a writable database column or a field accepted by a mutation DTO. No API or UI calculates authoritative balances.

The current scope has no invalid or deleted financial event state: every persisted receipt/reversal/allocation is valid because the creating command was atomic and immutable. If a later feature adds a legal voiding model, it must extend this projection explicitly rather than alter stored values.

Projection code treats netAllocatedCents outside the inclusive range from zero through originalCents as an integrity fault, never as a status to coerce. The receipt/reversal policies and the deferred relation trigger are what prevent that state from being persisted.

## Application Components and Interfaces

### Hono HTTP adapters

- **Purpose:** Translate HTTP to typed commands and typed results.
- **Location:** apps/api/src/modules/finance-contract-receivables/http.
- **Dependencies:** Hono, authenticated principal middleware, capability middleware, DTO parser, use cases, error mapper.
- **Rule:** Route handlers contain no allocation calculation and no direct Prisma call.

Each mutation route composes middleware in this order:

1. authentication resolves an AuthenticatedPrincipal with canonical user ID;
2. requireCapability checks the command-specific capability;
3. requireIdempotencyKey validates the Idempotency-Key header;
4. DTO parser validates identifiers, strings, LocalDate, and decimal-string money input;
5. handler calls the single application use case;
6. one Hono error mapper converts DomainError to the response contract.

Hono supports typed middleware context variables, so the authenticated principal and verified capability can be passed to a route without direct organizational-role conditions.

### Authorization port

~~~typescript
interface AuthorizationPort {
  require(actorUserId: string, capability: FinanceCapability): Promise<void>
  list(actorUserId: string): Promise<ReadonlySet<FinanceCapability>>
}
~~~

FinanceCapability is a closed application enum containing only the approved names:

- FINANCE_READ
- FINANCIAL_AUDIT_READ
- PAYMENT_PLAN_CREATE
- PAYMENT_PLAN_EDIT_DRAFT
- PAYMENT_PLAN_ACTIVATE
- PAYMENT_PLAN_RETURN_TO_DRAFT
- PAYMENT_PLAN_DISCARD
- INSTALLMENT_CREATE
- INSTALLMENT_EDIT_DRAFT
- INSTALLMENT_REMOVE
- INSTALLMENT_REORDER
- RECEIVABLE_REGISTER_PAYMENT
- RECEIVABLE_REVERSE_PAYMENT

The shared authorization policy maps organizational jobs to this initial set as configured grants, not as conditions in Financeiro code:

| Organizational job | Financial capability grants in this version |
| --- | --- |
| Gerente Financeiro | FINANCE_READ, FINANCIAL_AUDIT_READ, PAYMENT_PLAN_CREATE, PAYMENT_PLAN_EDIT_DRAFT, PAYMENT_PLAN_ACTIVATE, INSTALLMENT_CREATE, INSTALLMENT_EDIT_DRAFT, INSTALLMENT_REMOVE, INSTALLMENT_REORDER, RECEIVABLE_REGISTER_PAYMENT. |
| Vice-Presidente | All Gerente Financeiro grants, plus PAYMENT_PLAN_RETURN_TO_DRAFT, PAYMENT_PLAN_DISCARD, RECEIVABLE_REVERSE_PAYMENT. |
| PLATFORM_ADMIN alone | None. It must receive an explicit financial capability through the same shared authorization mechanism to access this vertical. |

The frontend may use the resolved capability set to conditionally show controls, but server-side authorization is authoritative.

Every command and query use case also receives an AuthenticatedCommandContext created only by the platform authentication adapter and calls AuthorizationPort.require for its own listed capability before opening a Unit of Work. Hono middleware repeats that same check for early HTTP rejection, but it is not the sole guard: an internal caller that invokes a use case without the Hono route remains subject to the capability requirement. No request DTO contains actorUserId, organizational role, PlatformPrivilege, or a capability grant.

### Financial command use cases

| Use case | Command capability | Core responsibility |
| --- | --- | --- |
| CreatePaymentPlan | PAYMENT_PLAN_CREATE | Resolve Contract context; create a DRAFT plan with fixed Contract, Client, BRL reference and operational total. |
| ChangeDraftPlanTotal | PAYMENT_PLAN_EDIT_DRAFT | Change only draft operational total; never reparent the plan. |
| CreateInstallment | INSTALLMENT_CREATE | Add a DRAFT Installment with a stable generated ID and suggested next number if omitted. |
| EditDraftInstallment | INSTALLMENT_EDIT_DRAFT | Change amount and/or dueDate only while DRAFT. |
| RemoveDraftInstallment | INSTALLMENT_REMOVE | Remove one DRAFT Installment atomically. |
| ReorderInstallments | INSTALLMENT_REORDER | Explicitly assign 1 through N numbers to the exact current set of DRAFT Installment IDs. |
| ActivatePaymentPlan | PAYMENT_PLAN_ACTIVATE | Validate the entire plan and Contract context, then move DRAFT to ACTIVE. |
| ReturnPlanToDraft | PAYMENT_PLAN_RETURN_TO_DRAFT | Verify no financial history, require reason, then move ACTIVE to DRAFT. |
| DiscardPaymentPlan | PAYMENT_PLAN_DISCARD | Verify DRAFT and no financial history, then soft-discard with evidence. |
| RegisterReceipt | RECEIVABLE_REGISTER_PAYMENT | Append a RECEIPT and one or more allocations to one ACTIVE plan. |
| ReverseReceipt | RECEIVABLE_REVERSE_PAYMENT | Append a REVERSAL and reversal allocations against one original RECEIPT. |
| GetContractReceivables | FINANCE_READ | Return contract-linked active plan, installments, transactions, allocations, and derived projection. |
| GetFinancialAudit | FINANCIAL_AUDIT_READ | Return minimal audit history, including discarded-plan evidence. |

No command changes PaymentPlan.contractId, PaymentPlan.clientId, or PaymentPlan.currency after creation. A mistaken draft association is corrected by discard without history and creation of a different plan, not by silently retargeting it.

### Financial policies

| Policy | Inputs | Result / invariant |
| --- | --- | --- |
| PaymentPlanPolicy | Plan, Installments, Contract receivables context | Validates DRAFT to ACTIVE: BRL, valid Contract context, at least one Installment, continuous numbers, positive Installments, due dates, exact total equality. |
| DraftMutationPolicy | Plan state and financial-history presence | Allows structural change only in DRAFT; rejects it in ACTIVE; rejects any structural change after history. |
| ReceiptAllocationPolicy | Active plan, selected Installments, derived open balances, receipt amount | Requires positive values, one or more allocations, same plan/Contract/Client/BRL, exact sum, and no excess balance. |
| ReversalPolicy | Original RECEIPT, original allocations, previous reversal totals, proposal | Requires positive values, nonempty allocations, original receipt/allocation references, same installment, exact sum, and no value above still reversible. |
| InstallmentProjectionPolicy | Original amount, immutable allocations, Clock | Returns exact amounts and the two derived statuses. |
| IdempotencyPolicy | Key, actor, command type, canonical command fingerprint | Identifies replay, conflict, or first processing without bypassing authorization. |

### Audit writer

AuditWriter is a transaction-bound port, not a remote service abstraction:

~~~typescript
interface TransactionalAuditWriter {
  append(
    tx: Prisma.TransactionClient,
    event: {
      action: FinanceAuditAction
      actorUserId: string
      aggregate: { type: string; id: string }
      contractId: string
      paymentPlanId: string
      transactionId?: string
      reason?: string
      context: Record<string, string | string[] | boolean>
    }
  ): Promise<void>
}
~~~

The only v1 adapter writes AuditEvent through the supplied transaction-scoped Prisma client into the same PostgreSQL database. A use case cannot commit its FinancialTransaction, PaymentPlan transition, or IdempotencyRecord unless AuditWriter.append succeeds; any write failure rolls back the entire Unit of Work. Context contains only identifiers, action facts, amounts where necessary, and no copied Client/Contract personal data. Monetary context is encoded as a decimal string or cents string, never a JavaScript number or raw bigint. Required events are:

- finance.payment-plan.created
- finance.payment-plan.activated
- finance.payment-plan.returned-to-draft
- finance.payment-plan.discarded
- finance.installment.created
- finance.installment.updated
- finance.installment.removed
- finance.installments.reordered
- finance.receipt.registered
- finance.receipt.reversed

| Audit action | Minimum context in addition to actor, occurredAt, aggregate, and Contract reference |
| --- | --- |
| payment-plan.created | paymentPlanId, clientId canonical reference, BRL, totalCents. |
| payment-plan.activated | paymentPlanId, priorStatus DRAFT, totalCents, installment IDs. |
| payment-plan.returned-to-draft | paymentPlanId, priorStatus ACTIVE, financialHistoryPresent false, mandatory reason. |
| payment-plan.discarded | paymentPlanId, Contract ID, priorStatus DRAFT, financialHistoryPresent false, mandatory reason, discard marker. |
| installment.created, updated, removed, reordered | paymentPlanId, affected Installment IDs, structural action, and before/after identifiers or values limited to financial facts. |
| receipt.registered | paymentPlanId, receipt transaction ID, allocation IDs and values, total amount. |
| receipt.reversed | paymentPlanId, reversal transaction ID, original receipt ID, original allocation IDs, reversal allocation values, total amount, mandatory reason. |

## PaymentPlan and Installment Lifecycle

~~~mermaid
stateDiagram-v2
  [*] --> DRAFT: create
  DRAFT --> ACTIVE: activate after full validation
  ACTIVE --> DRAFT: elevated command, reason, no history
  DRAFT --> [*]: discard, reason, no history
  ACTIVE --> ACTIVE: receipt or reversal history; structure frozen
  DRAFT --> DRAFT: draft-only structural commands
~~~

The final state marker in the diagram represents soft discard from active operation, not a CANCELLED business state.

| Operation | Preconditions | Effect |
| --- | --- | --- |
| Create DRAFT plan | Valid eligible Contract context in BRL; no non-discarded plan for Contract. | Create one plan with canonical Contract/Client refs, BRL, DRAFT status, and audit. |
| Change DRAFT plan total | DRAFT; no discard. | Change only totalCents; activation is still the equality gate against Contract and Installments. |
| Create/edit/remove Installment | DRAFT; no discard; capability-specific. | Stable ID on creation; values and due dates checked; numbers remain unique. |
| Reorder / renumber | DRAFT; command lists exactly all current Installment IDs. | Persist numbers 1 through N in listed order, preserving every ID. |
| Activate | DRAFT; no discard; Contract context valid/BRL; at least one Installment; all positive/dated; sum equals plan total and Contract value; numbers exactly 1 through N. | ACTIVE; never renumbers as a side effect; audit. |
| Return ACTIVE to DRAFT | ACTIVE; no FinancialTransaction, Allocation, or reversal history; reason. | DRAFT; audit. |
| Discard | DRAFT; no history; reason. ACTIVE must first return to DRAFT. | Soft marker; audit evidence; no restoration endpoint. |
| First receipt or reversal history | Plan ACTIVE. | Permanently prevents structural Plan/Installment changes, return to DRAFT, discard, deletion, and replacement in this version. Reversal does not thaw the plan. |

The feature does not create mutable descriptive fields on these aggregates in this version. It therefore exposes no post-freeze edit route. A future tag, attachment, or note capability must be explicitly designed so it cannot alter a financial fact.

## Atomicity and Concurrency

### Common Unit of Work protocol

Every persistent command uses one short Prisma interactive transaction at PostgreSQL READ COMMITTED isolation. The default isolation is deliberate: every accepted mutation for an existing PaymentPlan first acquires an exclusive row lock on that one plan, so SERIALIZABLE would add abort/retry behavior without protecting an additional v1 write path.

1. Hono authenticates the request, parses its DTO and Idempotency-Key, but supplies no actor ID or timestamp from the client.
2. The use case receives the authenticated actor context and calls AuthorizationPort.require itself. Hono capability middleware is an early rejection only; an internal caller cannot bypass the use-case check.
3. The use case normalizes money, LocalDate, identifiers, reason, and allocation ordering into the canonical idempotency parameters.
4. Before any ContractReferencePort call, perform an authorized, non-locking IdempotencyRecord lookup by full key. An existing record is verified against actor, command type, and fingerprint and immediately returns the stored result or IDEMPOTENCY_CONFLICT. This lets a completed replay succeed even if Contract display/context is unavailable later.
5. Only when no completed record exists, obtain current Contract context for create/activate before the transaction. No network call occurs while holding database locks.
6. Inside the transaction, acquire a transaction-scoped PostgreSQL advisory lock derived deterministically from the idempotency key. The lock is released automatically on commit or rollback.
7. Re-read IdempotencyRecord by its globally unique full key after the advisory lock. If another instance committed it after the preflight lookup, verify and return the stored result or conflict without a financial write or AuditEvent.
8. For an existing plan, acquire SELECT ... FOR UPDATE on its PaymentPlan row. This is the sole business-concurrency lock for the plan. The command then reads all selected Installments, allocations, reversal totals, and history through the same transaction client.
9. Apply the domain policy. On any failure, throw before writing. PostgreSQL rolls back the whole transaction, releases advisory/row locks, and leaves no AuditEvent or IdempotencyRecord.
10. Persist the domain effect, all allocations, one AuditEvent via TransactionalAuditWriter, and the completed IdempotencyRecord. The final unique IdempotencyRecord insertion is a second database safeguard in addition to the advisory lock.
11. Commit once and return the result. The application must use the transaction-scoped Prisma client for every query and write in steps 6 through 10. It must not use Promise.all or wait for UI/network work inside this transaction.

### Locking strategy and retry

There are two distinct, non-redundant locks:

| Lock | Purpose | Why it is needed |
| --- | --- | --- |
| Transaction-scoped advisory lock by idempotency key | Serializes attempts that claim the same logical client operation, including create-plan commands before a PaymentPlan row exists. | A unique record written only at the end of the all-or-nothing command cannot by itself serialize two in-flight requests before either has a record. |
| SELECT ... FOR UPDATE on one PaymentPlan row | Serializes all structural and financial mutations within that plan. | It makes the current balance/history/state read authoritative before allocation, reversal, activation, return to DRAFT, or discard. |

There is intentionally no separate Installment or original-allocation row lock in v1. A command is constrained to one PaymentPlan, and every finance mutation acquires that plan lock before reading or writing its Installments/allocations. The plan lock therefore serializes all selected Installments, including a receipt that allocates several of them. This is simpler than multi-row locking and sufficient without a performance SLO.

All commands acquire locks in one fixed order:

1. transaction-scoped advisory lock for Idempotency-Key;
2. one PaymentPlan row, when the command has a plan;
3. no further business row locks.

CreatePaymentPlan has no plan row yet, so its partial unique index is the cardinality arbiter after the advisory lock. A future cross-plan allocation feature would require a new reviewed sorted-plan lock protocol; it is out of scope.

Deadlocks are not expected under this one-plan ordering, but the application catches PostgreSQL deadlock error 40P01 and retries the whole transaction at most two times, for a maximum of three attempts, using the same key and canonical command. READ COMMITTED does not normally produce serialization failures; if an infrastructure configuration returns SQLSTATE 40001, it receives the same bounded retry. Business validation, authorization failures, idempotency conflicts, and unique-cardinality conflicts are never automatically retried. Exhaustion maps to retriable CONCURRENT_OPERATION_CONFLICT with no committed effect.

Prisma repositories use parameterized transaction-scoped raw SQL only for pg_advisory_xact_lock, SELECT ... FOR UPDATE of PaymentPlan, and the aggregate/read queries that need PostgreSQL locking behavior. Prisma model operations persist normal rows. Migrations use SQL for partial indexes, CHECK constraints, and triggers. No unsafe dynamic SQL or user-controlled table/column interpolation is allowed.

### Critical operation transactions

| Operation | Locked data and validation | Atomic writes |
| --- | --- | --- |
| Create plan | Advisory idempotency lock; Contract context was read before transaction; partial unique index arbitrates distinct-key same-Contract races. | DRAFT PaymentPlan, creation AuditEvent, completed IdempotencyRecord. |
| Draft plan or Installment mutation | Advisory lock then PaymentPlan FOR UPDATE. Verify DRAFT/not discarded before any update, insert, deletion, or reorder. | Requested structural change, one AuditEvent, completed IdempotencyRecord. |
| Activate | Advisory lock then PaymentPlan FOR UPDATE. Load every Installment, read current Contract context, and validate every activation invariant. | ACTIVE status, activation AuditEvent, completed IdempotencyRecord. |
| Return ACTIVE to DRAFT | Advisory lock then PaymentPlan FOR UPDATE. Prove absence of FinancialTransaction and defensive allocation history; require reason. | DRAFT status, AuditEvent, completed IdempotencyRecord. |
| Discard | Advisory lock then PaymentPlan FOR UPDATE. Prove DRAFT and absent history; require reason. | discardedAt/discardedById, AuditEvent, completed IdempotencyRecord. |
| Receipt with multiple allocations | Advisory lock then PaymentPlan FOR UPDATE. Load all selected Installments and event aggregates after the lock; verify ACTIVE/not discarded, membership, exact sum, and open balances. | RECEIPT, all allocations, receipt AuditEvent, completed IdempotencyRecord. |
| Reversal with multiple allocations | Advisory lock then PaymentPlan FOR UPDATE. Load original RECEIPT, referenced original allocations, and already-reversed amounts after the lock. | REVERSAL, all reversal allocations, reversal AuditEvent, completed IdempotencyRecord. |

### Allocation race condition

For an Installment with R$ 1.000, two concurrent requests allocating R$ 700 cannot both commit:

1. The first request locks the PaymentPlan, derives open balance R$ 1.000 from immutable events, and records R$ 700.
2. The second request waits on the same PaymentPlan lock. After the first commits, it reads R$ 300 remaining.
3. Its proposed R$ 700 violates ReceiptAllocationPolicy and its entire transaction rolls back.

The plan lock intentionally serializes financial mutations within one PaymentPlan in this first vertical. This is conservative but simpler and safer than independently locking only changed rows; no performance SLO permits a more complex optimization. SERIALIZABLE isolation was removed because this lock protocol already makes every accepted plan mutation observe the previous committed mutation.

### Reversal race condition

For an original receipt allocation of R$ 1.000, two concurrent reversals of R$ 700 cannot both commit:

1. The first reversal locks the parent PaymentPlan, reads zero previous reversal amount for the original allocation, accepts R$ 700, and commits the REVERSAL plus reversal allocation.
2. The second reversal waits on that same PaymentPlan lock. Once released, it re-reads the original allocation's reversal total as R$ 700, leaving only R$ 300 reversible.
3. Its R$ 700 proposal violates ReversalPolicy. Its entire transaction, including any AuditEvent or idempotency insertion attempted after validation, rolls back.

The deferred ledger-relation trigger additionally verifies that a reversal allocation points to the addressed original receipt allocation. The plan lock supplies concurrency; the trigger supplies persistence-level relationship integrity.

### History presence and permanent freeze

hasFinancialHistory is not a writable flag. It is determined within the locked transaction by EXISTS FinancialTransaction for the plan; the guard also defensively checks allocations joined through Installment. A persisted RECEIPT or REVERSAL remains such a record forever because ledger rows are append-only. Therefore a full reversal never returns the plan to an editable state.

## Idempotency Design

### Key and scope

- Transport: mandatory Idempotency-Key request header for every persistent command in this feature.
- Format: opaque client-generated printable string of 16 through 128 characters; UUID v4 is the recommended client format. The server does not embed financial meaning in it.
- Scope: globally unique within this ERP deployment, not merely per route or per actor. This makes another actor or command attempting to reuse a key an explicit conflict.
- Commands covered: create/change/activate/return/discard plan; create/edit/remove/reorder Installment; register receipt; register reversal.
- Reads require no key.

### Canonical fingerprint and result

The application forms a canonical JSON representation containing:

- command type;
- target resource IDs from route and body;
- normalized money values expressed as decimal-free cent strings;
- canonical YYYY-MM-DD due dates;
- sorted allocation/reversal-allocation targets and values;
- reasons and all other behaviorally relevant parameters.

The record persists this normalized semantic-parameter object and its SHA-256 fingerprint. The actor ID is persisted separately and also compared. Formatting-only variants such as "10.5" and "10.50" normalize to the same monetary value. Array order without business meaning is normalized. The fingerprint does not include a client timestamp because commands cannot set one.

IdempotencyRecord persists the key, command type, actor, normalized semantic parameters, fingerprint, result entity type/ID, and a sanitized response payload in the same transaction as the domain facts and audit event. It is inserted only after those domain records and the AuditEvent have been successfully staged in that transaction, immediately before commit. The response payload includes generated stable IDs and computed response data needed to return a semantically equivalent replay.

The implementation derives a signed 64-bit advisory-lock value deterministically from the opaque key and invokes pg_advisory_xact_lock through parameterized transaction-scoped raw SQL. A hash collision can only serialize two unrelated keys temporarily; it cannot produce a replay because the subsequent lookup and unique constraint compare the full key string.

### First processing, replay, conflict, and concurrency

| Situation | Behavior |
| --- | --- |
| First authorized, valid command | Acquire its transaction-scoped advisory lock, find no record, persist facts/audit, insert the final unique idempotency record, and commit once. |
| Same key, same authorized actor, same command and fingerprint | Capability is checked by the use case before the lock. After the lock, return the stored result with no new transaction, allocation, state transition, or audit event. |
| Same key with a different actor, command, or fingerprint | Return IDEMPOTENCY_CONFLICT. No state changes. |
| Missing capability, including PLATFORM_ADMIN-only caller | Return CAPABILITY_MISSING before replay. Idempotency never bypasses authorization. |
| Validation or authorization failure before commit | Roll back/no completed idempotency record. A later valid submission may use the key. |
| Two concurrent equivalent commands, including two API instances | The first holds the transaction-scoped advisory lock. The second waits, then finds the committed record and returns its result. The unique full-key constraint is a second guard should any writer omit the lock. |
| Connection drops after database commit but before HTTP response | The completed record and result are durable. A retry with the same authorized context returns the stored result without a second effect. |
| Deadlock or unexpected serialization failure | Retry the entire bounded transaction at most twice with the same key. If exhausted, return retriable CONCURRENT_OPERATION_CONFLICT with no partial effect. |

The record has no automatic expiry or purge in this version. Duplicate values, installments, or timestamps are never used as a substitute for the explicit key.

The adversarial request scenarios resolve as follows:

| Scenario | Guaranteed outcome |
| --- | --- |
| A. Same key and payload concurrently | One transaction-scoped advisory lock holder commits; the waiter replays the durable result. |
| B. Same key, different payload | Full-key lookup finds a different canonical fingerprint and returns IDEMPOTENCY_CONFLICT. |
| C. Same key, different actor | The actor comparison returns IDEMPOTENCY_CONFLICT after that actor independently passes capability checking. |
| D. First attempt fails before commit | Rollback releases locks and leaves no IdempotencyRecord, ledger row, allocation, or audit row. |
| E. Commit succeeds but HTTP connection drops | The next equivalent authorized request finds the committed record and receives its stored result. |
| F. Ordinary replay after success | The preflight lookup returns the result before any external Contract lookup or mutation transaction. |
| G. Retry after database concurrency abort | At most two full retries use the same key; a successful prior attempt is observed as replay. SERIALIZABLE is not used in v1. |
| H. Two API instances | Both use the same PostgreSQL transaction-scoped advisory namespace and the same unique full-key constraint. |

## Receipt and Reversal Model

~~~mermaid
erDiagram
  PAYMENT_PLAN ||--o{ INSTALLMENT : contains
  PAYMENT_PLAN ||--o{ FINANCIAL_TRANSACTION : records
  FINANCIAL_TRANSACTION ||--o{ TRANSACTION_ALLOCATION : has
  INSTALLMENT ||--o{ TRANSACTION_ALLOCATION : receives
  FINANCIAL_TRANSACTION ||--o{ FINANCIAL_TRANSACTION : "receipt has reversals"
  TRANSACTION_ALLOCATION ||--o{ TRANSACTION_ALLOCATION : "original has reversal allocations"
~~~

### Receipt

RegisterReceipt accepts one positive amount and one or more allocations. The plan ID is taken from the route; Contract, Client, and BRL are derived from the locked plan, not supplied by the caller.

Before any write, the policy verifies:

- plan is ACTIVE and not discarded;
- all target installments exist and belong to that exact plan;
- receipt and allocation values are positive centavo values;
- transaction amount equals exact sum of all allocations;
- each allocation and the combined allocations to the same installment fit the locked current open balance;
- all selected records consequently share one Contract, Client, PaymentPlan, and BRL.

On success, the transaction creates one immutable RECEIPT and all TransactionAllocation records. No unallocated value, cross-plan allocation, credit, overpayment, or automatic distribution exists.

### Reversal

ReverseReceipt is addressed to an original RECEIPT transaction. It accepts a positive nominal reversal amount, a mandatory reason, and one or more reversal allocations.

For every reversal allocation, the policy locks and verifies:

- its originalAllocationId points to an allocation whose parent is the addressed original RECEIPT;
- the original allocation belongs to the same plan and the same Installment as the reversal allocation;
- the original allocation is not itself a reversal allocation;
- proposed amount is positive;
- original allocation amount minus all existing reversal allocations against it is at least the proposed amount.

The policy requires exact equality between the nominal reversal amount and the sum of reversal allocations. It then creates a new immutable REVERSAL, links it to the original RECEIPT, and creates the reversal allocations. It cannot target a REVERSAL, cannot reverse a reversal, and never edits/deletes original records.

## API Design

All routes live under /api/finance. Mutating commands require the Idempotency-Key header in addition to the listed capability. Amount fields below are decimal strings; timestamps are response-only.

| Method and route | Payload / response | Capability | Main domain errors |
| --- | --- | --- | --- |
| GET /contracts/:contractId/receivables | Active plan or null, Installments with derived amounts/statuses, transactions, allocations, and readonly Contract/Client references. | FINANCE_READ | CONTRACT_UNAVAILABLE, FINANCE_CAPABILITY_MISSING |
| GET /contracts/:contractId/receivables/audit | Paginated sanitized audit timeline, including discard evidence when authorized. | FINANCIAL_AUDIT_READ | AUDIT_CAPABILITY_MISSING |
| POST /contracts/:contractId/payment-plans | { totalAmount: "1000.00" }; returns DRAFT plan. | PAYMENT_PLAN_CREATE | CONTRACT_UNAVAILABLE, CONTRACT_INELIGIBLE, CONTRACT_NOT_BRL, PAYMENT_PLAN_ALREADY_EXISTS, INVALID_MONEY |
| PATCH /payment-plans/:planId/draft-total | { totalAmount: "1000.00" }; returns changed DRAFT plan. | PAYMENT_PLAN_EDIT_DRAFT | PAYMENT_PLAN_NOT_DRAFT, PAYMENT_PLAN_DISCARDED, INVALID_MONEY |
| POST /payment-plans/:planId/installments | { originalAmount: "500.00", dueDate: "2026-09-10", installmentNumber?: 1 }; returns new Installment. | INSTALLMENT_CREATE | PAYMENT_PLAN_NOT_DRAFT, INVALID_AMOUNT, INVALID_DUE_DATE, DUPLICATE_INSTALLMENT_NUMBER |
| PATCH /payment-plans/:planId/installments/:installmentId | { originalAmount?: "500.00", dueDate?: "2026-09-10" }; returns changed Installment. | INSTALLMENT_EDIT_DRAFT | PAYMENT_PLAN_NOT_DRAFT, FINANCIAL_HISTORY_PRESENT, INVALID_AMOUNT, INVALID_DUE_DATE |
| DELETE /payment-plans/:planId/installments/:installmentId | No body; returns updated DRAFT summary. | INSTALLMENT_REMOVE | PAYMENT_PLAN_NOT_DRAFT, FINANCIAL_HISTORY_PRESENT |
| POST /payment-plans/:planId/installments/reorder | { installmentIds: ["id-1", "id-2"] }; assigns 1 through N in supplied order. | INSTALLMENT_REORDER | PAYMENT_PLAN_NOT_DRAFT, INVALID_REORDER_SET |
| POST /payment-plans/:planId/activate | No body; returns ACTIVE plan projection. | PAYMENT_PLAN_ACTIVATE | PLAN_WITHOUT_INSTALLMENTS, PLAN_TOTAL_MISMATCH, CONTRACT_VALUE_MISMATCH, INVALID_INSTALLMENT_SEQUENCE |
| POST /payment-plans/:planId/return-to-draft | { reason: "..." }; returns DRAFT plan. | PAYMENT_PLAN_RETURN_TO_DRAFT | PAYMENT_PLAN_NOT_ACTIVE, FINANCIAL_HISTORY_PRESENT, REASON_REQUIRED |
| POST /payment-plans/:planId/discard | { reason: "..." }; returns discard evidence. | PAYMENT_PLAN_DISCARD | PAYMENT_PLAN_NOT_DRAFT, FINANCIAL_HISTORY_PRESENT, REASON_REQUIRED |
| POST /payment-plans/:planId/receipts | { amount: "800.00", allocations: [{ installmentId: "…", amount: "300.00" }, { installmentId: "…", amount: "500.00" }] }; returns RECEIPT and refreshed projection. | RECEIVABLE_REGISTER_PAYMENT | PAYMENT_PLAN_NOT_ACTIVE, ALLOCATION_PLAN_MISMATCH, ALLOCATION_EXCEEDS_OPEN_BALANCE, UNALLOCATED_AMOUNT, INVALID_MONEY |
| POST /financial-transactions/:receiptId/reversals | { amount: "300.00", reason: "...", allocations: [{ originalAllocationId: "…", amount: "300.00" }] }; returns REVERSAL and refreshed projection. | RECEIVABLE_REVERSE_PAYMENT | ORIGINAL_RECEIPT_REQUIRED, REVERSAL_OF_REVERSAL_FORBIDDEN, REVERSAL_EXCEEDS_AVAILABLE, REVERSAL_TOTAL_MISMATCH, REASON_REQUIRED |

The API never exposes a generic status PATCH. State transitions and financial facts use explicit command routes. DTOs reject caller-supplied occurredAt or any equivalent timestamp field with CLIENT_OCCURRENCE_TIMESTAMP_FORBIDDEN.

Command DTOs are closed schemas: unknown fields are rejected rather than silently ignored. In particular, the client cannot supply actorUserId, organizational role, capability, Contract or Client replacement, currency, PaymentPlan status, receivedAmount, remainingBalance, netAllocatedAmount, SettlementStatus, DueStatus, reversibleAmount, AuditEvent data, FinancialTransaction occurrence time, or an allocation target outside the route's plan. The backend derives actor from authentication, timestamps from PostgreSQL, Contract/Client/BRL from PaymentPlan and ContractReferencePort, and all financial projection fields from immutable events.

### Standard error envelope

~~~json
{
  "error": {
    "code": "ALLOCATION_EXCEEDS_OPEN_BALANCE",
    "message": "The requested allocation exceeds the open balance.",
    "details": {
      "installmentId": "…"
    }
  }
}
~~~

| Error code family | HTTP status | Meaning |
| --- | --- | --- |
| CAPABILITY_MISSING, FINANCE_CAPABILITY_MISSING, AUDIT_CAPABILITY_MISSING | 403 | Authenticated actor lacks the explicit capability. |
| CONTRACT_UNAVAILABLE, PAYMENT_PLAN_NOT_FOUND | 404 | The requested reference is unavailable to this authorized Financeiro feature. |
| PAYMENT_PLAN_ALREADY_EXISTS, PAYMENT_PLAN_NOT_DRAFT, PAYMENT_PLAN_NOT_ACTIVE, PAYMENT_PLAN_DISCARDED, FINANCIAL_HISTORY_PRESENT, DUPLICATE_INSTALLMENT_NUMBER, IDEMPOTENCY_CONFLICT | 409 | Current state or reused key conflicts with requested command. |
| CONTRACT_INELIGIBLE, CONTRACT_NOT_BRL, INVALID_MONEY, INVALID_AMOUNT, INVALID_DUE_DATE, INVALID_INSTALLMENT_SEQUENCE, PLAN_WITHOUT_INSTALLMENTS, PLAN_TOTAL_MISMATCH, CONTRACT_VALUE_MISMATCH, ALLOCATION_PLAN_MISMATCH, ALLOCATION_EXCEEDS_OPEN_BALANCE, UNALLOCATED_AMOUNT, REVERSAL_TOTAL_MISMATCH, REVERSAL_EXCEEDS_AVAILABLE, ORIGINAL_RECEIPT_REQUIRED, REVERSAL_OF_REVERSAL_FORBIDDEN, REASON_REQUIRED, CLIENT_OCCURRENCE_TIMESTAMP_FORBIDDEN | 422 | Syntactically valid command violates a domain invariant. |
| CONCURRENT_OPERATION_CONFLICT | 409 with retriable flag | Bounded deadlock or unexpected-serialization retry exhausted; no effect was committed by this request. |

Authentication failure is handled by the platform API layer before these domain errors. Every domain-error response leaves financial state unchanged.

## Frontend Design

### Minimum user experience

| Screen / component | Responsibility | Capability-aware actions |
| --- | --- | --- |
| ContractReceivablesPage | Entry by Contract ID. Shows readonly Contract/Client reference, active plan summary or no-plan state, derived balances, installments, and transaction timeline. | FINANCE_READ gates page data. |
| PaymentPlanDraftEditor | Create plan and alter DRAFT total. Clearly indicates that Contract/Client are references and readonly. | PAYMENT_PLAN_CREATE and PAYMENT_PLAN_EDIT_DRAFT. |
| InstallmentTable and DraftInstallmentEditor | List stable rows by number, due date, original amount, received, remaining, SettlementStatus and DueStatus. Manage draft installments. | CREATE, EDIT_DRAFT, REMOVE, REORDER as applicable. |
| ActivationReview | Shows all activation predicates and rejection details before sending explicit activate command. It never renumbers automatically. | PAYMENT_PLAN_ACTIVATE. |
| ReceiptDialog | Starts from an Installment when useful, but permits adding one or more Installments from the same active plan. Shows exact allocation total and current balances as guidance only. | RECEIVABLE_REGISTER_PAYMENT. |
| AllocationTimeline | Expands receipt and reversal relationships by transaction and allocation, including original allocation linkage. | FINANCE_READ. |
| ReversalDialog | Available only to an actor with reversal capability. Selects original receipt allocations, displays remaining reversible value, and requires reason. | RECEIVABLE_REVERSE_PAYMENT. |
| ElevatedPlanActions | Explicit return-to-DRAFT and discard controls, both with mandatory reason confirmation. | PAYMENT_PLAN_RETURN_TO_DRAFT and PAYMENT_PLAN_DISCARD. |
| FinancialAuditPanel | Displays audit events including actor, time, action, reason when applicable, and referenced IDs. | FINANCIAL_AUDIT_READ. |

The React client uses a typed API client over fetch. It serializes money as decimal strings and LocalDate as YYYY-MM-DD strings. Before each mutation submit it creates and retains a new idempotency key for that logical user action; retrying the same submission reuses that key. It must not generate a new key automatically after an ambiguous network failure.

The UI is never the integrity boundary. It can prevent obvious input mistakes and show expected balances, but the response projection from the API replaces local optimistic calculations after every mutation or replay.

## Requirements Traceability

Every spec requirement is covered by this design. The identifiers below preserve the 71-item specification traceability.

| Requirement | Design coverage |
| --- | --- |
| PLAN-01 | CreatePaymentPlan, ContractReferencePort, partial unique index, and DRAFT lifecycle. |
| PLAN-02 | Partial unique one-live-plan-per-Contract index and conflict mapping. |
| PLAN-03 | ChangeDraftPlanTotal preserves write-once Contract reference. |
| PLAN-04 | Activation PaymentPlanPolicy exact plan/Contract total comparison. |
| PLAN-05 | PaymentPlan FOR UPDATE command with full activation validation in one transaction. |
| PLAN-06 | Activation validates at least one Installment. |
| PLAN-07 | Activation sums exact centavos against total. |
| PLAN-08 | Receipt policy requires ACTIVE plan. |
| PLAN-09 | Elevated return-to-DRAFT command, required reason, audit in one transaction. |
| PLAN-10 | Locked financial-history existence check. |
| PLAN-11 | DRAFT-only soft discard, required evidence/audit. |
| PLAN-12 | History check rejects discard atomically. |
| INST-01 | Installment UUID independent of number, value, and due date. |
| INST-02 | MoneyBRL parse plus positive-centavos database check. |
| INST-03 | LocalDate parser and non-null DATE column. |
| INST-04 | CreateInstallment suggests next unique plan number. |
| INST-05 | DRAFT-only atomic edit/remove/reorder preserves surviving IDs. |
| INST-06 | No uniqueness constraint on dueDate. |
| INST-07 | ACTIVE requires explicit return to DRAFT before structural command. |
| INST-08 | History derived under lock permanently blocks structural fields. |
| INST-09 | No structural data path after history; only future explicitly-safe descriptive feature could add one. |
| INST-10 | Activation validates exact continuous 1 through N sequence. |
| INST-11 | Activate performs no numbering write. |
| RECEIPT-01 | RegisterReceipt appends immutable RECEIPT with DB system timestamp. |
| RECEIPT-02 | Positive MoneyBRL parser and all-or-nothing transaction. |
| RECEIPT-03 | Receipt policy requires nonempty positive allocations and exact sum. |
| RECEIPT-04 | Exact transaction-to-allocation equality rejects unallocated value. |
| RECEIPT-05 | Locked plan membership and inherited Contract/Client/BRL context checks. |
| RECEIPT-06 | Per-allocation open balance policy under locks. |
| RECEIPT-07 | Aggregated same-Installment proposed allocation policy. |
| RECEIPT-08 | Runtime InstallmentProjectionPolicy. |
| RECEIPT-09 | Projection returns PENDING at zero net amount. |
| RECEIPT-10 | Projection returns PARTIAL within original amount. |
| RECEIPT-11 | Projection returns SETTLED at exact original amount. |
| RECEIPT-12 | LocalDate America/Sao_Paulo comparison returns OVERDUE after date with balance. |
| RECEIPT-13 | Zero remaining balance has NOT_DUE precedence. |
| RECEIPT-14 | Due date and earlier evaluate as NOT_DUE. |
| RECEIPT-15 | Receipt AuditWriter append in Unit of Work. |
| RECEIPT-16 | DTO rejects occurrence timestamp. |
| REVERSE-01 | Elevated ReverseReceipt creates linked REVERSAL with required reason. |
| REVERSE-02 | Reversal allocations require original allocation and same Installment. |
| REVERSE-03 | PaymentPlan lock plus remaining reversible amount policy. |
| REVERSE-04 | Exact positive reversal amount equals allocations. |
| REVERSE-05 | Parent type and original-allocation checks forbid reversal recursion. |
| REVERSE-06 | Projection subtracts valid reversal allocations. |
| REVERSE-07 | Runtime due projection recalculates immediately after reversal. |
| REVERSE-08 | Reversal AuditEvent carries original references, amount, actor, time, reason. |
| REVERSE-09 | Append-only tables, RESTRICT relations, and immutability triggers. |
| REVERSE-10 | DTO rejects occurrence timestamp. |
| IDEMP-01 | Header required on every specified mutation route. |
| IDEMP-02 | Atomic IdempotencyRecord stores key, command, actor, normalized semantic parameters, fingerprint, and result. |
| IDEMP-03 | Authorized equivalent replay returns stored result without writes/audit. |
| IDEMP-04 | Global unique key plus command/actor/fingerprint mismatch conflict. |
| IDEMP-05 | Hono middleware and the use case capability guard precede replay processing. |
| IDEMP-06 | Rollback removes uncommitted record and all proposed facts. |
| IDEMP-07 | Transaction-scoped advisory key lock plus final unique-key insertion guarantees one effect. |
| IDEMP-08 | No expiry/purge design for completed records. |
| ACCESS-01 | FINANCE_READ query routes and projection. |
| ACCESS-02 | FINANCIAL_AUDIT_READ audit route. |
| ACCESS-03 | Mandatory Hono capability middleware and use-case capability guard for each command. |
| ACCESS-04 | PLATFORM_ADMIN receives no automatic FinanceCapability. |
| ACCESS-05 | One-to-one command capability mapping. |
| ACCESS-06 | Elevated action capabilities are separate and explicit. |
| ACCESS-07 | AuditWriter event set and same-transaction persistence. |
| ACCESS-08 | Scalar canonical refs only; no Client/Contract personal-data copies. |
| ACCESS-09 | History guards, ON DELETE RESTRICT, and append-only trigger protection. |
| ACCESS-10 | Shared policy initial Gerente Financeiro grants. |
| ACCESS-11 | Shared policy initial Vice-Presidente elevated grants. |
| EDGE-01 | ContractReferencePort unavailable/ineligible/BRL rejection before local write. |
| EDGE-02 | Interactive transaction rollback for every critical mutation. |
| EDGE-03 | Soft discard marker plus FinancialAuditPanel evidence, without restore command. |

**Coverage:** 71 of 71 requirements covered; 0 requirements mapped to tasks because the Task phase has not begun.

## Risks and Concerns

| Concern | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| No existing app, frontend, API, Prisma schema, or shared adapter exists in the repository. | Repository-wide source inspection | Interfaces could be accidentally coupled to an eventual scaffold. | Keep module boundaries and port contracts in this design; the first implementation task validates project layout before creating source. |
| Contract, Client, authorization, and AuditEvent physical APIs are not yet implemented. | Cross-domain integration | Direct Financeiro table ownership could violate AD-005/AD-010/AD-012. | Depend on explicit ContractReferencePort, AuthorizationPort, and AuditWriter interfaces; do not create duplicate owner tables. |
| A writer that bypasses the PaymentPlan lock could race receipt/reversal allocations. | Receipt/reversal write path | Concurrent allocations could exceed an Installment balance. | Every use case acquires PaymentPlan FOR UPDATE before any related read/write; a database relation trigger and code review protect the only write path. |
| Runtime derived balances can involve many allocation rows for a long-lived plan. | Read projection | Unbounded N plus one reads or stale materialization could degrade correctness/usability. | Use listed indexes and set-based aggregate repository queries; no numeric performance target is invented. |
| DB-level integrity triggers add migration-specific logic. | Prisma migration | Bypassing them would weaken historic immutability; overuse would make normal Draft edits hard. | Limit triggers to ledger/audit append-only rules, allocation relation integrity, immutable plan references, and post-history structural freeze; keep lifecycle decisions and arithmetic in the application transaction. |
| Client retries after an ambiguous network failure may otherwise produce duplicates. | Frontend mutation client | Duplicate receipt or reversal facts. | Retain one generated idempotency key per logical submit and reuse it only for retry of that submit. |

## Technical Decisions

| Decision | Options considered | Chosen option | Rationale and trade-off |
| --- | --- | --- | --- |
| Vertical structure | Handlers with Prisma; modular vertical; full event store | Modular Hono/application/domain/Prisma vertical | Isolates financial rules without event-store overengineering. |
| BRL persistence | PostgreSQL Decimal; centavos BIGINT | Centavos BIGINT | Exact two-decimal BRL arithmetic, no binary float, simple equality. Future multi-currency precision may require a deliberate evolution. |
| Derived state | Persisted status columns; runtime projection | Runtime projection | Prevents stale status/balance after receipts/reversals and meets reproducibility rule. |
| Discard | Hard delete; tombstone; soft marker | Soft lifecycle marker plus audit | Fulfills evidence and later new-plan requirement without adding CANCELLED state. |
| Allocation consistency | Optimistic version; SERIALIZABLE plus several row locks; one plan lock | One PaymentPlan FOR UPDATE lock at READ COMMITTED, with bounded deadlock retry | Every v1 write is restricted to one plan, so one consistently ordered parent lock is sufficient and simpler. |
| Idempotency | Heuristic duplicate detection; cache; durable record | Transaction-scoped advisory lock plus durable unique IdempotencyRecord in the same transaction | Replays explicit technical requests safely across API instances and never guesses whether equal payments are duplicates. |
| Financial immutability | Application convention only; database triggers everywhere; focused triggers | Focused ledger/audit append-only triggers plus narrow plan-freeze/reference guards and domain policies | Defends critical financial facts without making Draft lifecycle commands trigger-heavy. |
| Audit integration | Feature-owned audit table; remote transversal service; transaction-bound transversal port | Transaction-bound AuditWriter backed by transversal AuditEvent table in the same PostgreSQL database | Preserves global ownership while making audit failure roll back the financial command. |

These are feature-local implementation decisions. They do not alter or supersede any active decision in .specs/STATE.md.

## Semantic Review Against the Specification

The design was independently reviewed against the closed spec with emphasis on money, lifecycle, concurrency, audit, idempotency, and authorization.

| Review focus | Result |
| --- | --- |
| PaymentPlan cardinality, DRAFT/ACTIVE, activation, return, discard, and freeze | Covered without adding CANCELLED, renegotiation, or plan revision behavior. |
| Stable Installment identity, numbering, due dates, and activation sequence | Covered; explicit reorder is separate from activation and no automatic normalization occurs at activation. |
| Receipt, partial allocation, cross-plan prevention, and derived balances | Covered by locked exact-centavo allocation policies; no unallocated value or overpayment path exists. |
| Reversal partiality, multiple reversals, original-allocation reference, and immutability | Covered with explicit parent/reference checks and append-only persistence. |
| Idempotency under ordinary retry and concurrent retry | Covered by authorization-before-replay, transaction-scoped advisory key lock, durable unique key, same-transaction result persistence, and bounded deadlock retry. |
| Authorization and PLATFORM_ADMIN | Covered entirely through capabilities; organizational job mapping remains data/policy, not conditional code. |
| Client/Contract ownership and personal-data minimization | Covered by ContractReferencePort and canonical scalar references only. |
| Overengineering | Full event store, new payment-plan states, materialized statuses, global financial credit, and new external integration are explicitly excluded. |

**Product blockers or open questions found:** none. The only unresolved matters are implementation dependencies on future shared adapters and physical project layout, which are technical integration work rather than unspecified product decisions.

## Research Notes

- Prisma supports interactive transactions and transaction-scoped raw queries; this design keeps them short and uses raw SQL only where Prisma has no equivalent. [Prisma transactions documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions), [Prisma raw-query documentation](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)
- PostgreSQL documents that FOR UPDATE prevents competing writers/lockers on a row until transaction end and that transaction-scoped advisory locks release automatically at transaction end. [PostgreSQL explicit locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html)
- Hono supports typed reusable middleware and request-scoped context variables, which supports the authentication and capability boundary described here. [Hono middleware guide](https://hono.dev/docs/guides/middleware)

## Design Approval Gate

- [x] All 71 specification requirements have explicit design coverage.
- [x] Stack conforms to React, TypeScript, Vite, Node.js, TypeScript, Hono, PostgreSQL, and Prisma.
- [x] No implementation, task list, or product behavior change was created.
- [x] No open product question blocks the design.
- [ ] User approval of this design is required before entering the Task phase.
