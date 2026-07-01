# ADR-0004: Shared frontend packages (errors, store, ui)

## Status

Accepted

## Date

2026-07-02

## Context

Phase 2 scaffolding placed shadcn/ui components in `apps/web/components/ui/` (ADR-0002). As domain specs (`employees`, `payroll`, etc.) land, the web app needs:

- A consistent component library consumed across routes
- A standard client data layer (server state + local UI state)
- Shared error vocabulary for API failures and UI messaging

The finance-os-frontends monorepo solves this with `@repo/errors`, `@repo/store`, and `@repo/ui` workspace packages. Salary-mgmt should follow the same pattern without importing finance-os domain code.

## Decision

Add three shared frontend workspace packages:

| Package | Role |
|---|---|
| `@salary-mgmt/errors` | Generic error types and core HTTP/network messages |
| `@salary-mgmt/store` | TanStack Query client/provider, typed HTTP client, Zustand helpers, generic hooks; domain features under `src/features/<domain>/` per spec |
| `@salary-mgmt/ui` | Shared shadcn/ui primitives with CSS variables and subpath exports |

`apps/web` consumes all three. Components no longer live in `apps/web/components/ui/`.

**Build strategy:** React packages export TypeScript source; Next.js transpiles via `transpilePackages` (same as finance-os). Non-React packages (`types`, `money`) continue to build to `dist/`.

## Alternatives Considered

### Keep shadcn/ui app-local (ADR-0002 as-is)

- Pros: Simpler initial scaffold
- Cons: Duplication risk if multiple apps added; no shared Query/API infrastructure
- Rejected: Domain work needs shared client patterns from day one

### Full port of finance-os packages including domain features

- Pros: Faster copy-paste
- Cons: Auth, OAuth, chat, FMP code irrelevant to salary-mgmt MVP
- Rejected: Infrastructure-only port; domain specs own `features/` slices

## Consequences

- ADR-0002 partially superseded: shadcn/ui lives in `@salary-mgmt/ui`, not `apps/web/components/ui/`
- New commit scopes: `(errors)`, `(store)`, `(ui)`
- Domain specs add query hooks under `packages/store/src/features/<domain>/`
- `apps/web` Tailwind `content` must include `packages/ui/src/**`
- New dependencies: `@tanstack/react-query`, `zustand`, `immer` (approved in scaffolding Phase 3 plan)

## References

- [ADR-0002](./ADR-0002-shadcn-ui-component-library.md) — original app-local shadcn decision
- [docs/specs/scaffolding.md](../specs/scaffolding.md) — Phase 3 scope
