# Finance Contract Receivables Tasks

## Execution Protocol

Implement these tasks with the `tlc-spec-driven` skill, using its Execute flow and critical rules. Before executing, ask the user which available MCPs and skills to use for each implementation batch. Do not begin an implementation task until this plan is approved.

**Spec:** `.specs/features/finance-contract-receivables/spec.md`  
**Design:** `.specs/features/finance-contract-receivables/design.md`  
**Status:** Draft — awaiting Tasks approval; no implementation artifacts have been created.

## Test Coverage Matrix

> Generated from the repository, the user's approved stack and the closed spec. Guidelines found: no project quality or testing guide, source code, manifest, CI workflow, or existing test was found; strong defaults apply. The commands below are the explicit target contract to be created by T01, not commands available before implementation.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain values and policies | unit | All branches; exact money/date/status rules; every listed domain edge case maps 1:1 to the spec. | `apps/api/src/modules/finance-contract-receivables/**/__tests__/*.unit.test.ts` | `npm run test:unit` |
| Application use cases | integration | Happy path, authorization, rollback, state-transition and idempotency branches against test adapters or PostgreSQL where transaction behavior matters. | `apps/api/src/modules/finance-contract-receivables/**/__tests__/*.integration.test.ts` | `npm run test:integration` |
| Prisma / PostgreSQL | integration | Migrations, constraints, triggers, locks, concurrent writers and set-based reads against real PostgreSQL; no mocked replacement for database concurrency. | `apps/api/src/modules/finance-contract-receivables/**/__tests__/*.postgres.test.ts` | `npm run test:integration` |
| Hono HTTP adapters | API | Every in-scope route: happy path, closed DTO rejection, capability rejection, idempotency header and domain-error mapping. | `apps/api/src/modules/finance-contract-receivables/http/__tests__/*.api.test.ts` | `npm run test:api` |
| React / Vite feature UI | frontend | Capability-driven main flows, validation feedback, no-plan state, replay-safe submit behavior and authorized controls. | `apps/web/src/features/finance-contract-receivables/**/__tests__/*.test.tsx` | `npm run test:web` |
| Foundation and configuration | integration | Startup, typecheck, lint and test commands execute against the planned workspace. | `apps/**/__tests__/*` | `npm run check` |

## Gate Check Commands

> The root workspace scripts are defined by T01. They are recorded here so each later task has an unambiguous verification target.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Domain-only task | `npm run test:unit` |
| Full | Application, PostgreSQL, API or frontend task | `npm run test:unit && npm run test:integration && npm run test:api && npm run test:web` |
| Build | Foundation, schema/configuration, or milestone completion | `npm run check` |

`npm run check` is planned to run lint, TypeScript typecheck, all four test suites, and any required Prisma schema validation. It must not silently skip an unavailable suite.

## Execution Plan

Phases are sequential. Tasks with no edge between them can be implemented independently after their listed prerequisites, but execution preserves the phase order.

### Phase 0: Foundation

```
T01 → T02
T01 → T03
T01 → T04
```

### Phase 1: Domain primitives and persistence guarantees

```
T05 → T07 → T08
T06 → T07
T04 → T09 → T10 → T11
T10 → T12
T11 → T13
T12 → T13
```

### Phase 2: Ports, authorization, audit and idempotency

```
T16 → T17
T16 → T19
T18 → T19
```

### Phase 3: PaymentPlan and Installment commands

```
T20 → T21
T20 → T22
T22 → T26
T20 → T26
T20 → T27
T20 → T28
T22 → T23
T22 → T24
T22 → T25
```

### Phase 4: Receipts and reversals

```
T29 → T30
T29 → T31
T31 → T32
```

### Phase 5: Query and Hono API adapters

```
T33 → T38
T35 → T36
T35 → T37
T35 → T38
```

### Phase 6: React / Vite increments

```
T39 → T40
T39 → T41
T39 → T42
T39 → T43
T39 → T44
T39 → T45
T39 → T46
```

### Phase 7: Security and acceptance hardening

```
T47 → T48
```

**Critical path:** T01 → T04 → T09 → T10 → T11 → T13 → T16 → T19 → T20 → T22 → T26 → T29 → T31 → T35 → T37 → T39 → T43 → T48.

## Task Breakdown

### Phase 0: Foundation

### T01: Define the minimal workspace and quality-command contract

**What**: Define the npm workspace layout, Node/TypeScript baseline, environment templates, and root scripts required by this vertical, including the exact gate commands above.
**Where**: `package.json`
**Depends on**: None
**Reuses**: Approved stack and Design §Architecture Overview.
**Design**: §Architecture Overview; §Proposed module boundaries.
**Requirements**: Supporting prerequisite for all 71 requirements; no standalone product acceptance criterion.
**Status**: Complete — 2026-08-18.
**Done when**:

- [x] The workspace contains planned API, web and Prisma package boundaries without an ERP-wide scaffold.
- [x] `lint`, `typecheck`, `test:unit`, `test:integration`, `test:api`, `test:web`, and `check` have explicit, non-skipping definitions.
- [x] Environment documentation distinguishes local PostgreSQL from the isolated integration-test database and contains no credentials.

**Tests**: integration — bootstrap command verification.
**Gate**: build — `npm run check` exits successfully after the task's own minimal harness is present.
**Commit**: `chore(workspace): define receivables quality commands`
**Verification**: `npm run build`, `npm run check`, the four test-suite commands, `validate_tasks.py --strict`, and `validate_spec.py --strict` passed on 2026-08-18.

### T02: Scaffold the TypeScript Hono API boundary

**What**: Create only the API application entrypoint, Hono test harness and module registration seam needed for this vertical.
**Where**: `apps/api/src/app.ts`
**Depends on**: T01
**Reuses**: Design §Architecture Overview and §Hono HTTP adapters.
**Design**: §Proposed module boundaries; §Hono HTTP adapters.
**Requirements**: Supporting prerequisite for ACCESS-01–ACCESS-11 and IDEMP-01.
**Status**: Complete — 2026-08-18.
**Done when**:

- [x] A Node.js/TypeScript Hono app can be instantiated in tests without Express, Fastify, or direct database writes in handlers.
- [x] Module wiring has an explicit registration point for the Financeiro vertical.
- [x] API harness tests prove startup and an isolated health/test route only.

**Tests**: API — app bootstrap and module registration seam.
**Gate**: full.
**Commit**: `chore(api): scaffold hono application boundary`
**Verification**: `npm run test:api`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check`, `git diff --check`, `validate_tasks.py --strict` and `validate_spec.py --strict` passed on 2026-08-18.

### T03: Scaffold the React, TypeScript and Vite boundary

**What**: Create the minimal React/Vite application shell and frontend test harness for the receivables feature.
**Where**: `apps/web/src/main.tsx`
**Depends on**: T01
**Reuses**: Design §Frontend Design.
**Design**: §Proposed module boundaries; §Frontend Design.
**Requirements**: Supporting prerequisite for ACCESS-01, ACCESS-02 and IDEMP-01–IDEMP-03.
**Status**: Complete — 2026-08-18.
**Done when**:

- [x] React, TypeScript and Vite are the only frontend framework/toolchain selected.
- [x] The feature can be mounted in a component test without connecting to a live backend.
- [x] Shared build and test scripts pass.

**Tests**: frontend — application-shell render test.
**Gate**: full.
**Commit**: `chore(web): scaffold vite react application boundary`
**Verification**: `npm run test:web`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check`, `git diff --check`, `validate_tasks.py --strict` and `validate_spec.py --strict` passed on 2026-08-18.

### T04: Configure Prisma and isolated PostgreSQL integration testing

**What**: Establish Prisma's datasource, migration/test-database lifecycle and transaction-capable integration-test harness.
**Where**: `prisma/schema.prisma`
**Depends on**: T01
**Reuses**: Design §Proposed Prisma / PostgreSQL Model.
**Design**: §Proposed module boundaries; §Atomicity and Concurrency.
**Requirements**: EDGE-02; supporting prerequisite for PLAN-02, RECEIPT-06–RECEIPT-07, REVERSE-03 and IDEMP-07.
**Done when**:

