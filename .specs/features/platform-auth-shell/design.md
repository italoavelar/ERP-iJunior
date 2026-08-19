# Platform Auth Shell Design

**Status:** Implemented and verified.

## Architecture

The API keeps `createApp` injectable for tests and adds a Node entrypoint using `@hono/node-server`. An auth module owns credential hashing, session tokens, cookie serialization, CSRF checks, and capability resolution. Finance routes receive an adapter that translates the session principal into the existing `AuthenticatedCommandContext`.

The web app uses React Router, an `AuthProvider`, a central `httpClient`, and a protected `ERPLayout`. Vite proxies `/auth` and `/api` to the API in development. Commercial and Projects routes render placeholders only.

## Persistence

Prisma adds `User`, `Member`, `Credential`, `Session`, and `PlatformPrivilege`. User email is unique after normalization. Credentials store Argon2id hashes. Sessions store only a SHA-256 token hash plus absolute expiry and revocation time. Privileges are explicit capability rows with optional expiry and revocation fields. Existing finance tables and actor identifiers remain unchanged.

Development-only contract references use a persisted `DevContractReference` adapter behind `ContractReferencePort`. Production runtime requires an externally configured adapter; no Commercial entity or endpoint is added.

## HTTP and security

Authentication responses use closed DTOs. Login failures are generic. Session lookup hashes the supplied cookie before querying. Mutating browser requests pass Origin validation against `WEB_ORIGINS`; requests without an Origin remain available to non-browser API clients. Logout always clears the cookie.

Finance command authorization remains inside each use case. The executor shares idempotency mechanics only and never grants capabilities.

## Frontend visual system

Global tokens implement the repository-authoritative [`iTracker Design Guideline`](../../../docs/product/design-guideline.md) and [`ERP iJúnior Design System`](../../../docs/product/09-design-system.md): dark-first graphite surfaces, teal/cyan actions, Sora for headings/KPIs, Inter for content, glass only on sticky header/sidebar/dropdowns, semantic badges, and accessible focus rings. The ERP document explicitly extends the iTracker base; it is not a parallel visual system. Pages consume primitives and tokens instead of local hex values or parallel dark-mode classes. Finance forms use Sheet on desktop and Dialog on mobile; destructive actions require Dialog confirmation.

## Verification

Unit tests cover normalization, Argon2id, token hashing, expiry, revocation, and capability resolution. PostgreSQL tests cover persistence and seed idempotency. API tests cover cookies, closed DTOs, CSRF, session state, and `PLATFORM_ADMIN`. Web tests cover bootstrap, guards, shell, capability visibility, and stable idempotency. Playwright runs Chromium against the real API, Vite, PostgreSQL, and seed.
