# AGENTS.md — `packages/store`

Client data layer for the web app — TanStack Query, typed HTTP client, Zustand helpers, generic hooks.

## Purpose

Infrastructure for server state (React Query) and local UI state (Zustand). Domain query hooks live under `src/features/<domain>/`.

## Commands

```bash
pnpm --filter @salary-mgmt/store typecheck
pnpm --filter @salary-mgmt/store test
pnpm --filter @salary-mgmt/store lint
```

## Exports

| Subpath | Contents |
|---|---|
| `@salary-mgmt/store` | Main barrel (query, stores, hooks, API client) |
| `@salary-mgmt/store/query` | QueryProvider, hooks, query keys |
| `@salary-mgmt/store/stores` | Zustand store helpers |
| `@salary-mgmt/store/hooks` | Generic React hooks |
| `@salary-mgmt/store/api` | Typed HTTP client (`createApiClient`, `ApiError`) |

## Conventions

- **Infrastructure vs features:** scaffolding owns `query/`, `api/`, `stores/create-store.ts`, `hooks/`; domain specs own `features/<domain>/`.
- **Query keys:** extend `query/keys.ts` factory when adding a domain; use hierarchical keys for invalidation.
- **API client:** `createApiClient(baseUrl)` throws `ApiError` using `@salary-mgmt/errors` messages.
- **Source exports:** TypeScript source consumed via Next.js `transpilePackages` — no `dist/` build.

## Boundaries

- Do not import from `apps/*`.
- Do not add auth/token cookie logic in MVP.
- Peer dependency on React 18+.

## Agent workflow

Domain spec task → add `features/<domain>/` (api, queries, mutations) → wire query keys → test → verify web typecheck.

Spec: [`docs/specs/scaffolding.md`](../../docs/specs/scaffolding.md) · ADR: [`docs/decisions/ADR-0004-shared-fe-packages.md`](../../docs/decisions/ADR-0004-shared-fe-packages.md)