- [ ] Prisma connects only to PostgreSQL and integration tests target a disposable, explicitly configured test database.
- [ ] Test setup can apply migrations and clean test data without touching a developer/production database.
- [ ] A transaction rollback smoke test runs against real PostgreSQL.

**Tests**: integration — PostgreSQL connection, migration lifecycle and rollback smoke test.
**Gate**: build.
**Commit**: `chore(database): configure prisma postgres integration harness`

### Phase 1: Domain primitives and persistence guarantees

### T05: Implement and unit-test MoneyBRL centavos arithmetic

**What**: Deliver the exact BRL value object and its decimal-string parser/formatter, backed exclusively by `bigint` centavos.
**Where**: `apps/api/src/modules/finance-contract-receivables/domain/MoneyBRL.ts`
**Depends on**: T02
**Reuses**: Design §Exact BRL value object and §Monetary wire contract.
**Design**: §Exact BRL value object; §Monetary wire contract.
**Requirements**: INST-02, RECEIPT-02–RECEIPT-04, REVERSE-03–REVERSE-04, EDGE-01.
**Done when**:

- [ ] Decimal strings parse to centavos with no `Number`, `parseFloat`, or binary floating-point arithmetic.
- [ ] Values with more than two decimals, scientific notation, whitespace, negatives where not allowed, zero for positive-only values, and values beyond signed BIGINT are rejected.
- [ ] Addition, subtraction, comparison, exact equality and two-decimal API formatting use `bigint` only.

**Tests**: unit — parser grammar, R$0,01 minimum, BIGINT bounds and arithmetic branches.
**Gate**: quick.
**Commit**: `feat(finance): add exact brl money value object`

### T06: Implement and unit-test LocalDate and Sao Paulo Clock

**What**: Deliver a timezone-safe `YYYY-MM-DD` LocalDate value and injected `Clock.todayIn('America/Sao_Paulo')` for due-status calculation.
**Where**: `apps/api/src/modules/finance-contract-receivables/domain/LocalDate.ts`
**Depends on**: T02
**Reuses**: Design §Calendar and timestamp value objects.
**Design**: §Calendar and timestamp value objects; §Derived Financial Projection.
**Requirements**: INST-03, RECEIPT-12–RECEIPT-14, REVERSE-07.
**Done when**:

- [ ] LocalDate accepts calendar dates only and rejects timestamps/timezones as due dates.
- [ ] Tests use a deterministic Clock rather than the host clock.
- [ ] The due date itself is NOT_DUE; the next São Paulo calendar day with balance is OVERDUE.

**Tests**: unit — parsing and deterministic due-date boundary tests.
**Gate**: quick.
**Commit**: `feat(finance): add local date and sao paulo clock`

### T07: Implement core financial lifecycle policies

**What**: Implement the pure PaymentPlan/Installment lifecycle policy for DRAFT, ACTIVE, financial-history freeze and structural-edit eligibility.
**Where**: `apps/api/src/modules/finance-contract-receivables/domain/PaymentPlanPolicy.ts`
**Depends on**: T05, T06
**Reuses**: MoneyBRL and LocalDate from T05–T06.
**Design**: §Financial policies; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-03, PLAN-08, PLAN-10, INST-07–INST-09, EDGE-02.
**Done when**:

- [ ] Policies distinguish DRAFT/ACTIVE without introducing a third state.
- [ ] Financial history is an existence fact, not a balance-derived condition; reversal cannot thaw a plan.
- [ ] Structural and descriptive mutation rules match the closed scope, including no descriptive endpoint in v1.

**Tests**: unit — lifecycle, direct-ACTIVE edit and permanent-freeze branches.
**Gate**: quick.
**Commit**: `feat(finance): add payment plan lifecycle policies`

### T08: Implement runtime financial projection policies

**What**: Implement pure derivation of received amount, remaining balance, settlement status, due status and reversible amount from immutable allocations.
**Where**: `apps/api/src/modules/finance-contract-receivables/domain/InstallmentProjectionPolicy.ts`
**Depends on**: T07
**Reuses**: MoneyBRL, LocalDate and Clock.
**Design**: §Derived Financial Projection.
**Requirements**: RECEIPT-08, RECEIPT-09, RECEIPT-10, RECEIPT-11, RECEIPT-12, RECEIPT-13, RECEIPT-14, REVERSE-06–REVERSE-07.
**Done when**:

- [ ] No derived amount or status is modeled as a writable command value.
- [ ] PENDING, PARTIAL and SETTLED follow exact net allocation boundaries.
- [ ] A post-due reversal restoring balance immediately yields OVERDUE.

**Tests**: unit — receipt/reversal netting, all settlement states and due-status precedence.
**Gate**: quick.
**Commit**: `feat(finance): add derived installment projections`

### T09: Define Prisma models and relational indexes for the vertical

**What**: Add the conceptual Prisma models, enums, scalar canonical references, restrictive foreign keys and normal indexes approved by the design.
**Where**: `prisma/schema.prisma`
**Depends on**: T04
**Reuses**: Design §Proposed Prisma / PostgreSQL Model.
**Design**: §Proposed Prisma / PostgreSQL Model; §Entity fields, relationships, and indexes.
**Requirements**: PLAN-01–PLAN-02, INST-01, RECEIPT-01, REVERSE-01–REVERSE-02, IDEMP-02, ACCESS-08–ACCESS-09.
**Done when**:

- [ ] PaymentPlan, Installment, FinancialTransaction, TransactionAllocation, IdempotencyRecord and AuditEvent have the designed identities, relations and indexes.
- [ ] Contract, Client and User remain scalar canonical references; no duplicate owner tables or personal-data snapshots are added.
- [ ] Prisma validation and generated client pass before raw SQL guarantees are layered on.

**Tests**: integration — generated schema can create and query each relation using PostgreSQL.
**Gate**: build.
**Commit**: `feat(finance): add receivables prisma model`

### T10: Add cardinality and value CHECK migration guarantees

**What**: Add the partial unique live-plan-per-Contract index and CHECK constraints for BRL, positive cent values and receipt/reversal shape.
**Where**: `prisma/migrations/finance_plan_constraints/migration.sql`
**Depends on**: T09
**Reuses**: Prisma model from T09 and MoneyBRL bounds from T05.
**Design**: §Database-enforced invariants.
**Requirements**: PLAN-01–PLAN-02, INST-02, RECEIPT-01–RECEIPT-04, REVERSE-01–REVERSE-04, EDGE-03.
**Done when**:

- [ ] `payment_plan_one_live_contract` permits a new plan only after a discarded marker and rejects two live rows even under concurrent inserts.
- [ ] Database checks reject non-BRL and nonpositive persisted monetary values and invalid RECEIPT/REVERSAL origin nullability.
- [ ] Application can recognize the partial-index conflict as a typed domain conflict.

**Tests**: integration — migration constraints and two-key concurrent create-plan race.
**Gate**: full.
**Commit**: `feat(database): enforce payment plan cardinality and checks`

### T11: Add the deferred ledger-relationship constraint trigger

**What**: Implement the named PostgreSQL constraint trigger that verifies transaction/allocation/plan and reversal-origin relationships at commit.
**Where**: `prisma/migrations/finance_ledger_relationship_integrity/migration.sql`
**Depends on**: T10
**Reuses**: Schema relations from T09.
**Design**: §Database-enforced invariants; §Receipt and Reversal Model.
**Requirements**: RECEIPT-05, REVERSE-01–REVERSE-05, REVERSE-09, EDGE-02.
**Done when**:

- [ ] The deferred trigger rejects allocations whose transaction and installment belong to different plans.
- [ ] It enforces receipt-vs-reversal allocation shape and reversal links only to an allocation of the parent original RECEIPT.
- [ ] Valid multi-allocation receipt and reversal fixtures commit successfully.

**Tests**: integration — direct invalid SQL/Prisma writes fail at commit; valid ledger graphs commit.
**Gate**: full.
**Commit**: `feat(database): guard receivables ledger relationships`

### T12: Add plan-reference immutability and history-freeze triggers

