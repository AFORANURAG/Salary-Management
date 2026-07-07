# Documentation

Authoritative developer and contributor guide for the **Employee Salary
Management System** — a spec-driven, test-driven monorepo for ACME HR
operations. This is the documentation hub: it explains how the project thinks,
how to set it up, how to run and test it, and how to contribute. Agent
execution logs live outside this folder in [`../traces/`](../traces/).

> New here? Read [Philosophy](#philosophy) first, then jump to
> [Setup on a new machine](#setup-on-a-new-machine).

## Table of contents

- [Philosophy](#philosophy)
  - [Spec-driven development](#spec-driven-development)
  - [Test-driven development](#test-driven-development)
  - [Feedback loop](#feedback-loop)
- [Practices](#practices)
- [Architecture](#architecture)
  - [Monorepo layout](#monorepo-layout)
  - [Shared packages](#shared-packages)
  - [Technology stack](#technology-stack)
- [Setup on a new machine](#setup-on-a-new-machine)
- [Local development](#local-development)
  - [Running the stack](#running-the-stack)
  - [Database and migrations](#database-and-migrations)
  - [Seeding data](#seeding-data)
- [How to test](#how-to-test)
  - [Where the tests live](#where-the-tests-live)
  - [Unit, integration, and component tests](#unit-integration-and-component-tests)
  - [End-to-end (E2E) tests](#end-to-end-e2e-tests)
- [How to develop / contribute](#how-to-develop--contribute)
- [Coding style](#coding-style)
- [Conventions](#conventions)
- [Command reference](#command-reference)
- [Documentation map](#documentation-map)
  - [Spec index](#spec-index)
  - [Where each artifact lives](#where-each-artifact-lives)
- [Agent tooling](#agent-tooling)
- [Adding a new domain spec](#adding-a-new-domain-spec)
- [Related](#related)

## Philosophy

This repo is deliberately **spec-driven** and **test-driven**. Code is the last
thing written, not the first. The layers, in order of authority:

```
Requirements → Specs → Plans → Rules → Implementation → Traces → (evaluate against spec intent)
```

| Layer | Location | Answers |
|---|---|---|
| Requirements | [`requirements.md`](./requirements.md) | What does the business need? |
| Spec | [`spec.md`](./spec.md) + [`specs/*.md`](./specs/) | What must we build? (rules, API, success criteria) |
| Plan | [`plans/*.md`](./plans/) | In what order, with what commits? |
| ADR | [`decisions/ADR-*.md`](./decisions/) | Why this technical choice? |
| Implementation | `../apps/*`, `../packages/*` | The code |
| Trace | [`../traces/*.md`](../traces/) | What did the agent actually do? |

### Spec-driven development

Specs in [`specs/`](./specs/) are the **source of truth**. Before changing
course you update the spec, not the code. Every domain module maps to a spec:

- A spec defines the domain rules, API surface, non-negotiable test cases, and
  success criteria.
- A [plan](./plans/) turns a spec into ordered, verifiable tasks (T1, T2, …)
  with checkpoints and a commit sequence.
- Significant technical choices are recorded as [ADRs](./decisions/) so the
  "why" survives long after the "what".

Full workflow rules: [`../.ai/rules/spec-driven-workflow.md`](../.ai/rules/) ·
Skill: [`spec-driven-development`](../.ai/skills/spec-driven-development/SKILL.md).

### Test-driven development

Tests come **before** implementation. The per-task loop is strict:

1. Read the spec and the relevant plan task.
2. Write failing test(s) for the slice first — **RED**.
3. Implement the smallest complete slice to make them pass — **GREEN**.
4. Verify: `pnpm typecheck && pnpm lint && pnpm test`.
5. Update docs in the **same commit** if anything durable changed — a new
   command/script, practice, convention, dependency, env var, or feature.
6. Commit using [Conventional Commits](#conventions).
7. Append a trace entry to [`../traces/<spec>.md`](../traces/) **in the same commit**.
8. At checkpoints, evaluate against **spec intent**, not just passing tests.

Never reorder steps 2 and 3. Tests are bound to the task/spec; `build` makes
them go green. Skill: [`test-driven-development`](../.ai/skills/test-driven-development/SKILL.md).

### Feedback loop

What traces observe → rules encode → future work improves. Patterns, failures,
and workarounds discovered during a task are recorded in [`../traces/*.md`](../traces/),
then durable ones are promoted into [`../.ai/rules/`](../.ai/rules/) (and the
root [`AGENTS.md`](../AGENTS.md) / [`CLAUDE.md`](../CLAUDE.md)).

## Practices

Non-negotiables that apply to every change:

- **Money is always integer minor units.** Never floats/doubles for currency;
  use [`@salary-mgmt/money`](../packages/money) helpers and the `Minor` suffix.
- **Verify before commit:** `pnpm typecheck && pnpm lint && pnpm test` must pass.
- **Add/adjust tests with every domain change.** Do not skip or disable failing
  tests without approval.
- **Keep specs in sync with reality** — update the spec before changing course.
- **One logical unit per commit** using Conventional Commits; the trace entry
  ships in the same commit as the task.
- **Stage explicit paths** (`git add <path>`); never `git add -A` / `git add .`.
- **Never commit secrets** — only `.env.example` is committed.

**Ask first before:** DB schema changes, adding a dependency, monorepo
structure changes, or CI changes. Full detail: [`spec.md` → Boundaries](./spec.md#boundaries).

## Architecture

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
[`apps/api/AGENTS.md`](../apps/api/AGENTS.md), [`apps/web/AGENTS.md`](../apps/web/AGENTS.md).

### Shared packages

| Package | Purpose |
|---|---|
| [`@salary-mgmt/types`](../packages/types) | Shared FE↔BE contract types (built workspace package) |
| [`@salary-mgmt/config`](../packages/config) | Shared tsconfig / eslint / prettier / tailwind presets |
| [`@salary-mgmt/money`](../packages/money) | Integer minor-unit money helpers |
| [`@salary-mgmt/errors`](../packages/errors) | Shared error types + user-facing messages (FE) |
| [`@salary-mgmt/store`](../packages/store) | TanStack Query, API client, Zustand helpers (FE) |
| [`@salary-mgmt/ui`](../packages/ui) | Shared shadcn/ui component library (FE) |

> Import `@salary-mgmt/types` from the **built** package — never tsconfig-path
> into another app/package `src/`. FE packages (`errors`, `store`, `ui`) export
> TS source and are transpiled by Next.js via `transpilePackages`.

### Technology stack

Locked choices from [`requirements.md`](./requirements.md) and [`spec.md`](./spec.md).
Where an ADR exists, it is the authoritative record.

| Concern | Choice | ADR |
|---|---|---|
| Runtime | Node.js 20 LTS | — |
| Language | TypeScript (strict) | — |
| Monorepo | pnpm 9 + Turborepo 2 | [ADR-0001](./decisions/ADR-0001-pnpm-turborepo-monorepo.md) |
| Frontend | Next.js 14+ (App Router) | — |
| Component library | shadcn/ui via `@salary-mgmt/ui` (Radix + Tailwind) | [ADR-0002](./decisions/ADR-0002-shadcn-ui-component-library.md), [ADR-0004](./decisions/ADR-0004-shared-fe-packages.md) |
| Client data layer | TanStack Query + Zustand (`@salary-mgmt/store`) | [ADR-0004](./decisions/ADR-0004-shared-fe-packages.md) |
| Forms | react-hook-form + zod | [ADR-0006](./decisions/ADR-0006-react-hook-form-zod-fe-forms.md) |
| List/filter state | URL search params | [ADR-0007](./decisions/ADR-0007-url-search-params-employee-filters.md) |
| Backend | NestJS 10+ | [ADR-0005](./decisions/ADR-0005-nestjs-backend-framework.md) |
| Database | PostgreSQL 16 | — |
| ORM | TypeORM 0.3+ | — |
| Containerization | Docker + docker-compose | — |
| Unit/component/integration tests | Vitest (+ Testing Library, `@nestjs/testing`) | [ADR-0003](./decisions/ADR-0003-vitest-backend-test-runner.md), [ADR-0008](./decisions/ADR-0008-msw-integration-test-network-interception.md) |
| E2E tests | Playwright | — |
| CI | GitHub Actions (planned — no workflow committed yet) | — |

Full ADR list: [`decisions/README.md`](./decisions/README.md).

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
[`.env.example`](../.env.example).

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
your `.env` (see [`.env.example`](../.env.example)).

## How to test

The verification gate for any change is:

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Where the tests live

| Level | Tool | Location | Focus |
|---|---|---|---|
| Unit | Vitest | beside source, `*.spec.ts` | Pure domain logic: payroll calc, money helpers, effective-dated resolution |
| Integration | Vitest + `@nestjs/testing` / MSW | `apps/api` + `apps/web` | Module wiring, repository queries, payroll idempotency, pagination, network-intercepted flows ([ADR-0008](./decisions/ADR-0008-msw-integration-test-network-interception.md)) |
| Component | Vitest + Testing Library | `apps/web`, `*.test.tsx` | Critical UI: employee list (search/filter/paginate), payslip view |
| E2E | Playwright | [`apps/web/e2e/`](../apps/web/e2e) | Happy paths across auth, employees, salary structure, payroll, payslips, reporting, shell |

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

Playwright is configured at the repo root ([`playwright.config.ts`](../playwright.config.ts));
`testDir` is [`apps/web/e2e/`](../apps/web/e2e) and `baseURL` is
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

Shared E2E helpers live in [`apps/web/e2e/helpers.ts`](../apps/web/e2e/helpers.ts).

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

Record the branch under each phase in [`plans/<spec>.md`](./plans/) and in an
`## Implementation` table at the bottom of [`specs/<spec>.md`](./specs/).

**Then follow the [test-driven loop](#test-driven-development):** RED → GREEN →
verify → commit (with trace) → evaluate against spec intent.

## Coding style

TypeScript strict mode everywhere. Domain logic is pure and unit-testable;
framework wiring (controllers, modules, components) stays thin. Full reference
with example: [`spec.md` → Code Style](./spec.md#code-style).

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

Full detail: [`../.ai/rules/commit-conventions.md`](../.ai/rules/).

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
├── README.md           ← you are here (developer + contributor guide)
├── requirements.md     ← business requirements (input)
├── spec.md             ← root spec: stack, structure, boundaries
├── specs/              ← domain specs (what to build)
├── plans/              ← implementation plans (how to build)
└── decisions/          ← ADRs (why choices were made)
```

| Doc | Purpose |
|---|---|
| [requirements.md](./requirements.md) | Business problem, user needs, scope from stakeholders |
| [spec.md](./spec.md) | Cross-cutting technical spec — stack, commands, structure, boundaries, spec index |
| [specs/](./specs/) | Per-module specs owned by domain areas |
| [plans/](./plans/) | Ordered task breakdowns and commit sequences ([plans/README.md](./plans/README.md)) |
| [decisions/](./decisions/) | Architecture Decision Records ([decisions/README.md](./decisions/README.md)) |

### Spec index

| Spec | Owns | Plan | Trace |
|---|---|---|---|
| [spec.md](./spec.md) | Repo-wide objective, stack, boundaries | — | — |
| [specs/scaffolding.md](./specs/scaffolding.md) | Monorepo foundation | [plan](./plans/scaffolding.md) | [trace](../traces/scaffolding.md) |
| [specs/app-shell.md](./specs/app-shell.md) | App shell / navigation | [plan](./plans/app-shell.md) | [trace](../traces/app-shell.md) |
| [specs/hr-auth.md](./specs/hr-auth.md) | HR authentication (JWT) | [plan](./plans/hr-auth.md) | [trace](../traces/hr-auth.md) |
| [specs/employees.md](./specs/employees.md) | Employee CRUD, search, filter | [plan](./plans/employees.md) · [fe](./plans/employees-fe.md) | [trace](../traces/employees.md) |
| [specs/salary-structure.md](./specs/salary-structure.md) | Effective-dated salary structures | [plan](./plans/salary-structure.md) | [trace](../traces/salary-structure.md) |
| [specs/payroll.md](./specs/payroll.md) | Deterministic payroll generation | [plan](./plans/payroll.md) | [trace](../traces/payroll.md) |
| [specs/payroll-ops.md](./specs/payroll-ops.md) | Payroll operations | [plan](./plans/payroll-ops.md) | — |
| [specs/payslips.md](./specs/payslips.md) | Payslip view + history | [plan](./plans/payslips.md) | [trace](../traces/payslips.md) |
| [specs/reporting.md](./specs/reporting.md) | Aggregate compensation queries | [plan](./plans/reporting.md) | [trace](../traces/reporting.md) |
| [specs/employee-bulk-ops.md](./specs/employee-bulk-ops.md) | Bulk employee operations | [plan](./plans/employee-bulk-ops.md) | — |
| [specs/data-export.md](./specs/data-export.md) | Data export | [plan](./plans/data-export.md) | — |
| [specs/audit-log.md](./specs/audit-log.md) | Audit log | [plan](./plans/audit-log.md) | — |

### Where each artifact lives

| Artifact | Location | Answers |
|---|---|---|
| Requirements | `docs/requirements.md` | What does the business need? |
| Spec | `docs/specs/*.md` | What must we build? |
| Plan | `docs/plans/*.md` | In what order, with what commits? |
| ADR | `docs/decisions/ADR-*.md` | Why this technical choice? |
| Trace | `traces/*.md` | What did the agent actually do? |

**Flow:** requirements → spec → plan → implement → trace → evaluate against spec intent.

## Agent tooling

How humans and AI agents (Cursor, Claude Code, Codex, etc.) work on this repo.
The single source of truth for agent rules is the root [`AGENTS.md`](../AGENTS.md)
/ [`CLAUDE.md`](../CLAUDE.md). Reusable situational playbooks live in
[`../.ai/skills/`](../.ai/skills/); codified rules in [`../.ai/rules/`](../.ai/rules/).

| Skill | Use when | Path |
|---|---|---|
| Spec-driven development | Starting a feature with no spec | [`spec-driven-development`](../.ai/skills/spec-driven-development/SKILL.md) |
| Planning and task breakdown | Turning a spec into ordered tasks | [`planning-and-task-breakdown`](../.ai/skills/planning-and-task-breakdown/SKILL.md) |
| Test-driven development | Implementing logic, fixing a bug | [`test-driven-development`](../.ai/skills/test-driven-development/SKILL.md) |
| Code review and quality | Before merging any change | [`code-review-and-quality`](../.ai/skills/code-review-and-quality/SKILL.md) |
| Security and hardening | Untrusted input, auth, storage | [`security-and-hardening`](../.ai/skills/security-and-hardening/SKILL.md) |
| Observability | Logging, metrics, tracing | [`observability-and-instrumentation`](../.ai/skills/observability-and-instrumentation/SKILL.md) |
| Documentation and ADRs | Architectural decisions, API changes | [`documentation-and-adrs`](../.ai/skills/documentation-and-adrs/SKILL.md) |
| Git workflow and versioning | Committing, branching, conflicts | [`git-workflow-and-versioning`](../.ai/skills/git-workflow-and-versioning/SKILL.md) |
| Browser testing with DevTools | Building/debugging browser behavior | [`browser-testing-with-devtools`](../.ai/skills/browser-testing-with-devtools/SKILL.md) |

Per-spec execution logs and trace format: [`../traces/README.md`](../traces/README.md).

## Adding a new domain spec

1. Write `docs/specs/<name>.md` (see the [spec-driven-development skill](../.ai/skills/spec-driven-development/SKILL.md)).
2. Add a row to the index in [spec.md](./spec.md) and to [Spec index](#spec-index) above.
3. Create `docs/plans/<name>.md` with ordered tasks (see [plans/README.md](./plans/README.md)).
4. Create `traces/<name>.md` from the trace template (see [traces/README.md](../traces/README.md)).
5. Add an ADR in [decisions/](./decisions/) for any significant technical choice.
6. Commit: `docs: add spec and plan for <name>`.

## Related

- [Root README](../README.md) — quick start, commands, repo structure
- [Root AGENTS.md](../AGENTS.md) / [CLAUDE.md](../CLAUDE.md) — agent rules (single source of truth)
- [traces/](../traces/) — agent execution logs (observability, not authored docs)
- [apps/api/AGENTS.md](../apps/api/AGENTS.md) · [apps/web/AGENTS.md](../apps/web/AGENTS.md) — per-app conventions
