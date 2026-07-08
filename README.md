# Salary Management System

Authoritative developer and contributor guide for the **Employee Salary
Management System** — a spec-driven, test-driven pnpm + Turborepo monorepo for
ACME HR operations. This README explains how the project thinks, how to set it
up, how to run and test it, and how to contribute. Authored docs live in
[`docs/`](./docs); agent execution logs live in [`traces/`](./traces).

> New here? Start with [Architecture](#architecture) to orient yourself, then read [Philosophy](#philosophy) before jumping to [Setup on a new machine](#setup-on-a-new-machine).

## Table of contents

- [Architecture](#architecture)
  - [Technology stack](#technology-stack)
  - [Decisions](#decisions)
  - [Monorepo layout](#monorepo-layout)
  - [Shared packages](#shared-packages)
- [Philosophy](#philosophy)
  - [Spec-driven development](#spec-driven-development)
  - [Test-driven development](#test-driven-development)
  - [Feedback loop](#feedback-loop)
- [Practices](#practices)
- [Setup on a new machine](#setup-on-a-new-machine)
- [Local development](#local-development)
  - [Running the stack](#running-the-stack)
  - [Database and migrations](#database-and-migrations)
  - [Seeding data](#seeding-data)
- [How to test](#how-to-test)
  - [Where the tests live](#where-the-tests-live)
  - [Unit, integration, and component tests](#unit-integration-and-component-tests)
  - [End-to-end (E2E) tests](#end-to-end-e2e-tests)
- [Troubleshooting](#troubleshooting)
- [How to develop / contribute](#how-to-develop--contribute)
- [Coding style](#coding-style)
- [Conventions](#conventions)
- [Command reference](#command-reference)
- [Documentation map](#documentation-map)
  - [Spec index](#spec-index)
  - [Where each artifact lives](#where-each-artifact-lives)
- [AI development](#ai-development)
  - [Agent entry points](#agent-entry-points)
  - [Rules](#rules)
  - [Skills](#skills)
  - [Traces](#traces)
- [Adding a new domain spec](#adding-a-new-domain-spec)
- [Related](#related)

## Architecture

### Technology stack

Locked choices from [`docs/requirements.md`](./docs/requirements.md) and [`docs/spec.md`](./docs/spec.md).
Where an ADR exists, it is the authoritative record for the decision and the alternatives considered.

| Concern | Choice | ADR |
|---|---|---|
| Runtime | Node.js 20 LTS | — |
| Language | TypeScript (strict) | — |
| Monorepo | pnpm 9 + Turborepo 2 | [ADR-0001](./docs/decisions/ADR-0001-pnpm-turborepo-monorepo.md) |
| Frontend | Next.js 14+ (App Router) | — |
| Component library | shadcn/ui via `@salary-mgmt/ui` (Radix + Tailwind) | [ADR-0002](./docs/decisions/ADR-0002-shadcn-ui-component-library.md), [ADR-0004](./docs/decisions/ADR-0004-shared-fe-packages.md) |
| Client data layer | TanStack Query + Zustand (`@salary-mgmt/store`) | [ADR-0004](./docs/decisions/ADR-0004-shared-fe-packages.md) |
| Forms | react-hook-form + zod | [ADR-0006](./docs/decisions/ADR-0006-react-hook-form-zod-fe-forms.md) |
| List/filter state | URL search params | [ADR-0007](./docs/decisions/ADR-0007-url-search-params-employee-filters.md) |
| Backend | NestJS 10+ | [ADR-0005](./docs/decisions/ADR-0005-nestjs-backend-framework.md) |
| Database | PostgreSQL 16 | — |
| ORM | TypeORM 0.3+ | — |
| Containerization | Docker + docker-compose | — |
| Unit/component/integration tests | Vitest (+ Testing Library, `@nestjs/testing`) | [ADR-0003](./docs/decisions/ADR-0003-vitest-backend-test-runner.md), [ADR-0008](./docs/decisions/ADR-0008-msw-integration-test-network-interception.md) |
| E2E tests | Playwright | — |
| CI | GitHub Actions (planned) | — |

**Why NestJS for the backend?** The API backs a domain-heavy payroll system
with five bounded contexts (employees, salary, payroll, payslips, reporting)
that must stay independently testable. NestJS was chosen because:

- **SOLID by default** — each domain is an isolated `Module` with its own
  controller, service, and entity; new domains add modules without touching
  existing ones; constructor DI inverts dependencies so services are swappable
  in tests.
- **Structure is given, not invented** — controllers stay thin HTTP adapters,
  services own domain logic, pipes/filters/guards centralize validation and
  cross-cutting concerns. Multiple contributors (and agents) navigate the same
  predictable layout without debate.
- **TDD-ready** — `@nestjs/testing` builds isolated module graphs; services
  unit-test by mocking injected dependencies; works with Vitest
  ([ADR-0003](./docs/decisions/ADR-0003-vitest-backend-test-runner.md)) for a
  single test runner across the whole monorepo.
- **TypeScript-first** — decorators + metadata for declarative wiring; strong
  typing for DTOs, entities, and service contracts aligns with the shared
  `@salary-mgmt/types` package.
- **Ecosystem fit** — official `@nestjs/typeorm` module, conventional file
  naming (`*.module.ts`, `*.service.ts`, …) documented in the root spec, mature
  patterns for migrations and seed scripts.

→ Full rationale and alternatives considered: [ADR-0005](./docs/decisions/ADR-0005-nestjs-backend-framework.md).

### Decisions

Significant technical choices are recorded as Architecture Decision Records
(ADRs) in [`docs/decisions/`](./docs/decisions/). Each ADR captures the
context, the decision, the rationale, and the alternatives that were rejected —
so the "why" survives long after the "what".

| ADR | Decision |
|---|---|
| [ADR-0001](./docs/decisions/ADR-0001-pnpm-turborepo-monorepo.md) | pnpm + Turborepo as the monorepo toolchain |
| [ADR-0002](./docs/decisions/ADR-0002-shadcn-ui-component-library.md) | shadcn/ui (copy-paste into `packages/ui`) as the component library |
| [ADR-0003](./docs/decisions/ADR-0003-vitest-backend-test-runner.md) | Vitest (not Jest) as the backend test runner |
| [ADR-0004](./docs/decisions/ADR-0004-shared-fe-packages.md) | Shared FE packages: `errors`, `store`, `ui` |
| [ADR-0005](./docs/decisions/ADR-0005-nestjs-backend-framework.md) | NestJS as the backend framework |
| [ADR-0006](./docs/decisions/ADR-0006-react-hook-form-zod-fe-forms.md) | react-hook-form + zod for frontend forms |
| [ADR-0007](./docs/decisions/ADR-0007-url-search-params-employee-filters.md) | URL search params for employee list filter/search state |
| [ADR-0008](./docs/decisions/ADR-0008-msw-integration-test-network-interception.md) | MSW v2 (`msw/node`) for integration test network interception |

Full index: [`docs/decisions/README.md`](./docs/decisions/README.md).

### Monorepo layout

pnpm workspaces + Turborepo. Two apps, several shared packages.

```
salary-mgmt/
├── apps/
│   ├── web/                 → Next.js frontend (App Router)
│   │   ├── app/             → routes (employees, payroll, payslips, reporting)
│   │   ├── components/      → app-level composed components
│   │   ├── lib/             → client utils, API wiring
│   │   ├── middleware.ts    → route protection (auth redirect)
│   │   └── e2e/             → Playwright end-to-end tests
│   └── api/                 → NestJS backend
│       └── src/
│           ├── auth/        → JWT auth (login, guards) for the HR operator
│           ├── hr-users/    → HR user accounts (seeded admin)
│           ├── employees/   → employee module (entity, service, controller)
│           ├── salary/      → salary-structure module (effective-dated)
│           ├── payroll/     → payroll generation (deterministic, idempotent)
│           ├── payslips/    → payslip + history module
│           ├── reporting/   → aggregate compensation queries
│           ├── database/    → TypeORM data-source, migrations, seed
│           ├── health/      → health check endpoint
│           └── common/      → shared pipes, filters, money utils
├── packages/                → types, config, money, errors, store, ui
├── docs/                    → requirements, spec, specs/, plans/, decisions/
├── traces/                  → agent execution logs
├── docker-compose.yml       → db + api + web
├── turbo.json               → task pipeline
└── pnpm-workspace.yaml
```

Per-area conventions live in nested `AGENTS.md` files:
[`apps/api/AGENTS.md`](./apps/api/AGENTS.md), [`apps/web/AGENTS.md`](./apps/web/AGENTS.md).

### Shared packages

| Package | Purpose |
|---|---|
| [`@salary-mgmt/types`](./packages/types) | Shared FE↔BE contract types (built workspace package) |
| [`@salary-mgmt/config`](./packages/config) | Shared tsconfig / eslint / prettier / tailwind presets |
| [`@salary-mgmt/money`](./packages/money) | Integer minor-unit money helpers |
| [`@salary-mgmt/errors`](./packages/errors) | Shared error types + user-facing messages (FE) |
| [`@salary-mgmt/store`](./packages/store) | TanStack Query, API client, Zustand helpers (FE) |
| [`@salary-mgmt/ui`](./packages/ui) | Shared shadcn/ui component library (FE) |

> Import `@salary-mgmt/types` from the **built** package — never tsconfig-path
> into another app/package `src/`. FE packages (`errors`, `store`, `ui`) export
> TS source and are transpiled by Next.js via `transpilePackages`.

## Philosophy

This repo is deliberately **spec-driven** and **test-driven**. Code is the last
thing written, not the first. The layers, in order of authority:

```
Requirements → Specs → Plans → Rules → Implementation → Traces → (evaluate against spec intent)
```

| Layer | Location | Answers |
|---|---|---|
| Requirements | [`docs/requirements.md`](./docs/requirements.md) | What does the business need? |
| Spec | [`docs/spec.md`](./docs/spec.md) + [`docs/specs/*.md`](./docs/specs/) | What must we build? (rules, API, success criteria) |
| Plan | [`docs/plans/*.md`](./docs/plans/) | In what order, with what commits? |
| ADR | [`docs/decisions/ADR-*.md`](./docs/decisions/) | Why this technical choice? |
| Implementation | `apps/*`, `packages/*` | The code |
| Trace | [`traces/*.md`](./traces/) | What did the agent actually do? |

### Spec-driven development

Specs in [`docs/specs/`](./docs/specs/) are the **source of truth**. Before
changing course you update the spec, not the code. Every domain module maps to a
spec:

- A spec defines the domain rules, API surface, non-negotiable test cases, and
  success criteria.
- A [plan](./docs/plans/) turns a spec into ordered, verifiable tasks (T1, T2, …)
  with checkpoints and a commit sequence.
- Significant technical choices are recorded as [ADRs](./docs/decisions/) so the
  "why" survives long after the "what".

Full workflow rules: [`.ai/rules/spec-driven-workflow.md`](./.ai/rules/spec-driven-workflow.md) ·
Skill: [`spec-driven-development`](./.ai/skills/spec-driven-development/SKILL.md).

### Test-driven development

Tests come **before** implementation. The per-task loop is strict:

1. Read the spec and the relevant plan task.
2. Write failing test(s) for the slice first — **RED**.
3. Implement the smallest complete slice to make them pass — **GREEN**.
4. Verify: `pnpm typecheck && pnpm lint && pnpm test`.
5. Update docs in the **same commit** if anything durable changed — a new
   command/script, practice, convention, dependency, env var, or feature.
6. Commit using [Conventional Commits](#conventions).
7. Append a trace entry to [`traces/<spec>.md`](./traces/) **in the same commit**.
8. At checkpoints, evaluate against **spec intent**, not just passing tests.

Never reorder steps 2 and 3. Tests are bound to the task/spec; `build` makes
them go green. Skill: [`test-driven-development`](./.ai/skills/test-driven-development/SKILL.md).

### Feedback loop

What traces observe → rules encode → future work improves. Patterns, failures,
and workarounds discovered during a task are recorded in [`traces/*.md`](./traces/),
then durable ones are promoted into [`.ai/rules/`](./.ai/rules/) (and the
root [`AGENTS.md`](./AGENTS.md) / [`CLAUDE.md`](./CLAUDE.md)).

## Practices

Non-negotiables that apply to every change:

- **Money is always integer minor units.** Never floats/doubles for currency;
  use [`@salary-mgmt/money`](./packages/money) helpers and the `Minor` suffix.
- **Verify before commit:** `pnpm typecheck && pnpm lint && pnpm test` must pass.
- **Add/adjust tests with every domain change.** Do not skip or disable failing
  tests without approval.
- **Keep specs in sync with reality** — update the spec before changing course.
- **One logical unit per commit** using Conventional Commits; the trace entry
  ships in the same commit as the task.
- **Stage explicit paths** (`git add <path>`); never `git add -A` / `git add .`.
- **Never commit secrets** — only `.env.example` is committed.

**Ask first before:** DB schema changes, adding a dependency, monorepo
structure changes, or CI changes. Full detail: [`spec.md` → Boundaries](./docs/spec.md#boundaries).

## Setup on a new machine

**Prerequisites:** Node 20+, pnpm 9+, Docker (for Postgres / full stack).

```bash
# 1. Clone and enter the repo
git clone <repo-url> salary-mgmt
cd salary-mgmt

# 2. Enable pnpm if you don't have it (Corepack ships with Node 20)
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 3. Copy environment defaults (never commit your .env)
cp .env.example .env

# 4. Install all workspace dependencies
pnpm install

# 5. Start Postgres (TypeORM connects on API boot)
docker compose up -d db

# 6. Prepare the database: apply migrations + seed ~10k employees + admin user
pnpm db:setup       # = migration:run then seed (idempotent; safe to re-run)

# 7. Run everything
pnpm dev            # web :3000 + api :3001
```

`pnpm db:setup` is the one-shot first-time DB bootstrap. It runs migrations and
then the seed; both are idempotent, so re-running it to pick up new migrations
is safe.

Web: <http://localhost:3000> · API: <http://localhost:3001>. Environment
variables (DB, JWT, CORS, seed admin, `NEXT_PUBLIC_API_URL`) are documented in
[`.env.example`](./.env.example).

> Postgres must be running before the API — TypeORM connects on boot and
> `/health` is unavailable without a live database.

## Local development

### Running the stack

```bash
pnpm dev                     # web + api in parallel (Turborepo)
pnpm --filter web dev        # web only  → http://localhost:3000
pnpm --filter api dev        # api only  → http://localhost:3001

docker compose up -d db      # Postgres only (typical local dev)
docker compose up --build    # full stack in containers: db + api + web
```

### Database and migrations

Migrations are TypeORM, driven from `apps/api/src/database/data-source.ts`.
Schema changes go through migrations — **ask before changing the schema**. All
DB commands require Postgres running (`docker compose up -d db`).

| Command | What it does | When to use |
|---|---|---|
| `pnpm db:setup` | `migration:run` then `seed` (repo-root shortcut) | First-time setup; after pulling new migrations |
| `pnpm migrate` | Apply pending migrations (root shortcut for `--filter api migration:run`) | Update an existing DB to the latest schema |
| `pnpm db:reset` | `schema:drop` → `migration:run` → `seed` | Wipe and rebuild a clean DB before re-testing flows |
| `pnpm --filter api migration:run` | Apply pending migrations | Same as `pnpm migrate` |
| `pnpm --filter api migration:generate` | Generate a migration from entity changes | After editing an entity (then review + commit it) |
| `pnpm --filter api migration:revert` | Roll back the most recent migration | Undo the last migration during development |
| `pnpm --filter api schema:drop` | Drop all tables (destructive) | Manual clean slate; prefer `db:reset` |

**Full clean slate** (drops the Postgres volume too):

```bash
docker compose down -v        # remove the db container AND its data volume
docker compose up -d db
pnpm db:setup
```

### Seeding data

```bash
pnpm seed                    # root shortcut → ~10k employees + seed admin
pnpm --filter api seed       # same, run from the api package
```

The seed inserts ~10k employees and the admin HR user — it does **not** generate
salary structures or payroll runs (create those through the app/API). It is
idempotent: it skips employee inserts once ~10k rows exist and skips the admin
if it already exists. To force a fresh dataset, run `pnpm db:reset`.
Seed admin credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in
your `.env` (see [`.env.example`](./.env.example)).

## How to test

The verification gate for any change is:

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Where the tests live

| Level | Tool | Location | Focus |
|---|---|---|---|
| Unit | Vitest | beside source, `*.spec.ts` | Pure domain logic: payroll calc, money helpers, effective-dated resolution |
| Integration | Vitest + `@nestjs/testing` / MSW | `apps/api` + `apps/web` | Module wiring, repository queries, payroll idempotency, pagination, network-intercepted flows ([ADR-0008](./docs/decisions/ADR-0008-msw-integration-test-network-interception.md)) |
| Component | Vitest + Testing Library | `apps/web`, `*.test.tsx` | Critical UI: employee list (search/filter/paginate), payslip view |
| E2E | Playwright | [`apps/web/e2e/`](./apps/web/e2e) | Happy paths across auth, employees, salary structure, payroll, payslips, reporting, shell |

**Coverage bar:** ~80% on core domain logic (`payroll/`, `salary/`, `money`).
UI/glue code is not held to a blanket number — prioritize meaningful behavior
tests. Per-module "non-negotiable test cases" are defined in each domain spec.

### Unit, integration, and component tests

```bash
pnpm test                        # Vitest across the whole workspace (via Turbo)
pnpm --filter api test           # backend only
pnpm --filter web test           # frontend only
pnpm --filter web test -- --watch   # watch mode while developing
```

> Coverage reporting is **not wired yet** — no `@vitest/coverage-v8` provider is
> installed. Add it (a new dependency — ask first) before using `--coverage`.

### End-to-end (E2E) tests

Playwright is configured at the repo root ([`playwright.config.ts`](./playwright.config.ts));
`testDir` is [`apps/web/e2e/`](./apps/web/e2e) and `baseURL` is
`http://localhost:3000`. The app must be running (and the API/DB reachable)
before you run E2E.

```bash
# Terminal 1 — bring up dependencies and the app
docker compose up -d db
pnpm db:setup                 # migrate + seed (use pnpm db:reset for a clean run)
pnpm dev

# Terminal 2 — run the E2E suite
pnpm test:e2e                    # all specs (chromium)
pnpm test:e2e apps/web/e2e/payroll        # a single folder
pnpm exec playwright test --ui             # interactive UI mode
pnpm exec playwright show-report           # open the last HTML report
```

Shared E2E helpers live in [`apps/web/e2e/helpers.ts`](./apps/web/e2e/helpers.ts).

## Troubleshooting

Common first-run and local-dev issues. Most stem from Postgres not running or
`.env` not matching `docker-compose.yml`.

| Symptom | Likely cause | Fix |
|---|---|---|
| API exits on boot / `/health` unreachable | Postgres not running | `docker compose up -d db`, then restart the API |
| API can't connect to DB (`ECONNREFUSED`, auth failed) | `.env` DB vars don't match `docker-compose.yml` | Ensure `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER=salary`, `DB_PASSWORD=salary`, `DB_NAME=salary_mgmt` |
| `port already in use` (3000/3001/5432) | Another process (or a stale container) holds the port | Stop it, or change `PORT` / `--port` (API/web) or the `db` port mapping |
| Migration errors ("relation already exists" / out of sync) | DB in a partial state | `pnpm db:reset` (drop → migrate → seed), or full reset with `docker compose down -v && docker compose up -d db && pnpm db:setup` |
| `pnpm seed` prints "Seed skipped" | Seed is idempotent; ~10k employees already present | Expected. To reseed from scratch use `pnpm db:reset` |
| Login fails after seeding | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` unset when seeding | Set them in `.env`, then reseed (`pnpm db:reset` or re-run `pnpm seed`) |
| Web calls fail / CORS errors | `NEXT_PUBLIC_API_URL` or `CORS_ORIGIN` misconfigured | Set `NEXT_PUBLIC_API_URL=http://localhost:3001` and `CORS_ORIGIN=http://localhost:3000`; restart web + api |
| E2E can't reach the app | App not running or DB not seeded | `docker compose up -d db && pnpm db:setup && pnpm dev` before `pnpm test:e2e` |
| Type errors referencing `@salary-mgmt/*` after pulling | Workspace deps/built types stale | `pnpm install`, then `pnpm build` (rebuilds the `types` package) |

## How to develop / contribute

Every spec/feature is implemented across **stacked branches** — one per phase.
No single branch should grow into a 30+ file PR. Standard backend split:

| Branch suffix | Contains |
|---|---|
| `-pr1-db-models` | Entity, migration, shared type contracts, plan, trace template |
| `-pr2-test-harness` | Vitest config, test setup, RED unit + integration specs |
| `-pr3-implementation` | DTOs, service, controller, module — tests go GREEN |
| `-pr4-<concern>` | Versioning, housekeeping, or a cross-cutting concern |

Frontend specs follow the same pattern (types → hooks → components → wiring).

**Branch creation protocol (always in this order):**

1. `git checkout main && git pull origin main`
2. If the new branch intentionally stacks on an unmerged branch, state the base
   branch and the reason before branching.
3. `git checkout -b <branch-name>`

Record the branch under each phase in [`docs/plans/<spec>.md`](./docs/plans/) and
in an `## Implementation` table at the bottom of [`docs/specs/<spec>.md`](./docs/specs/).

**Then follow the [test-driven loop](#test-driven-development):** RED → GREEN →
verify → commit (with trace) → evaluate against spec intent.

## Coding style

TypeScript strict mode everywhere. Domain logic is pure and unit-testable;
framework wiring (controllers, modules, components) stays thin. Full reference
with example: [`spec.md` → Code Style](./docs/spec.md#code-style).

- No `any` unless absolutely necessary. Top-level imports only (no dynamic
  `await import()` / `import("pkg").Type` for types).
- Money is **always** integer minor units; all money fields/vars carry a
  `Minor` suffix; no floating-point arithmetic on currency, ever.
- DTOs validated at the boundary with `class-validator` — never trust raw input.
- Shared FE↔BE contracts live in `packages/types`, imported by both — no
  duplicated shapes.
- Web: server components by default; `"use client"` only when needed. Use
  `next.config.mjs` (not `.ts`) on Next.js 14; keep `output: "standalone"`.
- Read files in full before wide-ranging changes — don't rely on search snippets.

## Conventions

**Naming:** `PascalCase` types/classes, `camelCase` vars/functions,
`SCREAMING_SNAKE` for component codes and enums-as-constants. Files are
`kebab-case.ts`; NestJS files use `*.service.ts`, `*.controller.ts`,
`*.entity.ts`, `*.module.ts`.

**Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

<optional body — why, not what>
```

- Types: `feat`, `fix`, `chore`, `docs`, `ci`, `test`, `refactor`.
- Scopes match repo layout: `(web)`, `(api)`, `(config)`, `(types)`, `(money)`,
  `(errors)`, `(store)`, `(ui)`; omit for repo-wide changes.
- One logical unit per commit; each commit should build. Trace entries ship in
  the same commit as the task. Stage explicit paths only.

Full detail: [`.ai/rules/commit-conventions.md`](./.ai/rules/commit-conventions.md).

## Command reference

Run from the repo root unless noted.

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Run web (:3000) + api (:3001) via Turborepo |
| `pnpm --filter web dev` | Run web only |
| `pnpm --filter api dev` | Run api only |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm lint` | ESLint across workspace |
| `pnpm test` | Vitest across workspace |
| `pnpm test:e2e` | Playwright E2E suite (app must be running) |
| `pnpm db:setup` | First-time DB bootstrap: migrate + seed |
| `pnpm db:reset` | Clean slate: drop schema → migrate → seed |
| `pnpm migrate` | Apply pending migrations (root shortcut) |
| `pnpm seed` | Seed ~10k employees + admin (root shortcut) |
| `pnpm --filter api migration:run` | Apply TypeORM migrations |
| `pnpm --filter api migration:generate` | Generate a migration from entity changes |
| `pnpm --filter api migration:revert` | Roll back the most recent migration |
| `pnpm --filter api schema:drop` | Drop all tables (destructive) |
| `pnpm --filter api seed` | Seed ~10k employees + admin |
| `docker compose up -d db` | Start Postgres only |
| `docker compose down -v` | Stop stack and delete the DB volume (full reset) |
| `docker compose up --build` | Full stack: db + api + web |

## Documentation map

```
docs/
├── requirements.md     ← business requirements (input)
├── spec.md             ← root spec: stack, structure, boundaries
├── specs/              ← domain specs (what to build)
├── plans/              ← implementation plans (how to build)
└── decisions/          ← ADRs (why choices were made)
```

| Doc | Purpose |
|---|---|
| [docs/requirements.md](./docs/requirements.md) | Business problem, user needs, scope from stakeholders |
| [docs/spec.md](./docs/spec.md) | Cross-cutting technical spec — stack, commands, structure, boundaries, spec index |
| [docs/specs/](./docs/specs/) | Per-module specs owned by domain areas |
| [docs/plans/](./docs/plans/) | Ordered task breakdowns and commit sequences ([plans/README.md](./docs/plans/README.md)) |
| [docs/decisions/](./docs/decisions/) | Architecture Decision Records ([decisions/README.md](./docs/decisions/README.md)) |

### Spec index

| Spec | Owns | Plan | Trace |
|---|---|---|---|
| [spec.md](./docs/spec.md) | Repo-wide objective, stack, boundaries | — | — |
| [specs/scaffolding.md](./docs/specs/scaffolding.md) | Monorepo foundation | [plan](./docs/plans/scaffolding.md) | [trace](./traces/scaffolding.md) |
| [specs/app-shell.md](./docs/specs/app-shell.md) | App shell / navigation | [plan](./docs/plans/app-shell.md) | [trace](./traces/app-shell.md) |
| [specs/hr-auth.md](./docs/specs/hr-auth.md) | HR authentication (JWT) | [plan](./docs/plans/hr-auth.md) | [trace](./traces/hr-auth.md) |
| [specs/employees.md](./docs/specs/employees.md) | Employee CRUD, search, filter | [plan](./docs/plans/employees.md) · [fe](./docs/plans/employees-fe.md) | [trace](./traces/employees.md) |
| [specs/salary-structure.md](./docs/specs/salary-structure.md) | Effective-dated salary structures | [plan](./docs/plans/salary-structure.md) | [trace](./traces/salary-structure.md) |
| [specs/payroll.md](./docs/specs/payroll.md) | Deterministic payroll generation | [plan](./docs/plans/payroll.md) | [trace](./traces/payroll.md) |
| [specs/payroll-ops.md](./docs/specs/payroll-ops.md) | Payroll operations | [plan](./docs/plans/payroll-ops.md) | — |
| [specs/payslips.md](./docs/specs/payslips.md) | Payslip view + history | [plan](./docs/plans/payslips.md) | [trace](./traces/payslips.md) |
| [specs/reporting.md](./docs/specs/reporting.md) | Aggregate compensation queries | [plan](./docs/plans/reporting.md) | [trace](./traces/reporting.md) |
| [specs/employee-bulk-ops.md](./docs/specs/employee-bulk-ops.md) | Bulk employee operations | [plan](./docs/plans/employee-bulk-ops.md) | — |
| [specs/data-export.md](./docs/specs/data-export.md) | Data export | [plan](./docs/plans/data-export.md) | — |
| [specs/audit-log.md](./docs/specs/audit-log.md) | Audit log | [plan](./docs/plans/audit-log.md) | — |

### Where each artifact lives

| Artifact | Location | Answers |
|---|---|---|
| Requirements | `docs/requirements.md` | What does the business need? |
| Spec | `docs/specs/*.md` | What must we build? |
| Plan | `docs/plans/*.md` | In what order, with what commits? |
| ADR | `docs/decisions/ADR-*.md` | Why this technical choice? |
| Trace | `traces/*.md` | What did the agent actually do? |

**Flow:** requirements → spec → plan → implement → trace → evaluate against spec intent.

## AI development

This repo is designed for AI-assisted development. The instructions, rules, and
skills below are the authoritative interface for any AI agent (Claude Code,
Cursor, Codex, Gemini, Copilot, etc.) working here.

### Agent entry points

| File / Folder | Purpose |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Primary instructions for **Claude Code** — read on every session start |
| [`AGENTS.md`](./AGENTS.md) | Tool-agnostic agent rules — identical content, broader compatibility |
| [`apps/api/AGENTS.md`](./apps/api/AGENTS.md) | API-specific conventions (NestJS, TypeORM, migrations) |
| [`apps/web/AGENTS.md`](./apps/web/AGENTS.md) | Web-specific conventions (Next.js App Router, MSW, Playwright) |
| [`.ai/rules/`](./.ai/rules/) | Codified project rules loaded by agents on demand |
| [`.ai/skills/`](./.ai/skills/) | Reusable situational playbooks (loaded per phase, not always) |

> `CLAUDE.md` and `AGENTS.md` are kept in sync. When one changes, update the other.

### Rules

Rules in [`.ai/rules/`](./.ai/rules/) encode durable patterns and constraints
discovered during development. They are referenced from `CLAUDE.md` / `AGENTS.md`
and promoted from `traces/` when a pattern proves general.

| Rule | Purpose |
|---|---|
| [`.ai/rules/spec-driven-workflow.md`](./.ai/rules/spec-driven-workflow.md) | Full per-task loop (spec → plan → RED → GREEN → verify → commit → trace) |
| [`.ai/rules/commit-conventions.md`](./.ai/rules/commit-conventions.md) | Conventional Commits format, scope list, staging protocol |
| [`.ai/rules/scaffolding-learnings.md`](./.ai/rules/scaffolding-learnings.md) | Local-dev and monorepo gotchas discovered during scaffolding |

### Skills

Skills in [`.ai/skills/`](./.ai/skills/) are situational playbooks — load the
relevant `SKILL.md` at the start of each phase. They are not always loaded;
only when the work matches the phase.

| Skill | Use when | Path |
|---|---|---|
| Spec-driven development | Starting a feature with no spec | [`.ai/skills/spec-driven-development/SKILL.md`](./.ai/skills/spec-driven-development/SKILL.md) |
| Planning and task breakdown | Turning a spec into ordered tasks | [`.ai/skills/planning-and-task-breakdown/SKILL.md`](./.ai/skills/planning-and-task-breakdown/SKILL.md) |
| Test-driven development | Implementing logic, fixing a bug | [`.ai/skills/test-driven-development/SKILL.md`](./.ai/skills/test-driven-development/SKILL.md) |
| Code review and quality | Before merging any change | [`.ai/skills/code-review-and-quality/SKILL.md`](./.ai/skills/code-review-and-quality/SKILL.md) |
| Security and hardening | Untrusted input, auth, storage | [`.ai/skills/security-and-hardening/SKILL.md`](./.ai/skills/security-and-hardening/SKILL.md) |
| Observability and instrumentation | Logging, metrics, tracing | [`.ai/skills/observability-and-instrumentation/SKILL.md`](./.ai/skills/observability-and-instrumentation/SKILL.md) |
| Documentation and ADRs | Architectural decisions, API changes | [`.ai/skills/documentation-and-adrs/SKILL.md`](./.ai/skills/documentation-and-adrs/SKILL.md) |
| Git workflow and versioning | Committing, branching, conflicts | [`.ai/skills/git-workflow-and-versioning/SKILL.md`](./.ai/skills/git-workflow-and-versioning/SKILL.md) |
| Browser testing with DevTools | Building/debugging browser behavior | [`.ai/skills/browser-testing-with-devtools/SKILL.md`](./.ai/skills/browser-testing-with-devtools/SKILL.md) |

### Traces

Every task an agent completes appends a trace entry to [`traces/<spec>.md`](./traces/)
**in the same commit**. Traces are the observability layer — what actually ran,
what was unexpected, what was promoted to a rule. Format and template:
[`traces/README.md`](./traces/README.md).

## Adding a new domain spec

1. Write `docs/specs/<name>.md` (see the [spec-driven-development skill](./.ai/skills/spec-driven-development/SKILL.md)).
2. Add a row to the index in [docs/spec.md](./docs/spec.md) and to [Spec index](#spec-index) above.
3. Create `docs/plans/<name>.md` with ordered tasks (see [plans/README.md](./docs/plans/README.md)).
4. Create `traces/<name>.md` from the trace template (see [traces/README.md](./traces/README.md)).
5. Add an ADR in [docs/decisions/](./docs/decisions/) for any significant technical choice.
6. Commit: `docs: add spec and plan for <name>`.

## Related

- [docs/](./docs/) — authored specs, plans, ADRs (see [spec.md](./docs/spec.md))
- [AGENTS.md](./AGENTS.md) / [CLAUDE.md](./CLAUDE.md) — agent rules (single source of truth)
- [traces/](./traces/) — agent execution logs (observability, not authored docs)
- [apps/api/AGENTS.md](./apps/api/AGENTS.md) · [apps/web/AGENTS.md](./apps/web/AGENTS.md) — per-app conventions