**What**: Add focused PostgreSQL guards preventing reparenting and structural mutation after any financial history.
**Where**: `prisma/migrations/finance_plan_history_freeze/migration.sql`
**Depends on**: T10
**Reuses**: Lifecycle policy from T07 and schema from T09.
**Design**: §Database-enforced invariants; §History presence and permanent freeze.
**Requirements**: PLAN-10–PLAN-12, INST-07–INST-09, ACCESS-09, EDGE-03.
**Done when**:

- [ ] Contract, Client and currency references are write-once after creation.
- [ ] Any FinancialTransaction history blocks structural plan/installment changes and deletion, even after full reversal.
- [ ] A DRAFT plan without history remains editable and discardable by the application policy.

**Tests**: integration — direct post-history update/delete attempts fail while pre-history draft changes succeed.
**Gate**: full.
**Commit**: `feat(database): freeze plans with financial history`

### T13: Add append-only ledger and audit persistence guards

**What**: Add immutable-history triggers for FinancialTransaction, TransactionAllocation and the local transversal AuditEvent table.
**Where**: `prisma/migrations/finance_append_only_history/migration.sql`
**Depends on**: T11, T12
**Reuses**: Schema from T09 and transactional audit design.
**Design**: §Database-enforced invariants; §Audit writer.
**Requirements**: REVERSE-09, IDEMP-08, ACCESS-07, ACCESS-09.
**Done when**:

- [ ] UPDATE and DELETE of persisted ledger facts and AuditEvent fail at database level.
- [ ] Valid inserts remain possible only inside the application transaction path.
- [ ] No retention, purge or restoration mechanism is added.

**Tests**: integration — append succeeds; each prohibited UPDATE/DELETE fails in PostgreSQL.
**Gate**: full.
**Commit**: `feat(database): make finance ledger and audit append only`

### Phase 2: Ports, authorization, audit and idempotency

### T14: Provide receivables external-reference and test fixtures

**What**: Define ContractReferencePort and test-only adapters/fixtures for canonical Contract, Client, Gerente Financeiro and Vice-Presidente contexts.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ContractReferencePort.ts`
**Depends on**: T02, T05
**Reuses**: Design §References owned outside this vertical.
**Design**: §Domain Model and Ownership; §ContractReferencePort.
**Requirements**: EDGE-01, ACCESS-08, ACCESS-10–ACCESS-11.
**Done when**:

- [ ] The port exposes only canonical Contract ID, Client ID, BRL value/currency and eligibility; it cannot mutate Contract or Client.
- [ ] Fixtures cover unavailable, ineligible, non-BRL and valid Contract contexts without CRM implementation.
- [ ] No fixture copies CPF/CNPJ, name, address or other personal data into Financeiro records.

**Tests**: integration — port-contract tests and reusable canonical-ID fixtures.
**Gate**: full.
**Commit**: `test(finance): add contract reference fixtures and port`

### T15: Implement capability-based authorization context and initial grants

**What**: Deliver FinanceCapability, AuthenticatedCommandContext, AuthorizationPort and the approved initial job-to-capability mapping.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/FinanceCapability.ts`
**Depends on**: T02
**Reuses**: Design §Authorization port.
**Design**: §Authorization port.
**Requirements**: ACCESS-03–ACCESS-06, ACCESS-10–ACCESS-11, IDEMP-05.
**Done when**:

- [ ] Finance use cases receive an authenticated actor context rather than request-supplied actor/role/capability fields.
- [ ] Gerente Financeiro and Vice-Presidente grants match the closed matrix exactly.
- [ ] PLATFORM_ADMIN alone has no FinanceCapability, and no role string is evaluated in Financeiro authorization logic.

**Tests**: integration — every granted/denied capability, including PLATFORM_ADMIN-only and elevated-action cases.
**Gate**: full.
**Commit**: `feat(finance): add capability authorization context`

### T16: Implement the transaction unit of work and PaymentPlan lock

**What**: Implement the Prisma interactive Unit of Work, READ COMMITTED plan row lock, bounded database-concurrency retry and parameterized raw-SQL seam.
**Where**: `apps/api/src/modules/finance-contract-receivables/infrastructure/PrismaFinanceUnitOfWork.ts`
**Depends on**: T09, T13
**Reuses**: Design §Common Unit of Work protocol and §Locking strategy and retry.
**Design**: §Atomicity and Concurrency.
**Requirements**: PLAN-05, RECEIPT-06–RECEIPT-07, REVERSE-03, EDGE-02.
**Done when**:

- [ ] Every existing-plan mutation locks exactly its PaymentPlan with parameterized `SELECT ... FOR UPDATE` before reading mutable state.
- [ ] Raw SQL is limited to the approved lock/query use; no user-controlled SQL identifier interpolation is possible.
- [ ] SQLSTATE 40P01/40001 is retried at most twice, while domain/authorization/idempotency conflicts are not retried.

**Tests**: integration — lock acquisition, rollback and bounded-retry mapping against PostgreSQL.
**Gate**: full.
**Commit**: `feat(finance): add locked prisma unit of work`

### T17: Implement transactional audit writing and rollback proof

**What**: Implement the transaction-bound AuditWriter backed by the local transversal AuditEvent table.
**Where**: `apps/api/src/modules/finance-contract-receivables/infrastructure/PrismaTransactionalAuditWriter.ts`
**Depends on**: T16
**Reuses**: AuditEvent schema and append-only trigger from T09/T13.
**Design**: §Audit writer; §Critical operation transactions.
**Requirements**: PLAN-09, PLAN-11, RECEIPT-15, REVERSE-08, ACCESS-07, EDGE-02.
**Done when**:

- [ ] AuditEvent writes use the supplied Prisma transaction client, never an HTTP call, queue or post-commit action.
- [ ] Each approved action has minimal non-PII context, actor, timestamp, references and required reason.
- [ ] An injected AuditWriter failure rolls back the domain change and any IdempotencyRecord.

**Tests**: integration — all audit action shapes and a forced audit-write failure proving zero committed financial effects.
**Gate**: full.
**Commit**: `feat(finance): add transactional audit writer`

### T18: Implement canonical idempotency parameters and fingerprinting

**What**: Implement deterministic canonicalization and fingerprint creation for every approved mutable command.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/IdempotencyPolicy.ts`
**Depends on**: T05, T06
**Reuses**: MoneyBRL and LocalDate canonical representations.
**Design**: §Idempotency Design; §Canonical fingerprint and result.
**Requirements**: IDEMP-01–IDEMP-04, IDEMP-06.
**Done when**:

- [ ] Canonical parameters include command, actor-independent request semantics, target IDs, normalized money/date values and deterministic allocation ordering.
- [ ] The fingerprint never serializes bigint as JSON or relies on object insertion order.
- [ ] Different material parameters always produce a different conflict comparison input.

**Tests**: unit — equivalent ordering/format normalization and command/actor/payload conflict cases.
**Gate**: quick.
**Commit**: `feat(finance): add idempotency fingerprint policy`

### T19: Implement durable idempotency storage and advisory-key locking

**What**: Implement IdempotencyRecord persistence, preflight/recheck/replay flow and transaction-scoped PostgreSQL advisory locking.
**Where**: `apps/api/src/modules/finance-contract-receivables/infrastructure/PrismaIdempotencyStore.ts`
**Depends on**: T16, T18
**Reuses**: IdempotencyRecord schema and Unit of Work.
**Design**: §Idempotency Design; §Common Unit of Work protocol.
**Requirements**: IDEMP-01–IDEMP-08, EDGE-02.
**Done when**:

- [ ] A completed key stores command, actor, canonical parameters/fingerprint and sanitized original result atomically with the command.
- [ ] Same actor/command/fingerprint replays the persisted result without another fact or audit; changed actor/command/payload conflicts.
- [ ] Two real PostgreSQL connections using one key produce at most one effect; failure before commit leaves no completed record.

**Tests**: integration — same-key concurrent instances, failure-before-commit, replay after simulated lost response, conflict and retention-without-purge cases.
**Gate**: full.
**Commit**: `feat(finance): add durable idempotency control`

### Phase 3: PaymentPlan and Installment commands

### T20: Implement CreatePaymentPlan with cardinality conflict translation

**What**: Implement the create-DRAFT-plan use case with fresh Contract reference validation and predictable unique-index conflict mapping.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/CreatePaymentPlan.ts`
**Depends on**: T14, T15, T16, T17, T19
**Reuses**: ContractReferencePort, Unit of Work, AuditWriter and IdempotencyStore.
**Design**: §Financial command use cases; §Critical operation transactions.
**Requirements**: PLAN-01–PLAN-02, ACCESS-03, ACCESS-05, ACCESS-07–ACCESS-08, IDEMP-01–IDEMP-07, EDGE-01–EDGE-02.
**Done when**:

