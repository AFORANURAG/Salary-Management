# AGENTS.md — `packages/errors`

Shared error types and core HTTP/network messages for the frontend.

## Purpose

Single vocabulary for API failures and generic error handling. Consumed by `@salary-mgmt/store` API client and UI forms.

## Commands

```bash
pnpm --filter @salary-mgmt/errors typecheck
pnpm --filter @salary-mgmt/errors lint
pnpm --filter @salary-mgmt/errors test
```

## Conventions

- **Types and message maps only** — no React, no fetch logic.
- Export `ErrorLike` for generic error shapes from API responses.
- Domain-specific error modules (e.g. `employees.ts`) added by domain specs when needed.
- No auth/OAuth errors in MVP scaffolding.

## Boundaries

- Do not import from `apps/*` or `@salary-mgmt/store`.
- Do not add runtime dependencies beyond TypeScript tooling.

## Agent workflow

Add domain error modules when a spec defines user-facing error messages → verify store and web typecheck.

Spec: [`docs/specs/scaffolding.md`](../../docs/specs/scaffolding.md) · ADR: [`docs/decisions/ADR-0004-shared-fe-packages.md`](../../docs/decisions/ADR-0004-shared-fe-packages.md)
