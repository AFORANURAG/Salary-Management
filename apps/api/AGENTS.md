# AGENTS.md — `apps/api`

NestJS backend for the Employee Salary Management System.

## Owns

- `src/employees/` — employee module (owned by [`docs/specs/employees.md`](../../docs/specs/employees.md))
- `src/salary/` — salary-structure module ([`docs/specs/salary-structure.md`](../../docs/specs/salary-structure.md))
- `src/payroll/` — payroll generation ([`docs/specs/payroll.md`](../../docs/specs/payroll.md))
- `src/payslips/` — payslip + history ([`docs/specs/payslips.md`](../../docs/specs/payslips.md))
- `src/reporting/` — aggregate compensation queries ([`docs/specs/reporting.md`](../../docs/specs/reporting.md))
- `src/database/` — TypeORM datasource, migrations, seed entrypoint
- `src/common/` — shared pipes, filters, money utils
- `src/health/` — health check (scaffolding only)

Root spec: [`docs/spec.md`](../../docs/spec.md) · Scaffolding: [`docs/specs/scaffolding.md`](../../docs/specs/scaffolding.md) · ADR: [`docs/decisions/ADR-0005-nestjs-backend-framework.md`](../../docs/decisions/ADR-0005-nestjs-backend-framework.md)

## Stack

NestJS 10+ · TypeORM 0.3+ · PostgreSQL 16 · Vitest · `@salary-mgmt/types` · `@salary-mgmt/money`

## Commands

```bash
# From repo root — Postgres must be running first
docker compose up -d db

pnpm --filter api dev              # http://localhost:3001
pnpm --filter api build
pnpm --filter api test
pnpm --filter api typecheck
pnpm --filter api migration:run
pnpm --filter api seed
```

Database connection uses env vars from `.env` (see `.env.example`).

## Conventions

- **Module layout:** `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts` per NestJS conventions; files in `kebab-case.ts`.
- **Shared types:** import response/DTO contracts from `@salary-mgmt/types` — no duplicated shapes with the web app.
- **Money:** always integer minor units; use `@salary-mgmt/money` helpers; suffix fields/vars with `Minor`; never use floats.
- **Domain logic:** keep pure calculation/resolution logic in testable functions (e.g. `payroll.calculator.ts`); keep controllers and modules thin.
- **Validation:** DTOs validated at the boundary with `class-validator`; never trust raw input.
- **Migrations:** schema changes via TypeORM migrations in `src/database/migrations/`; ask before altering schema.

## Boundaries

- No auth/RBAC in MVP — single trusted HR operator assumed.
- Do not overwrite historical salary/payroll records.
- Do not implement endpoints or entities not covered by a spec or plan task.
- Ask before DB schema changes, new dependencies, or breaking `@salary-mgmt/types` contracts.

## Agent workflow

Read the relevant domain spec → plan task → implement → `pnpm typecheck && pnpm lint && pnpm test` → commit → append trace.

Rules: [`.ai/rules/`](../../.ai/rules/) · Skills: [`README.md`](../../README.md#agent-tooling)