- [ ] The command creates only a BRL DRAFT plan with canonical Contract/Client references and the Contract financial value as operational total.
- [ ] Two distinct idempotency keys racing to create a live plan for one Contract yield one success and `PAYMENT_PLAN_ALREADY_EXISTS`, never an internal Prisma error.
- [ ] Effect, creation audit and idempotency result share one transaction.

**Tests**: integration — valid/unavailable/ineligible contract, authorization, replay and real partial-index create race.
**Gate**: full.
**Commit**: `feat(finance): create draft payment plans`

### T21: Implement ChangeDraftPlanTotal

**What**: Implement the DRAFT-only operational-total command without any path to change Contract, Client or currency references.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ChangeDraftPlanTotal.ts`
**Depends on**: T20
**Reuses**: PaymentPlan lifecycle policy and idempotent Unit of Work.
**Design**: §Financial command use cases; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-03, INST-07–INST-09, ACCESS-03, ACCESS-05, ACCESS-07, IDEMP-01–IDEMP-07.
**Done when**:

- [ ] Only an editable, non-discarded DRAFT plan can change totalCents.
- [ ] The use case locks the plan, records one audit event and returns replay safely.
- [ ] It rejects post-history, ACTIVE and reference-replacement attempts without writes.

**Tests**: integration — allowed DRAFT update, forbidden state/history/reference cases and replay.
**Gate**: full.
**Commit**: `feat(finance): change draft plan total`

### T22: Implement CreateInstallment with stable identity and suggested number

**What**: Implement creation of a positive, dated DRAFT installment with a stable identity and next-number suggestion.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/CreateInstallment.ts`
**Depends on**: T20
**Reuses**: MoneyBRL, LocalDate, lifecycle policy and locked Unit of Work.
**Design**: §Financial command use cases; §PaymentPlan and Installment Lifecycle.
**Requirements**: INST-01–INST-04, INST-06–INST-09, ACCESS-03, ACCESS-05, ACCESS-07, IDEMP-01–IDEMP-07.
**Done when**:

- [ ] Stable entity identity is generated independently of number, date and amount.
- [ ] The next positive unique number is suggested; duplicate requested numbers conflict atomically.
- [ ] Same due dates are accepted while monetary/date validation remains exact.

**Tests**: integration — suggested/explicit number, same-date installments, invalid money/date/state/history and replay.
**Gate**: full.
**Commit**: `feat(finance): create draft installments`

### T23: Implement EditDraftInstallment

**What**: Implement DRAFT-only amount/date editing while preserving the installment's stable identity and number.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/EditDraftInstallment.ts`
**Depends on**: T22
**Reuses**: Lifecycle policy, MoneyBRL, LocalDate and AuditWriter.
**Design**: §Financial command use cases; §PaymentPlan and Installment Lifecycle.
**Requirements**: INST-02–INST-03, INST-05, INST-07–INST-09, ACCESS-03, ACCESS-05, ACCESS-07, IDEMP-01–IDEMP-07.
**Done when**:

- [ ] A valid DRAFT edit changes only original amount and/or due date.
- [ ] It never changes identity/number or permits active/history structural mutation.
- [ ] It atomically persists audit and idempotency evidence.

**Tests**: integration — identity preservation, money/date failures, DRAFT-only behavior, freeze and replay.
**Gate**: full.
**Commit**: `feat(finance): edit draft installments`

### T24: Implement RemoveDraftInstallment

**What**: Implement atomic removal of one DRAFT installment before financial history exists.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/RemoveDraftInstallment.ts`
**Depends on**: T22
**Reuses**: Lifecycle policy, Unit of Work and AuditWriter.
**Design**: §Financial command use cases; §PaymentPlan and Installment Lifecycle.
**Requirements**: INST-05, INST-07–INST-09, ACCESS-03, ACCESS-05, ACCESS-07, ACCESS-09, IDEMP-01–IDEMP-07.
**Done when**:

- [ ] Only a DRAFT plan without history permits removal.
- [ ] Removal does not renumber surviving installments implicitly.
- [ ] Database restrictions and use-case policy reject historical ledger deletion.

**Tests**: integration — DRAFT removal, ACTIVE/history rejection, audit/idempotency replay and database guard coverage.
**Gate**: full.
**Commit**: `feat(finance): remove draft installments`

### T25: Implement explicit draft installment reorder and renumber

**What**: Implement one explicit reorder command that assigns numbers 1..N to exactly the existing DRAFT installment set.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ReorderInstallments.ts`
**Depends on**: T22
**Reuses**: Stable installment IDs, lifecycle policy and locked Unit of Work.
**Design**: §Financial command use cases; §PaymentPlan and Installment Lifecycle.
**Requirements**: INST-04–INST-05, INST-07–INST-11, ACCESS-03, ACCESS-05, ACCESS-07, IDEMP-01–IDEMP-07.
**Done when**:

- [ ] The requested list contains every current installment exactly once; only its order determines resulting 1..N numbers.
- [ ] Stable IDs survive renumbering and no activation command performs this action implicitly.
- [ ] ACTIVE/history plans reject reordering atomically.

**Tests**: integration — valid reorder, duplicate/missing/foreign ID rejection, identity preservation, frozen state and replay.
**Gate**: full.
**Commit**: `feat(finance): reorder draft installments`

### T26: Implement ActivatePaymentPlan full validation

**What**: Implement the explicit DRAFT-to-ACTIVE command with locked full-plan validation and no renumber side effect.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ActivatePaymentPlan.ts`
**Depends on**: T20, T22
**Reuses**: PaymentPlanPolicy, ContractReferencePort, Unit of Work and AuditWriter.
**Design**: §PaymentPlan and Installment Lifecycle; §Critical operation transactions.
**Requirements**: PLAN-04, PLAN-05, PLAN-06, PLAN-07, INST-02–INST-03, INST-10–INST-11, ACCESS-03, ACCESS-05, ACCESS-07, IDEMP-01–IDEMP-07, EDGE-01–EDGE-02.
**Done when**:

- [ ] Activation requires valid BRL Contract context, positive defined total, at least one positive dated installment, exact plan/Contract equality and exact 1..N numbering.
- [ ] Invalid activation leaves the plan DRAFT and leaves every number unchanged.
- [ ] The ACTIVE transition, audit and idempotency record commit atomically.

**Tests**: integration — each activation predicate, irregular sequence rejection, no renumbering, Contract mismatch and replay.
**Gate**: full.
**Commit**: `feat(finance): activate payment plans`

### T27: Implement elevated ReturnPlanToDraft

**What**: Implement the reason-required ACTIVE-to-DRAFT command that is allowed only before any financial history.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ReturnPlanToDraft.ts`
**Depends on**: T20
**Reuses**: Lifecycle policy, elevated AuthorizationPort grant and AuditWriter.
**Design**: §PaymentPlan and Installment Lifecycle; §Authorization port.
**Requirements**: PLAN-09–PLAN-10, INST-07–INST-09, ACCESS-03, ACCESS-06–ACCESS-07, ACCESS-11, IDEMP-01–IDEMP-07, EDGE-02.
**Done when**:

- [ ] Only the elevated capability and a nonempty reason can transition a history-free ACTIVE plan to DRAFT.
- [ ] History is tested as persisted event existence, not net balance.
- [ ] Gerente Financeiro is denied and Vice-Presidente receives audited, idempotent success.

**Tests**: integration — actor separation, reason, status/history failures, full-reversal freeze and replay.
**Gate**: full.
**Commit**: `feat(finance): return payment plans to draft`

