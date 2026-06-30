# Spec: Project Scaffolding (Foundation)

> Foundational spec under [`../spec.md`](../spec.md). Owns the repo-wide skeleton — the monorepo, app shells, shared packages, container setup, and base tooling that **every domain spec depends on**. This precedes all domain work; it has no domain dependencies of its own.

## Objective

Stand up an empty-but-runnable monorepo that matches the root spec's [Tech Stack](../spec.md#tech-stack), [Commands](../spec.md#commands), and [Project Structure](../spec.md#project-structure), so that domain modules (`employees`, `salary`, `payroll`, `payslips`, `reporting`) can be built on a consistent, tested, containerized base. **No business logic here** — just the foundation everything else plugs into.

## Scope

What "scaffolded" means concretely:

- **Monorepo wiring:** pnpm workspace (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`) with the [root commands](../spec.md#commands) (`dev`, `build`, `lint`, `typecheck`, `test`) wired and cached.
- **`apps/api` (NestJS):** bootable Nest app with a `GET /health` endpoint, `database/` wired to TypeORM + Postgres, and empty `employees/ salary/ payroll/ payslips/ reporting/ common/` module folders as placeholders.
- **`apps/web` (Next.js App Router):** bootable app with Tailwind + shadcn/ui initialized and a placeholder home route that calls the API `/health`.
- **Shared packages:** `packages/types` (shared DTO/contract types), `packages/config` (shared `tsconfig`, eslint, tailwind presets), `packages/money` (minor-unit helpers) — created as importable, typechecked stubs.
- **Database plumbing:** TypeORM datasource config, migration runner command, and an empty seed entrypoint (`pnpm --filter api seed`) ready to be filled by domain specs.
- **Containerization:** `docker-compose.yml` bringing up `db` (Postgres 16) + `api` + `web`; Dockerfiles for `api` and `web`.
- **Base tooling:** TypeScript strict everywhere, shared ESLint + Prettier, and the testing harness (Vitest / `@nestjs/testing` + Testing Library) runnable even with zero domain tests.

## Project Structure (target)

Scaffolding produces exactly the tree defined in the root spec — see [Project Structure](../spec.md#project-structure). This spec owns *creating* it; domain specs own *filling in* their module folders.

## Key Rules

- **Foundation only:** no entities, business rules, or endpoints beyond `/health`. Module folders are empty placeholders owned by their domain specs.
- **Single source of structure:** the tree, stack versions, and commands come from the root [`spec.md`](../spec.md) — do not diverge; update the root spec first if they need to change (per its [Boundaries](../spec.md#boundaries)).
- **Clean checkout runs:** a fresh clone must reach a running stack via documented commands with no manual, undocumented steps.
- **Shared contracts are real packages:** `packages/types` and `packages/money` are imported by FE/BE from day one — no duplicated shapes, no local copies.
- **Strict from the start:** TypeScript strict, lint, and typecheck must pass on the empty skeleton before any domain work begins.

## Non-Negotiable Test Cases

- `docker compose up --build` brings up `db` + `api` + `web` from a clean checkout with no manual steps.
- `GET /health` on the running API returns a success response, and the web home route can reach it.
- `pnpm typecheck && pnpm lint && pnpm test` pass from the repo root on the empty skeleton.
- `pnpm --filter api migration:run` and `pnpm --filter api seed` execute successfully (even as no-ops) against the compose `db`.
- A type exported from `packages/types` can be imported by **both** `apps/web` and `apps/api` and typechecks.

## Success Criteria

- [ ] Monorepo boots: `pnpm install` then `pnpm dev` runs web + api in parallel via Turbo.
- [ ] `docker compose up --build` yields a healthy db + api + web from a clean checkout.
- [ ] Root `pnpm typecheck && pnpm lint && pnpm test` all pass on the scaffold.
- [ ] Migration and seed commands run against the compose Postgres without error.
- [ ] All five domain module folders exist under `apps/api/src/` as empty, importable placeholders.
- [ ] `packages/types`, `packages/config`, `packages/money` exist and are consumable by the apps.

## Out of Scope

- Any domain logic, entities, DTOs, or endpoints beyond `/health` (owned by domain specs).
- Real seed data content (~10k employees) — the *mechanism* is scaffolded here; the *content* lands with [`employees.md`](./employees.md) / [`salary-structure.md`](./salary-structure.md).
- CI pipeline configuration and deployment targets (see root Open Questions #6).

## Open Questions

- Package manager: pnpm assumed — confirm vs npm/yarn? (root Open Question #1)
- Component library: shadcn/ui assumed over MUI? (root Open Question #2)
- Backend test runner: Vitest or Jest (NestJS default)? (root Open Question #7)
- Deployment target for the Dockerfiles — local-only compose, or a specific host? (root Open Question #6)
