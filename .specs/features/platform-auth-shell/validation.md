# Platform Auth Shell Validation

**Date**: 2026-08-19  
**Spec**: `.specs/features/platform-auth-shell/spec.md`  
**Diff range**: `85f1980`  
**Verifier**: independent fresh-eyes pass after the implementation commit

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T01–T07 | ✅ Done | specification, Prisma migration, Argon2id/session services, Hono routes, runtime, seed and docs are present; strict validators pass |
| T08–T09 | ✅ Done | React Router/AuthProvider/shell, central client, tokens and proxy compile and pass web tests |
| T10–T13 | ✅ Done | receivables states, draft/activation, receipt, elevated actions, reversal and audit controls are implemented in `ContractReceivablesPage.tsx` |
| T14–T15 | ✅ Done | finance T39–T46 are marked Complete; T47/T48 remain unchecked; all gates and this report pass |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| Valid credentials create an authenticated session | HTTP 200, cookie and safe identity/capabilities | `apps/api/src/modules/platform-auth-shell/http/__tests__/auth-routes.api.test.ts:25` — `expect(login.status).toBe(200)`; `:27-33` cookie and DTO assertions | ✅ PASS |
| Invalid credentials and unknown login fields are generic | HTTP 401 with `INVALID_CREDENTIALS` | `auth-routes.api.test.ts:39-43` — exact status and JSON assertions | ✅ PASS |
| Session cookie has required attributes | HttpOnly, SameSite=Lax, Path=/ | `auth-routes.api.test.ts:27-30` — exact header assertions | ✅ PASS |
| Expired and revoked sessions are rejected | resolve returns undefined | `apps/api/src/modules/platform-auth-shell/application/__tests__/AuthService.unit.test.ts:43-52`; `auth-primitives.unit.test.ts:16-21` | ✅ PASS |
| Logout revokes and clears the session | 204, Max-Age=0, subsequent me is 401 | `auth-routes.api.test.ts:49-54` and `AuthService.unit.test.ts:34-41` | ✅ PASS |
| Raw session tokens are never persisted | persisted value is 64-char SHA-256 and differs from raw token | `apps/api/src/modules/platform-auth-shell/infrastructure/__tests__/auth.postgres.test.ts:21-27` | ✅ PASS |
| Active finance privileges resolve explicitly | active privilege is present, revoked/absent privileges are absent | `auth.postgres.test.ts:35-38` | ✅ PASS |
| Untrusted browser origins are rejected | HTTP 403 | `auth-routes.api.test.ts:49-50` — `expect(blocked.status).toBe(403)` | ✅ PASS |
| `PLATFORM_ADMIN` alone has no finance bypass | finance capability set is explicit and does not synthesize missing finance grants | `auth.postgres.test.ts:35-38`; existing finance API assertion in `apps/api/src/modules/finance-contract-receivables/http/__tests__/finance-routes.api.test.ts` | ✅ PASS |
| Protected React shell renders accessible login and guards | labeled controls and protected route behavior are available | `tests/e2e/shell.spec.ts:4-8`; `apps/web/src/App.web.test.tsx:35-36` | ✅ PASS |
| Finance Web preserves decimal-string boundary and stable intents | API client sends credentials, typed errors and one stable key per logical submit | `apps/web/src/lib/httpClient.ts:1-25`; `apps/web/src/features/finance-contract-receivables/ContractReceivablesPage.tsx:16-27` | ✅ PASS |

## Gates

- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS: 89 tests (22 unit, 19 PostgreSQL integration, 46 API, 2 web)
- `npm run test:e2e` — PASS: 1 Chromium smoke journey
- `npm run build` — PASS
- `validate_tasks.py --strict` for both features — PASS
- `validate_spec.py --strict` for both features — PASS
- `git diff --check` — PASS
- Development seed idempotence — PASS: two executions on PostgreSQL produced 4 users, 24 explicit privileges and 1 canonical dev contract.

## Discrimination Sensor

| Mutation | Result |
| --- | --- |
| Inverted `isSessionValid` expiry comparison in an isolated `/tmp/ijunior-sensor` worktree | ✅ Killed; auth primitive suite failed at the exact valid-session assertion |

The real worktree porcelain was unchanged after scratch cleanup. No surviving mutant was observed in the targeted auth boundary.

## Quality Review

The implementation uses explicit platform privileges, keeps authorization in finance use cases, uses bound SQL parameters, avoids raw tokens/passwords in responses, keeps money as decimal strings, uses shared CSS tokens, avoids page-local hex/dark classes, and does not use `alert()` or `confirm()`. Commercial and Projects remain placeholders. T47/T48 were not started.

**Verdict: PASS ✅**