### T28: Implement elevated PaymentPlan discard

**What**: Implement DRAFT-only soft discard with retained audit evidence and no restore/cancel state.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/DiscardPaymentPlan.ts`
**Depends on**: T20
**Reuses**: Partial unique index, lifecycle policy, AuditWriter and elevated authorization.
**Design**: §Discard persistence strategy; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-11–PLAN-12, INST-08, ACCESS-03, ACCESS-06–ACCESS-07, ACCESS-09, ACCESS-11, IDEMP-01–IDEMP-07, EDGE-02–EDGE-03.
**Done when**:

- [ ] Only an elevated actor with reason can mark a history-free DRAFT plan discarded.
- [ ] A discarded plan disappears from active-plan reads while its audit evidence remains readable to an authorized auditor.
- [ ] The Contract can receive a new plan; any history prevents discard and replacement.

**Tests**: integration — required flow, audit evidence, post-discard new plan, historical rejection and replay.
**Gate**: full.
**Commit**: `feat(finance): discard unused payment plans`

### Phase 4: Receipts and reversals

### T29: Implement RegisterReceipt and allocation policy

**What**: Implement one ACTIVE-plan receipt command with exact positive amount, one-or-more allocations, immutable system timestamp and atomic audit/idempotency persistence.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/RegisterReceipt.ts`
**Depends on**: T20, T22, T26, T19
**Reuses**: ReceiptAllocationPolicy, locked Unit of Work, derived projection and AuditWriter.
**Design**: §Receipt and Reversal Model; §Critical operation transactions.
**Requirements**: PLAN-08, RECEIPT-01, RECEIPT-02, RECEIPT-03, RECEIPT-04, RECEIPT-05, RECEIPT-06, RECEIPT-07, RECEIPT-15–RECEIPT-16, ACCESS-03, ACCESS-05, ACCESS-07–ACCESS-09, IDEMP-01–IDEMP-08, EDGE-02.
**Done when**:

- [ ] A receipt has DB-generated immutable occurrence time and uses only one active plan's inherited Contract/Client/BRL context.
- [ ] Multiple allocations may target several installments; proposed and existing allocations cannot exceed open balances, and their exact total equals receipt amount.
- [ ] Draft plan, unallocated amount, negative/zero/excess precision, foreign-plan allocation and client timestamp all reject the entire transaction.

**Tests**: integration — partial payment, one receipt across installments, exact sum, no unallocated/overpayment, atomic failures, audit and replay.
**Gate**: full.
**Commit**: `feat(finance): register allocated receipts`

### T30: Prove concurrent receipt allocation safety in PostgreSQL

**What**: Add the real two-connection integration test proving the PaymentPlan row lock prevents over-allocation.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/__tests__/RegisterReceipt.postgres.test.ts`
**Depends on**: T29
**Reuses**: Prisma integration harness and RegisterReceipt command.
**Design**: §Allocation race condition; §Locking strategy and retry.
**Requirements**: RECEIPT-06–RECEIPT-07, IDEMP-07, EDGE-02.
**Done when**:

- [ ] Two concurrent R$700 receipt attempts against R$1.000 use separate PostgreSQL connections and exercise `PaymentPlan FOR UPDATE`.
- [ ] Exactly one command commits; the other observes R$300 and fails with typed allocation-domain error.
- [ ] Final net allocations never exceed R$1.000 and no partial audit/idempotency state remains for the failed command.

**Tests**: integration — mandatory real PostgreSQL concurrent receipt test; no repository mock.
**Gate**: full.
**Commit**: `test(finance): cover concurrent receipt allocation`

### T31: Implement ReverseReceipt and reversal allocation policy

**What**: Implement the elevated, reason-required immutable REVERSAL command linked to one original RECEIPT and its original allocations.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/ReverseReceipt.ts`
**Depends on**: T29
**Reuses**: ReversalPolicy, locked Unit of Work, AuditWriter and runtime projection.
**Design**: §Receipt and Reversal Model; §Critical operation transactions.
**Requirements**: REVERSE-01–REVERSE-10, RECEIPT-08–RECEIPT-15, ACCESS-03, ACCESS-06–ACCESS-07, ACCESS-09, ACCESS-11, IDEMP-01–IDEMP-08, EDGE-02.
**Done when**:

- [ ] Positive reversal amount exactly equals positive reversal allocations and each targets exactly one original RECEIPT allocation on the inherited installment.
- [ ] Partial/multiple/total reversals respect remaining reversible value and never edit/delete the original ledger facts.
- [ ] Reversal of reversal, receipt/allocation mismatch, client occurrence time, missing reason or unavailable capability reject atomically.

**Tests**: integration — partial/multiple/total reversal, reason/capability, immutable history, post-due restored balance, audit and replay.
**Gate**: full.
**Commit**: `feat(finance): reverse allocated receipts`

### T32: Prove concurrent reversal safety in PostgreSQL

**What**: Add the real two-connection integration test proving the plan lock prevents reversal beyond an original allocation's remaining reversible amount.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/__tests__/ReverseReceipt.postgres.test.ts`
**Depends on**: T31
**Reuses**: Prisma integration harness and ReverseReceipt command.
**Design**: §Reversal race condition; §Locking strategy and retry.
**Requirements**: REVERSE-03–REVERSE-04, IDEMP-07, EDGE-02.
**Done when**:

- [ ] Two R$700 reversals of one R$1.000 original allocation execute concurrently through PostgreSQL.
- [ ] Exactly one reversal persists; the second receives `REVERSAL_EXCEEDS_AVAILABLE` after re-reading state under the plan lock.
- [ ] Persisted reversible total never exceeds R$1.000 and the failed attempt commits no audit/idempotency record.

**Tests**: integration — mandatory real PostgreSQL concurrent reversal test; no repository mock.
**Gate**: full.
**Commit**: `test(finance): cover concurrent receipt reversal`

### Phase 5: Query and Hono API adapters

### T33: Implement set-based receivables and audit read projections

**What**: Implement contract-level receivables and audit query use cases using bounded set-based Prisma/PostgreSQL reads and runtime derived projections.
**Where**: `apps/api/src/modules/finance-contract-receivables/application/GetContractReceivables.ts`
**Depends on**: T29, T31
**Reuses**: InstallmentProjectionPolicy, ContractReferencePort and AuditEvent table.
**Design**: §Derived Financial Projection; §Financial command use cases.
**Requirements**: RECEIPT-08–RECEIPT-14, REVERSE-06–REVERSE-07, ACCESS-01–ACCESS-02, ACCESS-08–ACCESS-09, EDGE-03.
**Done when**:

- [ ] Read models contain derived monetary strings/statuses and transaction/allocation/reversible timelines without writable projections.
- [ ] Active-plan and audit queries use canonical Contract references, filter discarded plans correctly and avoid N+1 reads.
- [ ] FINANCE_READ and FINANCIAL_AUDIT_READ are separately enforced in use cases.

**Tests**: integration — projection accuracy after receipts/reversals, discarded audit evidence, capability separation and query-count/bounded-query assertions.
**Gate**: full.
**Commit**: `feat(finance): add receivables read projections`

### T34: Implement typed finance domain-error mapping

**What**: Create the complete typed error catalogue and HTTP-status mapping required by the design, without exposing Prisma/PostgreSQL exceptions.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/financeErrorMapper.ts`
**Depends on**: T02
**Reuses**: Design §Standard error envelope.
**Design**: §Standard error envelope.
**Requirements**: PLAN-02, PLAN-10, PLAN-12, INST-07–INST-10, RECEIPT-04–RECEIPT-07, REVERSE-03–REVERSE-05, IDEMP-04–IDEMP-06, ACCESS-03–ACCESS-06, EDGE-01–EDGE-02.
**Done when**:

- [ ] All named design errors map to stable envelope, HTTP status and optional retriable flag.
- [ ] `PAYMENT_PLAN_ALREADY_EXISTS` translates the partial-index violation rather than leaking ORM/database detail.
- [ ] Unknown infrastructure failures are logged safely and produce no sensitive raw error response.

**Tests**: API — every error family and no raw database message in responses.
**Gate**: full.
**Commit**: `feat(api): map receivables domain errors`

### T35: Implement Hono finance command middleware and closed DTO parsing

**What**: Implement authentication-context propagation, early capability guard, mandatory Idempotency-Key parser and closed command DTO parsers.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/financeCommandMiddleware.ts`
**Depends on**: T15, T19
**Reuses**: AuthenticatedCommandContext, FinanceCapability and IdempotencyPolicy.
**Design**: §Hono HTTP adapters; §Monetary wire contract.
**Requirements**: IDEMP-01, IDEMP-05, RECEIPT-02, RECEIPT-16, REVERSE-10, ACCESS-03–ACCESS-06, ACCESS-08.
**Done when**:

