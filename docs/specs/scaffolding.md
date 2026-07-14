# Spec: Project Scaffolding (Foundation)

> Foundational spec under [`../spec.md`](../spec.md). Owns the repo-wide skeleton — the monorepo, app shells, shared packages, container setup, and base tooling that **every domain spec depends on**. This precedes all domain work; it has no domain dependencies of its own.

## Objective

Stand up an empty-but-runnable monorepo that matches the root spec's [Tech Stack](../spec.md#tech-stack), [Commands](../spec.md#commands), and [Project Structure](../spec.md#project-structure), so that domain modules (`employees`, `salary`, `payroll`, `payslips`, `reporting`) can be built on a consistent, tested, containerized base. **No business logic here** — just the foundation everything else plugs into.

## Scope

What "scaffolded" means concretely:

- **Monorepo wiring:** pnpm workspace (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`) with the [root commands](../spec.md#commands) (`dev`, `build`, `lint`, `typecheck`, `test`) wired and cached.
- **`apps/api` (NestJS):** bootable Nest app with a `GET /health` endpoint, `database/` wired to TypeORM + Postgres, and empty `employees/ salary/ payroll/ payslips/ reporting/ common/` module folders as placeholders.
- **`apps/web` (Next.js App Router):** bootable app wired to shared FE packages (`@salary-mgmt/ui`, `@salary-mgmt/store`) with a placeholder home route that calls the API `/health`.
- **Shared packages:** `packages/types`, `packages/config`, `packages/money`, `packages/errors`, `packages/store`, `packages/ui` — created as importable, typechecked packages.
- **Database plumbing:** TypeORM datasource config, migration runner command, and an empty seed entrypoint (`pnpm --filter api seed`) ready to be filled by domain specs.
- **Containerization:** `docker-compose.yml` bringing up `db` (Postgres 16) + `api` + `web`; Dockerfiles for `api` and `web`.
- **Base tooling:** TypeScript strict everywhere, shared ESLint + Prettier, and the testing harness (Vitest / `@nestjs/testing` + Testing Library) runnable even with zero domain tests.

### Phase 3 — Shared FE packages

Infrastructure-only port from finance-os-frontends (no auth/OAuth/chat/FMP domain code):

- **`packages/errors`** — `ErrorLike`, `CORE_ERROR_MESSAGES`, `getRequestFailedMessage`
- **`packages/store`** — TanStack Query client/provider/devtools, salary-mgmt query key stubs, typed HTTP client (`createApiClient`, `ApiError`), Zustand helpers (`createStore`, `createPersistedStore`), generic hooks
- **`packages/ui`** — shared shadcn/ui component library with CSS variables in `globals.css`, subpath exports (e.g. `@salary-mgmt/ui/button`)
- **`apps/web`** consumes all three; local `components/ui/*` removed

## Project Structure (target)

Scaffolding produces exactly the tree defined in the root spec — see [Project Structure](../spec.md#project-structure). This spec owns *creating* it; domain specs own *filling in* their module folders.

## Key Rules

- **Foundation only:** no entities, business rules, or endpoints beyond `/health`. Module folders are empty placeholders owned by their domain specs.
- **Single source of structure:** the tree, stack versions, and commands come from the root [`spec.md`](../spec.md) — do not diverge; update the root spec first if they need to change (per its [Boundaries](../spec.md#boundaries)).
- **Clean checkout runs:** a fresh clone must reach a running stack via documented commands with no manual, undocumented steps.
- **Shared contracts are real packages:** `packages/types`, `packages/money`, `packages/errors`, `packages/store`, and `packages/ui` are imported by FE from day one — no duplicated shapes, no local copies.
- **Strict from the start:** TypeScript strict, lint, and typecheck must pass on the empty skeleton before any domain work begins.
- **Domain features in store:** query hooks and mutations for a domain live in `packages/store/src/features/<domain>/` — owned by that domain spec, not scaffolding.

## Non-Negotiable Test Cases

- `docker compose up --build` brings up `db` + `api` + `web` from a clean checkout with no manual steps.
- `GET /health` on the running API returns a success response, and the web home route can reach it.
- `pnpm typecheck && pnpm lint && pnpm test` pass from the repo root on the empty skeleton.
- `pnpm --filter api migration:run` and `pnpm --filter api seed` execute successfully (even as no-ops) against the compose `db`.
- A type exported from `packages/types` can be imported by **both** `apps/web` and `apps/api` and typechecks.
- `@salary-mgmt/errors` is importable by `@salary-mgmt/store` and typechecks.
- `QueryProvider` renders in the web layout; home page still reaches `/health`.
- `@salary-mgmt/ui` `Button` renders on the home page via package import.

## Success Criteria

- [x] Monorepo boots: `pnpm install` then `pnpm dev` runs web + api in parallel via Turbo.
- [x] `docker compose up --build` yields a healthy db + api + web from a clean checkout.
- [x] Root `pnpm typecheck && pnpm lint && pnpm test` all pass on the scaffold.
- [x] Migration and seed commands run against the compose Postgres without error.
- [x] All five domain module folders exist under `apps/api/src/` as empty, importable placeholders.
- [x] `packages/types`, `packages/config`, `packages/money` exist and are consumable by the apps.
- [x] `packages/errors`, `packages/store`, `packages/ui` exist and are consumable by `apps/web`.
- [x] `apps/web` wired to shared FE packages; local shadcn copy removed.

## Out of Scope

- Any domain logic, entities, DTOs, or endpoints beyond `/health` (owned by domain specs).
- Real seed data content is in [`chore/seed-data-india-payroll`]: 10k employees all `country=IN currency=INR`, salary structures with 5 components each, 3 completed payroll runs. The *mechanism* (seed entrypoint) is scaffolded here; the *content* lands with that branch.
- CI pipeline configuration and deployment targets (see root Open Questions #6).
- Finance-os domain features (auth, OAuth, chat, FMP, billing); auth/OAuth error modules; domain query hooks.

## Open Questions

- ~~Package manager: pnpm assumed — confirm vs npm/yarn?~~ **Resolved:** [ADR-0001](../decisions/ADR-0001-pnpm-turborepo-monorepo.md)
- ~~Component library: shadcn/ui assumed over MUI?~~ **Resolved:** [ADR-0002](../decisions/ADR-0002-shadcn-ui-component-library.md), extended by [ADR-0004](../decisions/ADR-0004-shared-fe-packages.md)
- ~~Backend test runner: Vitest or Jest (NestJS default)?~~ **Resolved:** [ADR-0003](../decisions/ADR-0003-vitest-backend-test-runner.md)
- Deployment target for the Dockerfiles — local-only compose, or a specific host? (root Open Question #6)
