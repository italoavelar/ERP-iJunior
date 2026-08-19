# Platform Auth Shell Tasks

## Execution Protocol

Implement with the `tlc-spec-driven` Execute flow. T47/T48 from the finance feature remain deferred. Commercial and Projects stay placeholders.

**Spec:** `.specs/features/platform-auth-shell/spec.md`  
**Design:** `.specs/features/platform-auth-shell/design.md`

## Test Coverage Matrix

| Layer | Required tests | Command |
| --- | --- | --- |
| Auth values/services | Unit normalization, hashing, token and capability branches | `npm run test:unit` |
| Prisma auth persistence | PostgreSQL session, revocation, expiry and seed idempotency | `npm run test:integration` |
| Hono auth boundary | API login, cookie, me, logout, DTO, CSRF and capability rejection | `npm run test:api` |
| React shell/finance | Web bootstrap, guards, capability visibility, lifecycle feedback and idempotency | `npm run test:web` |
| Browser journey | Chromium with real API, Vite, PostgreSQL and seed | `npm run test:e2e` |

## Execution Plan

### Phase 0: Shared platform

`T01 → T02 → T03 → T04`

### Phase 1: API integration

`T04 → T05 → T06 → T07`

### Phase 2: Web foundation

`T04 → T08 → T09`

### Phase 3: Finance Web

`T09 → T10 → T11 → T12 → T13 → T14`

### Phase 4: Acceptance

`T14 → T15`

```text
T01 -> T02
T02 -> T03
T03 -> T04
T04 -> T05
T05 -> T06
T06 -> T07
T04 -> T08
T08 -> T09
T09 -> T10
T10 -> T11
T10 -> T12
T10 -> T13
T11 -> T14
T12 -> T14
T13 -> T14
T14 -> T15
```

## Task Breakdown

## Tasks

### T01: Define platform auth specification and design

**Requirements:** AUTH-01–AUTH-07, SHELL-01–SHELL-02, FINWEB-01  
**Where:** `.specs/features/platform-auth-shell`  
**Tests:** validator  
**Gate:** build  
**Done when:** spec, design and this task plan exist, validate strictly, and explicitly defer T47/T48 and Commercial/Projects.  
**Tests:** validator.  
**Status:** Complete — 2026-08-19

### T02: Add Prisma platform identity models and migration

**Depends on:** T01  
**Where:** `prisma/schema.prisma`, `prisma/migrations`  
**Tests:** PostgreSQL migration  
**Gate:** build  
**Done when:** User, Member, Credential, Session and PlatformPrivilege persist with unique email, hashed-token lookup, expiry/revocation fields and indexes; existing finance migrations still apply.  
**Tests:** schema validation and PostgreSQL migration.  
**Status:** Complete — 2026-08-19

### T03: Implement credential, token and capability services

**Depends on:** T02  
**Where:** `apps/api/src/modules/platform-auth-shell`  
**Tests:** unit  
**Gate:** quick  
**Done when:** email normalization, Argon2id verification, random token generation, SHA-256 persistence and explicit privilege resolution pass unit tests without leaking secrets.  
**Tests:** unit.  
**Status:** Complete — 2026-08-19

### T04: Implement auth persistence, seed and session middleware

**Depends on:** T03  
**Where:** `apps/api/src/modules/platform-auth-shell`  
**Tests:** integration  
**Gate:** full  
**Done when:** login/me/logout services, absolute eight-hour expiry, revocation, idempotent dev seed and `AuthenticatedCommandContext` adapter pass PostgreSQL tests.  
**Tests:** integration.  
**Status:** Complete — 2026-08-19

### T05: Expose Hono auth routes, CSRF and real Node runtime

**Depends on:** T04  
**Where:** `apps/api/src/modules/platform-auth-shell/http`, `apps/api/src/server.ts`  
**Tests:** API  
**Gate:** full  
**Done when:** closed DTO login, cookie attributes, me/logout, Origin allowlist, protected finance integration and `@hono/node-server` runtime pass API tests.  
**Tests:** API.  
**Status:** Complete — 2026-08-19

### T06: Add persisted dev Contract adapter and Vite proxy