- [ ] Actor comes only from authenticated middleware, while every mutation requires a valid Idempotency-Key before handler invocation.
- [ ] DTO schemas accept monetary strings/LocalDates only and reject unknown fields including actor, role, capability, status, derived values, currency and financial timestamps.
- [ ] Middleware remains early rejection; every use case still calls AuthorizationPort itself.

**Tests**: API — missing/invalid key, unauthenticated/forbidden actor, forbidden fields, Number money and timestamp rejection.
**Gate**: full.
**Commit**: `feat(api): add receivables command middleware`

### T36: Expose PaymentPlan and Installment Hono command routes

**What**: Register thin Hono adapters for plan creation, draft total, installment create/edit/remove/reorder, activate, return-to-DRAFT and discard commands.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/paymentPlanRoutes.ts`
**Depends on**: T35, T20, T21, T22, T23, T24, T25, T26, T27, T28
**Reuses**: Hono command middleware and finance error mapper.
**Design**: §API Design; §Hono HTTP adapters.
**Requirements**: PLAN-01–PLAN-12, INST-01–INST-11, IDEMP-01–IDEMP-07, ACCESS-03–ACCESS-07, ACCESS-10–ACCESS-11, EDGE-01–EDGE-03.
**Done when**:

- [ ] Only the explicit design routes exist; no generic status PATCH, delete for a historical plan, or Contract/Client mutation endpoint is introduced.
- [ ] Each route provides command-specific capability, closed DTO, idempotency and typed error behavior.
- [ ] Handlers invoke one use case and contain no money arithmetic, state policy or direct Prisma operation.

**Tests**: API — every plan/installment route's happy, capability, idempotency and rejection cases.
**Gate**: full.
**Commit**: `feat(api): expose payment plan command routes`

### T37: Expose receipt and reversal Hono command routes

**What**: Register thin Hono adapters for allocated receipt and original-receipt reversal commands.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/receivableTransactionRoutes.ts`
**Depends on**: T35, T29, T31
**Reuses**: Hono command middleware, finance error mapper and transaction use cases.
**Design**: §API Design; §Receipt and Reversal Model.
**Requirements**: RECEIPT-01–RECEIPT-16, REVERSE-01–REVERSE-10, IDEMP-01–IDEMP-07, ACCESS-03–ACCESS-07, ACCESS-09, ACCESS-11, EDGE-02.
**Done when**:

- [ ] Receipt route accepts one PLAN-scoped amount/allocation command and reversal route accepts only original allocation references/reason.
- [ ] DTOs cannot accept transaction type, occurrence time, computed balances/statuses, actor or arbitrary currency.
- [ ] Idempotent replay returns original response and typed domain rejections leave no financial event.

**Tests**: API — total/partial/multi-allocation receipt, reversal, forbidden fields/capability, idempotency replay/conflict and errors.
**Gate**: full.
**Commit**: `feat(api): expose receivable transaction routes`

### T38: Expose finance and audit Hono query routes

