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
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm lint` | ESLint across workspace |
| `pnpm test` | Vitest across workspace |
| `pnpm --filter api migration:run` | Run TypeORM migrations |
| `pnpm --filter api seed` | Run seed (no-op scaffold) |
| `docker compose up --build` | Full stack: db + api + web |

## Structure

```
apps/web     → Next.js (App Router) + shadcn/ui + Tailwind
apps/api     → NestJS + TypeORM + PostgreSQL
packages/    → shared types, config presets, money helpers
docs/        → specs, plans, ADRs
traces/      → agent execution logs
```

## Documentation

- [Root spec](docs/spec.md)
- [Scaffolding spec](docs/specs/scaffolding.md)
- [Implementation plan](docs/plans/scaffolding.md)
- [ADRs](docs/decisions/README.md)

## Tech stack

Node 20 · pnpm · Turborepo · Next.js · NestJS · PostgreSQL 16 · TypeORM · Vitest

See [ADR index](docs/decisions/README.md) for locked decisions.
