# Platform Auth Shell Specification

**Status:** Closed — implemented and verified.

## Problem Statement

The ERP needs one shared authenticated session and capability model for the Hono API and React shell. Finance must consume the platform identity without creating a finance-specific user or bypassing explicit capabilities.

## Goals

- [x] Authenticate users with Argon2id credentials and an opaque eight-hour HttpOnly session.
- [x] Resolve explicit `PlatformPrivilege` rows into the existing `FinanceCapability` contract.
- [x] Protect browser mutations with Origin validation and expose login, session and logout endpoints.
- [x] Provide a capability-aware React shell and the Financeiro receivables experience through T39–T46.

## Out of Scope

| Item | Motivo |
| --- | --- |
| Commercial or Projects business cycles | Those modules remain placeholders in this block. |
| Role or job-title authorization | Authorization uses explicit `PlatformPrivilege` capability rows. |
| Passwords or password hashes in logs/API responses | Credentials are secrets and never leave the auth boundary. |
| T47/T48 security hardening tasks | Explicitly deferred to the next block. |

## Assumptions & Open Questions

| Assumption | Chosen default | Rationale |
| --- | --- | --- |
| Visual source | [`docs/product/design-guideline.md`](../../../docs/product/design-guideline.md) and [`docs/product/09-design-system.md`](../../../docs/product/09-design-system.md) | The ERP inherits the iTracker foundation and extends it for a multi-module shell. |
| Password hashing | Argon2id | It is the established password-hashing requirement for this block. |
| Development topology | Same-origin Vite proxy | It avoids development CORS while preserving an explicit production allowlist. |
| Contract ownership | External `ContractReferencePort` in production; persisted dev adapter in development/test | Commercial remains the owner and is not implemented here. |

Open questions: none.

## User Stories

### P1: Authenticate and operate a shared ERP shell

As a platform user, I want a safe session and capability-aware shell so that each module receives the same canonical identity.

**Acceptance Criteria:**

1. WHEN valid credentials are submitted THEN the system SHALL create an eight-hour HttpOnly session and return a safe user projection.
2. IF a session is expired or revoked THEN the system SHALL reject protected requests with an unauthenticated response.
3. WHEN a user lacks a finance privilege THEN the shell SHALL hide Financeiro and the API SHALL reject direct finance access.

### P1: Operate Financeiro from the shared shell

As an authorized finance user, I want readonly projections and controlled mutations so that the existing backend lifecycle is usable from the web.

**Acceptance Criteria:**

1. WHEN a finance user opens a valid contract THEN the page SHALL derive KPI and installment state from the API response.
2. WHEN a mutation is submitted THEN the client SHALL send a stable idempotency key and refresh server-derived state after success.
3. IF a destructive action lacks a reason or capability THEN the UI SHALL block submission and the API SHALL reject it.

## Requirements

### AUTH-01 — Credential and session safety

The system SHALL normalize email addresses, verify passwords with Argon2id, generate a cryptographically random opaque token, persist only its SHA-256 hash, and never expose credentials or raw tokens in logs or JSON.

### AUTH-02 — Session cookie

The system SHALL set `ijunior_session` with `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production, and an absolute expiry of eight hours. Expired and revoked sessions SHALL be rejected.

### AUTH-03 — Authentication API

`POST /auth/login` SHALL accept only `email` and `password`, return a safe user projection, and reject invalid credentials generically. `GET /auth/me` SHALL return the authenticated user and capabilities. `POST /auth/logout` SHALL revoke the current session and clear the cookie idempotently.

### AUTH-04 — Capability resolution

Capabilities SHALL be resolved from active, non-expired `PlatformPrivilege` rows. `PLATFORM_ADMIN` SHALL not bypass missing finance capabilities. Finance use cases SHALL continue declaring their own capability requirements.

### AUTH-05 — Authenticated command context

The session middleware SHALL resolve an `AuthenticatedCommandContext` containing the canonical actor id and explicit capabilities for downstream finance routes.

### AUTH-06 — CSRF boundary

Browser mutations SHALL validate `Origin` against an explicit allowlist. Same-origin development requests SHALL work through the Vite proxy; untrusted origins SHALL receive a 403 response.

### AUTH-07 — Development seed

An idempotent development seed SHALL create a Finance Manager, Vice-President, user without finance capability, and `PLATFORM_ADMIN` without finance capability from environment-provided credentials. Passwords SHALL not be versioned.

### SHELL-01 — Protected React shell

The React app SHALL expose `/login`, `/`, `/finance`, `/finance/contracts/:contractId`, `/commercial`, and `/projects`, with loading/authenticated/unauthenticated states and protected-route guards.

### SHELL-02 — Visual and accessibility contract

The shell SHALL use dark-first CSS tokens, Sora headings, Inter content, capability-aware navigation, responsive sidebar/BottomNav, accessible feedback primitives, and no page-local hex colors, `alert()` or `confirm()` calls.

### FINWEB-01 — Financeiro Web

T39–T46 SHALL provide typed DTOs, stable idempotency keys, readonly receivables projections, PaymentPlan draft editing, installments, receipts, return/discard, reversals, and paginated readonly audit using exact decimal strings rather than JavaScript `Number` arithmetic.

## Acceptance Tests

1. Valid login sets the expected cookie and `/auth/me` returns safe identity and capabilities.
2. Invalid, expired, revoked, or logged-out sessions cannot access protected finance routes.
3. A user with only `PLATFORM_ADMIN` is denied finance access.
4. Concurrent login/session and seed operations do not persist raw tokens or duplicate seed rows.
5. The manager and vice-president journeys complete the existing real finance lifecycle; unauthorized users see no finance navigation and receive backend 403.
6. Lint, typecheck, unit, integration, API, web, E2E, build, strict spec/task validation, and diff checks pass.

## Traceability

| Requirement ID | Status |
| --- | --- |
| AUTH-01 | Verified |
| AUTH-02 | Verified |
| AUTH-03 | Verified |
| AUTH-04 | Verified |
| AUTH-05 | Verified |
| AUTH-06 | Verified |
| AUTH-07 | Verified |
| SHELL-01 | Verified |
| SHELL-02 | Verified |
| FINWEB-01 | Verified |

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| AUTH-01 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-02 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-03 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-04 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-05 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-06 | Authenticate and operate a shared ERP shell | Verified |
| AUTH-07 | Authenticate and operate a shared ERP shell | Verified |
| SHELL-01 | Authenticate and operate a shared ERP shell | Verified |
| SHELL-02 | Authenticate and operate a shared ERP shell | Verified |
| FINWEB-01 | Operate Financeiro from the shared shell | Verified |