**What**: Register read-only Hono routes for Contract receivables and the separate financial audit timeline.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/receivablesQueryRoutes.ts`
**Depends on**: T33, T35
**Reuses**: Query use cases and finance error mapper.
**Design**: §API Design; §Frontend Design.
**Requirements**: ACCESS-01–ACCESS-02, ACCESS-04, ACCESS-08–ACCESS-09, RECEIPT-08–RECEIPT-14, REVERSE-06–REVERSE-07, EDGE-03.
**Done when**:

- [ ] Contract financial situation and audit are distinct authorized routes with sanitized, non-PII response models.
- [ ] PLATFORM_ADMIN-only callers receive no finance/audit data.
- [ ] The query response formats every money value as a decimal string and never raw bigint.

**Tests**: API — read/audit capability boundaries, no-plan/discard/history views and bigint-safe JSON response.
**Gate**: full.
**Commit**: `feat(api): expose receivables query routes`

### Phase 6: React / Vite increments

### T39: Implement typed frontend API and replay-safe mutation client

**What**: Implement the typed fetch client, decimal-string wire types and logical-submit idempotency-key lifecycle.
**Where**: `apps/web/src/features/finance-contract-receivables/api/client.ts`
**Depends on**: T03, T37, T38
**Reuses**: Design §Monetary wire contract and §Frontend Design.
**Design**: §Frontend Design; §Idempotency Design.
**Requirements**: IDEMP-01–IDEMP-04, IDEMP-07–IDEMP-08, ACCESS-01–ACCESS-02.
**Done when**:

- [ ] Money stays a decimal string at the UI boundary; no client financial calculation uses Number.
- [ ] Each logical submit creates one key, disables double-submit and retains the key for explicit retry after ambiguous failure.
- [ ] A new user action creates a new key; values/dates are never used as duplicate heuristics.

**Tests**: frontend — header propagation, double-click prevention, same-key retry and new-action key generation.
**Gate**: full.
**Commit**: `feat(web): add replay-safe receivables api client`

### T40: Implement Contract receivables page and no-plan state

**What**: Implement the Finance read entry page showing readonly Contract/Client references, derived plan summary and the no-PaymentPlan state.
**Where**: `apps/web/src/features/finance-contract-receivables/ContractReceivablesPage.tsx`
**Depends on**: T39
**Reuses**: Typed query client and read model.
**Design**: §Frontend Design.
**Requirements**: ACCESS-01, ACCESS-04, ACCESS-08, RECEIPT-08–RECEIPT-14, REVERSE-06–REVERSE-07.
**Done when**:

- [ ] Only FINANCE_READ users can reach data; absence of a plan is rendered without offering unauthorized edits.
- [ ] Contract/Client references are readonly and contain no client personal-data duplication.
- [ ] Derived monetary/status display comes from the API response, not local authoritative recalculation.

**Tests**: frontend — authorized/no-plan/forbidden states and money-string rendering.
**Gate**: full.
**Commit**: `feat(web): show contract receivables overview`

### T41: Implement DRAFT PaymentPlan creation and total editor

**What**: Implement the capability-aware DRAFT plan creation and DRAFT total editing flow.
**Where**: `apps/web/src/features/finance-contract-receivables/PaymentPlanDraftEditor.tsx`
**Depends on**: T39
**Reuses**: Typed mutation client and plan route contracts.
**Design**: §Frontend Design; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-01–PLAN-03, ACCESS-05, ACCESS-10–ACCESS-11, IDEMP-01–IDEMP-03.
**Done when**:

- [ ] Controls appear only for the correct capabilities and explain Contract/Client as readonly references.
- [ ] Input is sent as decimal string and errors display typed API feedback.
- [ ] Retry uses the original logical-submit key without a duplicate local request.

**Tests**: frontend — create/edit capability states, error render and idempotent submit behavior.
**Gate**: full.
**Commit**: `feat(web): edit draft payment plans`

### T42: Implement DRAFT installment management and activation review

**What**: Implement the installment table/editor/reorder controls and explicit activation review for a DRAFT plan.
**Where**: `apps/web/src/features/finance-contract-receivables/InstallmentTable.tsx`
**Depends on**: T39
**Reuses**: Plan query/mutation contracts and LocalDate/money wire types.
**Design**: §Frontend Design; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-04–PLAN-07, INST-01–INST-11, ACCESS-05, ACCESS-10–ACCESS-11, IDEMP-01–IDEMP-03.
**Done when**:

- [ ] Draft users can add/edit/remove/reorder stable installment rows, with number separate from due date.
- [ ] Activation is an explicit action; it never silently renumbers a locally irregular sequence.
- [ ] API validation feedback handles totals, numbers, dates and frozen/ACTIVE state.

**Tests**: frontend — draft management, shared due dates, irregular activation error and capability-driven controls.
**Gate**: full.
**Commit**: `feat(web): manage installments and activate plans`

### T43: Implement allocated receipt flow and allocation timeline

**What**: Implement receipt registration from one or multiple installments in one active plan and its immutable allocation timeline view.
**Where**: `apps/web/src/features/finance-contract-receivables/ReceiptDialog.tsx`
**Depends on**: T39
**Reuses**: Active-plan projection and receipt route contract.
**Design**: §Frontend Design; §Receipt and Reversal Model.
**Requirements**: PLAN-08, RECEIPT-01–RECEIPT-16, ACCESS-05, ACCESS-10–ACCESS-11, IDEMP-01–IDEMP-03.
**Done when**:

- [ ] UI guides allocation total against selected plan balances without becoming the integrity boundary.
- [ ] Receipt submit is unavailable for DRAFT and the response refreshes the API projection/timeline.
- [ ] UI never accepts caller-entered timestamp, Client/Contract/currency replacement or derived values.

**Tests**: frontend — partial/multi-installment input, typed rejection, retry-safe submission and timeline refresh.
**Gate**: full.
**Commit**: `feat(web): register allocated receipts`

### T44: Implement elevated plan lifecycle actions

**What**: Implement return-to-DRAFT and discard controls with mandatory-reason confirmation and capability-aware visibility.
**Where**: `apps/web/src/features/finance-contract-receivables/ElevatedPlanActions.tsx`
**Depends on**: T39
**Reuses**: Typed plan lifecycle client and capability set.
**Design**: §Frontend Design; §PaymentPlan and Installment Lifecycle.
**Requirements**: PLAN-09–PLAN-12, ACCESS-06, ACCESS-11, IDEMP-01–IDEMP-03, EDGE-03.
**Done when**:

- [ ] Gerente Financeiro cannot invoke/display elevated actions; Vice-Presidente can only submit a nonempty reason.
- [ ] The UI explains that history/freeze blocks the action and displays typed server rejection without optimistic state mutation.
- [ ] Discard correctly returns to no-plan state after server confirmation.

**Tests**: frontend — capability separation, mandatory reason, history rejection and discard outcome.
**Gate**: full.
**Commit**: `feat(web): add elevated payment plan actions`

### T45: Implement the reversal dialog

**What**: Implement original-allocation reversal selection for the elevated reversal command.
**Where**: `apps/web/src/features/finance-contract-receivables/ReversalDialog.tsx`
**Depends on**: T39
**Reuses**: Transaction timeline, reversible amounts and reversal route contract.
**Design**: §Frontend Design; §Receipt and Reversal Model.
**Requirements**: REVERSE-01–REVERSE-10, ACCESS-06–ACCESS-07, ACCESS-09, ACCESS-11, IDEMP-01–IDEMP-03.
**Done when**:

- [ ] Reversal UI selects only original receipt allocations, shows read-only reversible amounts and requires a reason.
- [ ] The control is unavailable without the elevated reversal capability; backend authorization remains authoritative.
- [ ] Historical transaction rows remain immutable timeline entries, not editable form state.

**Tests**: frontend — VP-only reversal, partial reversal input, required reason and immutable-history rendering.
**Gate**: full.
**Commit**: `feat(web): add receipt reversal dialog`

### T46: Implement the financial audit panel

**What**: Implement the separately authorized immutable financial AuditEvent timeline, including discarded-plan evidence.
**Where**: `apps/web/src/features/finance-contract-receivables/FinancialAuditPanel.tsx`
**Depends on**: T39
**Reuses**: Typed audit query client and sanitized AuditEvent read model.
**Design**: §Frontend Design; §Audit writer.
**Requirements**: ACCESS-02, ACCESS-04, ACCESS-07–ACCESS-09, PLAN-11, REVERSE-08–REVERSE-09, EDGE-03.
**Done when**:

- [ ] FINANCIAL_AUDIT_READ independently controls the panel; FINANCE_READ or PLATFORM_ADMIN alone does not reveal audit data.
- [ ] The timeline shows actor, time, action, required reason and minimal references, including discard evidence, without copied personal data.
- [ ] Audit entries are read-only and do not expose edit/delete controls.

**Tests**: frontend — audit-capability isolation, discard evidence and immutable/non-PII rendering.
**Gate**: full.
**Commit**: `feat(web): show financial audit timeline`

### Phase 7: Security and acceptance hardening

### T47: Add receivables observability and boundary-security verification

**What**: Add minimal structured technical error logging/correlation and verify safe request, SQL, bigint and audit-data boundaries.
**Where**: `apps/api/src/modules/finance-contract-receivables/http/financeObservability.ts`
**Depends on**: T35, T39
**Reuses**: Domain error mapper, command middleware and AuditWriter data contract.
**Design**: §Responsibility boundaries; §Audit writer; §Locking strategy and retry.
**Requirements**: ACCESS-03–ACCESS-04, ACCESS-07–ACCESS-09, IDEMP-01–IDEMP-08, EDGE-02.
**Done when**:

- [ ] Errors have a correlation/request ID and safe structured context; idempotency keys are masked or handled as sensitive operational data.
- [ ] Logs/audit never copy Client/Contract personal-data payloads or raw financial command payloads indiscriminately.
- [ ] Tests prove no route is registered without capability guard, raw SQL parameters are bound, and API never serializes bigint directly.

**Tests**: API — route guard audit, safe error/log context and bigint serialization regression tests.
**Gate**: full.
**Commit**: `chore(finance): harden receivables operational boundaries`

### T48: Execute the cross-layer receivables acceptance suite and coverage audit

**What**: Add the feature-level acceptance suite that composes API, PostgreSQL and frontend flows and verifies every closed requirement remains covered.
**Where**: `apps/api/src/modules/finance-contract-receivables/__tests__/financeContractReceivables.acceptance.test.ts`
**Depends on**: T36, T37, T38, T40, T41, T42, T43, T44, T45, T46, T47
**Reuses**: All feature fixtures, real PostgreSQL harness and test coverage matrix.
**Design**: §Requirements Traceability; §Semantic Review Against the Specification.
**Requirements**: PLAN-01–PLAN-12, INST-01–INST-11, RECEIPT-01–RECEIPT-16, REVERSE-01–REVERSE-10, IDEMP-01–IDEMP-08, ACCESS-01–ACCESS-11, EDGE-01–EDGE-03.
**Done when**:

- [ ] Acceptance scenarios compose the approved plan, installment, receipt, reversal, authorization, audit and discard flows without testing out-of-scope behavior.
- [ ] The final automated requirement-ID comparison reports all 71 spec IDs mentioned by at least one implemented task/test and no unknown feature requirement ID.
- [ ] Full check, strict spec validation, strict task validation and whitespace check pass with no suppression.

**Tests**: integration — cross-layer acceptance, requirement coverage and regression gates; frontend flows remain in their co-located suite.
**Gate**: build.
**Commit**: `test(finance): certify receivables acceptance coverage`

## Requirement Coverage

The following primary mappings make the 71 closed specification requirements executable. Later tasks may reinforce the same requirement through API, UI, concurrency or acceptance coverage.

| Requirement set | Primary implementation task(s) | Reinforced by |
| --- | --- | --- |
| PLAN-01–PLAN-02 | T20 | T10, T36, T48 |
| PLAN-03 | T21 | T36, T41, T48 |
| PLAN-04–PLAN-07 | T26 | T36, T42, T48 |
| PLAN-08 | T29 | T37, T43, T48 |
| PLAN-09–PLAN-10 | T27 | T12, T36, T44, T48 |
| PLAN-11–PLAN-12 | T28 | T12, T36, T44, T46, T48 |
| INST-01–INST-04 | T22 | T09, T36, T42, T48 |
| INST-05 | T23, T24, T25 | T36, T42, T48 |
| INST-06 | T22 | T42, T48 |
| INST-07–INST-09 | T07, T12, T21–T25 | T36, T48 |
| INST-10–INST-11 | T26 | T25, T36, T42, T48 |
| RECEIPT-01–RECEIPT-07 | T29 | T10, T11, T30, T37, T43, T48 |
| RECEIPT-08–RECEIPT-14 | T08 | T29, T31, T33, T38, T40, T48 |
| RECEIPT-15–RECEIPT-16 | T29 | T17, T35, T37, T43, T48 |
| REVERSE-01–REVERSE-05 | T31 | T11, T32, T37, T45, T48 |
| REVERSE-06–REVERSE-07 | T08 | T31, T33, T38, T40, T48 |
| REVERSE-08–REVERSE-10 | T31 | T13, T17, T35, T37, T45, T46, T48 |
| IDEMP-01–IDEMP-08 | T19 | T18, T20–T31, T35–T37, T39, T48 |
| ACCESS-01–ACCESS-02 | T33 | T38, T40, T46, T48 |
| ACCESS-03–ACCESS-06 | T15 | T20–T31, T35–T37, T47, T48 |
| ACCESS-07 | T17 | T20–T31, T36–T37, T45–T46, T48 |
| ACCESS-08–ACCESS-09 | T14, T12, T13 | T20, T33, T38, T46–T48 |
| ACCESS-10–ACCESS-11 | T15 | T27–T28, T31, T36–T37, T41–T45, T48 |
| EDGE-01 | T14 | T20, T26, T36, T48 |
| EDGE-02 | T16 | T17, T19, T29–T32, T48 |
| EDGE-03 | T28 | T33, T38, T44, T46, T48 |

**Automated comparison command after T47:** `python3 .claude/skills/tlc-spec-driven/scripts/validate_spec.py .specs/features/finance-contract-receivables --strict` plus a repository-local requirement-ID comparison script introduced by T47. The comparison must report **71 spec IDs, 71 covered IDs, 0 missing and 0 unknown**.

## HIGH RISK Tasks

| Task | Risk | Required stronger evidence |
| --- | --- | --- |
| T10 | Partial unique index/CHECK constraints define financial cardinality and value safety. | Real PostgreSQL migration and distinct-key concurrent-create test. |
| T11 | Deferred trigger is the database guard for cross-table ledger relation integrity. | Commit-time invalid-graph tests against PostgreSQL. |
| T12 | Freeze/reference guards protect immutable financial history. | Receipt then total-reversal still rejects all structural mutation tests. |
| T13 | Append-only triggers protect ledger and audit evidence. | Direct update/delete rejection tests. |
| T16 | A wrong lock/retry implementation can permit concurrent invalid writes. | Real lock ordering, rollback and bounded-retry tests. |
| T17 | Audit failure must roll back every domain/idempotency effect. | Forced AuditWriter failure inside PostgreSQL transaction. |
| T19 | Idempotency must work across concurrent API instances. | Same-key two-connection test and replay/conflict matrix. |
| T29–T30 | Receipt allocations can overstate the paid balance. | Real `FOR UPDATE` R$1.000/R$700-vs-R$700 test. |
| T31–T32 | Reversal allocations can exceed the original receipt. | Real `FOR UPDATE` R$1.000/R$700-vs-R$700 test. |

## Diagram-Definition Cross-Check

| Task | Depends on (task body) | Diagram shows intra-phase dependency | Status |
| --- | --- | --- | --- |
| T01 | None | None | ✅ |
| T02 | T01 | T01 → T02 | ✅ |
| T03 | T01 | T01 → T03 | ✅ |
| T04 | T01 | T01 → T04 | ✅ |
| T05 | T02 | Cross-phase | ✅ |
| T06 | T02 | Cross-phase | ✅ |
| T07 | T05, T06 | T05 → T07; T06 → T07 | ✅ |
| T08 | T07 | T07 → T08 | ✅ |
| T09 | T04 | Cross-phase | ✅ |
| T10 | T09 | T09 → T10 | ✅ |
| T11 | T10 | T10 → T11 | ✅ |
| T12 | T10 | T10 → T12 | ✅ |
| T13 | T11, T12 | T11 → T13; T12 → T13 | ✅ |
| T14 | T02, T05 | Cross-phase | ✅ |
| T15 | T02 | Cross-phase | ✅ |
| T16 | T09, T13 | Cross-phase | ✅ |
| T17 | T16 | T16 → T17 | ✅ |
| T18 | T05, T06 | Cross-phase | ✅ |
| T19 | T16, T18 | T16 → T19; T18 → T19 | ✅ |
| T20 | T14, T15, T16, T17, T19 | Cross-phase | ✅ |
| T21 | T20 | T20 → T21 | ✅ |
| T22 | T20 | T20 → T22 | ✅ |
| T23 | T22 | T22 → T23 | ✅ |
| T24 | T22 | T22 → T24 | ✅ |
| T25 | T22 | T22 → T25 | ✅ |
| T26 | T20, T22 | T20 → T26; T22 → T26 | ✅ |
| T27 | T20 | T20 → T27 | ✅ |
| T28 | T20 | T20 → T28 | ✅ |
| T29 | T20, T22, T26, T19 | Cross-phase | ✅ |
| T30 | T29 | T29 → T30 | ✅ |
| T31 | T29 | T29 → T31 | ✅ |
| T32 | T31 | T31 → T32 | ✅ |
| T33 | T29, T31 | Cross-phase | ✅ |
| T34 | T02 | Cross-phase | ✅ |
| T35 | T15, T19 | Cross-phase | ✅ |
| T36 | T35, T20–T28 | T35 → T36 | ✅ |
| T37 | T35, T29, T31 | T35 → T37 | ✅ |
| T38 | T33, T35 | T33 → T38; T35 → T38 | ✅ |
| T39 | T03, T37, T38 | Cross-phase | ✅ |
| T40–T46 | T39 | T39 → each | ✅ |
| T47 | T35, T39 | Cross-phase | ✅ |
| T48 | T36–T47 as applicable | T47 → T48; remaining dependencies cross-phase | ✅ |

## Test Co-location Validation

| Task set | Code layer created/modified | Matrix requires | Task says | Status |
| --- | --- | --- | --- | --- |
| T01–T04 | Foundation/configuration | integration | integration | ✅ |
| T05–T08, T18 | Domain values/policies | unit | unit | ✅ |
| T09–T13, T16–T17, T19–T32, T33 | Prisma/application | integration | integration | ✅ |
| T34–T38, T47 | Hono HTTP adapters | API | API | ✅ |
| T39–T46 | React/Vite UI | frontend | frontend | ✅ |
| T48 | Cross-layer acceptance | integration | integration | ✅ |

Every task that modifies executable behavior includes its matching test layer in the same task. T30 and T32 deliberately use real PostgreSQL instead of mocks; T17 deliberately proves the audit rollback boundary. No task declares `Tests: none`.

## Pre-approval Review

- **Granularity:** 48 tasks; each has one concrete deliverable (value object, migration guarantee, use case, route module, UI increment, or acceptance suite). Route modules intentionally group only cohesive command families, not generic CRUD.
- **No circular dependencies:** all explicit dependencies point to the same or an earlier phase; same-phase edges appear in the Execution Plan.
- **Out-of-scope guard:** no task introduces Contract/Client ownership, CRM, Projects, Invoice, banking, credit, multiple plans, renegotiation, automatic interest/multa, reconciliation, export, purge or reversal-of-reversal.
- **No product decision reopened:** implementations use only DRAFT/ACTIVE, BRL, canonical references, capability authorization, allocation model, idempotency and audit behavior already closed in the spec/design.
- **Test sufficiency:** all domain rules, database guarantees, APIs and UI flows have co-located tests; the two financial race tests and audit rollback test are mandatory.

## Approval Gate

- [x] All 71 specification IDs are represented by at least one implementation task and a final acceptance check.
- [x] PaymentPlan lifecycle, Installment identity/numbering, receipt, reversal, authorization, audit, idempotency and race conditions have explicit tasks.
- [x] No task implements a declared out-of-scope item or starts implementation in this planning phase.
- [ ] User approves this `tasks.md` before Execute begins.
