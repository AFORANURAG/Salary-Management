# Salary Management System

Employee Salary Management System MVP — monorepo scaffold for ACME HR operations.

## Quick start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker (optional for full stack)

cp .env.example .env
pnpm install
pnpm dev                    # web :3000 + api :3001 in parallel
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Run web + api via Turborepo |
| `pnpm --filter web dev` | Run web only |
| `pnpm --filter api dev` | Run api only |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm lint` | ESLint across workspace |
| `pnpm test` | Vitest across workspace |
| `pnpm --filter api migration:run` | Run TypeORM migrations |
| `pnpm --filter api seed` | Run seed (no-op scaffold) |
| `docker compose up -d db` | Start Postgres only |
| `docker compose up --build` | Full stack: db + api + web |

## Documentation layout

```
docs/
├── README.md           ← documentation index
├── requirements.md     ← business requirements (input)
├── spec.md             ← root spec: stack, structure, boundaries
├── specs/              ← domain specs (what to build)
├── plans/              ← implementation plans (how to build)
└── decisions/          ← ADRs (why choices were made)
```

## Spec index

| Spec | Owns |
|---|---|
| [spec.md](./docs/spec.md) | Repo-wide objective, stack, boundaries |
| [specs/scaffolding.md](./docs/specs/scaffolding.md) | Monorepo foundation (complete) |
| [specs/employees.md](./docs/specs/employees.md) | Employee CRUD, search, filter |
| [specs/salary-structure.md](./docs/specs/salary-structure.md) | Effective-dated salary structures |
| [specs/payroll.md](./docs/specs/payroll.md) | Deterministic payroll generation |
| [specs/payslips.md](./docs/specs/payslips.md) | Payslip view + history |
| [specs/reporting.md](./docs/specs/reporting.md) | Aggregate compensation queries |

## How the pieces fit together

| Artifact | Location | Answers |
|---|---|---|
| Requirements | `docs/requirements.md` | What does the business need? |
| Spec | `docs/specs/*.md` | What must we build? (rules, API, success criteria) |
| Plan | `docs/plans/*.md` | In what order, with what commits? |
| ADR | `docs/decisions/ADR-*.md` | Why this technical choice? |
| Trace | `traces/*.md` | What did the agent actually do? |

**Flow:** requirements → spec → plan → implement → trace → evaluate against spec intent.

## Structure

```
apps/web     → Next.js (App Router) + @salary-mgmt/ui + @salary-mgmt/store
apps/api     → NestJS + TypeORM + PostgreSQL
packages/    → types, config, money, errors, store, ui
docs/        → specs, plans, ADRs
traces/      → agent execution logs
```

## Tech stack

Node 20 · pnpm · Turborepo · Next.js · TanStack Query · Zustand · NestJS · PostgreSQL 16 · TypeORM · Vitest

See [ADR index](docs/decisions/README.md) for locked decisions.