**Depends on:** T05  
**Where:** `apps/api/src`, `apps/web/vite.config.ts`  
**Tests:** integration  
**Gate:** build  
**Done when:** development/test runtime resolves canonical Contract references through an explicit adapter, production fails closed without an external adapter, and Vite proxies `/auth` and `/api`.  
**Tests:** integration/build.  
**Status:** Complete — 2026-08-19

### T07: Add auth and runtime documentation and gates

**Depends on:** T06  
**Where:** `platform runtime documentation`  
**Tests:** build  
**Gate:** build  
**Done when:** environment example, seed command and runtime instructions are documented without credentials; lint/typecheck/build pass.  
**Tests:** build.  
**Status:** Complete — 2026-08-19

### T08: Build React Router, AuthProvider and visual ERP shell

**Depends on:** T04  
**Where:** `apps/web/src`  
**Tests:** web  
**Gate:** full  
**Done when:** login/protected routes, loading states, capability-aware sidebar, user/logout menu, responsive BottomNav, tokenized dark-first styling and accessible primitives render in web tests.  
**Tests:** web.  
**Status:** Complete — 2026-08-19

### T09: Add typed HTTP client and finance DTO/error foundation

**Depends on:** T08  
**Where:** `apps/web/src/lib`, `apps/web/src/features/finance-contract-receivables`  
**Tests:** web  
**Gate:** quick  
**Done when:** centralized credentialed client handles JSON/empty/error/session-expiry responses and stable idempotency keys; no frontend money math uses `Number`.  
**Tests:** web.  
**Status:** Complete — 2026-08-19

### T10: Implement receivables page and PaymentPlan DRAFT editing

**Depends on:** T09  
**Where:** `apps/web/src/features/finance-contract-receivables`  
**Tests:** web and E2E  
**Gate:** full  
**Done when:** no-plan, DRAFT and ACTIVE states, KPIs, readonly projections, total editing and capability-gated actions use real API data.  
**Tests:** web/E2E.  
**Status:** Complete — 2026-08-19

### T11: Implement installment editor and activation review

**Depends on:** T10  
**Where:** `apps/web/src/features/finance-contract-receivables`  
**Tests:** web and E2E  
**Gate:** full  
**Done when:** table editing, creation, removal, reordering, validation and activation review use Sheet/Dialog feedback and refresh persisted state.  
**Tests:** web/E2E.  
**Status:** Complete — 2026-08-19

### T12: Implement ReceiptDialog and derived balance refresh

**Depends on:** T10  
**Where:** `apps/web/src/features/finance-contract-receivables`  
**Tests:** web and E2E  
**Gate:** full  
**Done when:** partial and multi-allocation receipts submit one stable intent, confirm in Dialog, show Toast/inline errors and refresh server-derived balances.  
**Tests:** web/E2E.
**Status:** Complete — 2026-08-19

### T13: Implement return/discard, reversal and audit panel

**Depends on:** T10  
**Where:** `apps/web/src/features/finance-contract-receivables`  
**Tests:** web and E2E  
**Gate:** full  
**Done when:** capability-gated destructive dialogs require reasons, reversal exposes reversible amounts, and audit timeline is readonly and paginated.  
**Tests:** web/E2E.  
**Status:** Complete — 2026-08-19

### T14: Complete finance feature task records

**Depends on:** T11, T12, T13  
**Where:** `.specs/features/finance-contract-receivables/tasks.md`  
**Tests:** full gates  
**Gate:** build  
**Done when:** finance T39–T46 are marked Complete only after their tests pass; T47/T48 remain unchecked.  
**Tests:** full gates.  
**Status:** Complete — 2026-08-19

### T15: Independent TLC validation and final acceptance

**Depends on:** T14  
**Where:** `.specs/STATE.md`  
**Tests:** full gates and fresh verifier  
**Gate:** build  
**Done when:** all strict validators, lint, typecheck, unit, integration, API, web, E2E, build and `git diff --check` pass; `.specs/STATE.md` records the handoff and explicitly states T47/T48 were not started.  
**Tests:** full gates plus fresh verifier.  
**Status:** Complete — 2026-08-19

## Gate Check Commands

| Gate | Command |
| --- | --- |
| Quick | `npm run test:unit` |
| Full | `npm run test:unit && npm run test:integration && npm run test:api && npm run test:web && npm run test:e2e` |
| Build | `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build` |
