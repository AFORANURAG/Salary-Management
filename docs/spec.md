# Spec: Employee Salary Management System (MVP)

> Source of truth derived from [`requirements.md`](./requirements.md). This root spec holds the cross-cutting decisions (objective, stack, structure, boundaries). Domain detail lives in per-module specs under [`specs/`](./specs/). This is a **living document** — update it before changing course, and reference the relevant section in PRs.

## Spec Index

| Spec | Owns | Maps to |
|---|---|---|
| **(this file)** | Objective, tech stack, commands, structure, code style, boundaries, global success criteria | repo-wide |
| [`specs/scaffolding.md`](./specs/scaffolding.md) | **Foundation** — monorepo, app shells, shared packages, docker-compose, base tooling (precedes all domain specs) | repo-wide skeleton |
| [`specs/employees.md`](./specs/employees.md) | Employee model, CRUD, search/filter/pagination | `apps/api/src/employees` |
| [`specs/salary-structure.md`](./specs/salary-structure.md) | Effective-dated/versioned salary structures | `apps/api/src/salary` |
| [`specs/payroll.md`](./specs/payroll.md) | Deterministic, idempotent payroll generation | `apps/api/src/payroll` |
| [`specs/payslips.md`](./specs/payslips.md) | Payslip view + salary history reconstruction | `apps/api/src/payslips` |
| [`specs/reporting.md`](./specs/reporting.md) | Aggregate compensation queries | `apps/api/src/reporting` |

## Objective

Replace ACME's spreadsheet-based salary management with a web system that lets a single trusted **HR Manager** manage salary data for ~10,000 employees and answer compensation questions accurately, quickly, and at scale.

**Primary user:** HR Manager (internal trusted operator). No employee self-service. No auth in MVP.

**The system must answer:**
- Monthly payroll cost by department / country / cost center.
- Salary breakdown (basic, allowances, deductions, net) for a specific employee.
- What we paid a specific employee across past pay periods.
- Fast search/filter/review across all employee salary records.

**Success looks like:** correct, deterministic, idempotent payroll runs over 10k employees with reconstructable history, responsive server-side search/filter/pagination, and maintainable, tested, containerized software with seeded data.

## Tech Stack

| Concern | Choice | Version (baseline) |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Package manager / monorepo | pnpm + Turborepo | pnpm 9, turbo 2 |
| Frontend | Next.js (App Router) + shared `@salary-mgmt/ui` (shadcn/ui) + Tailwind | Next 14+ |
| Client data layer | TanStack Query + Zustand (`@salary-mgmt/store`) | Query 5, Zustand 5 |
| Shared errors | `@salary-mgmt/errors` | — |
| Backend | NestJS | 10+ | [ADR-0005](decisions/ADR-0005-nestjs-backend-framework.md) |
| Database | PostgreSQL | 16 |
| ORM | TypeORM | 0.3+ |
| Containerization | Docker + docker-compose | — |
| FE testing | Vitest + Testing Library | — |
| BE testing | `@nestjs/testing` + Vitest (or Jest) | — |
| Language | TypeScript (strict) | 5+ |

> Component library: **shadcn/ui** chosen over MUI (assumption — see Open Questions).

## Commands

Run from repo root unless noted. (pnpm + turbo assumed.)

```
Install:        pnpm install
Dev (all):      pnpm dev                  # turbo runs web + api in parallel
Dev (web):      pnpm --filter web dev
Dev (api):      pnpm --filter api dev
Build:          pnpm build                # turbo build, cached
Lint:           pnpm lint
Lint (fix):     pnpm lint --fix
Typecheck:      pnpm typecheck
Test:           pnpm test
Test (cov):     pnpm test -- --coverage
DB up (local):  docker compose up -d db
Migrate:        pnpm --filter api migration:run
Seed:           pnpm --filter api seed     # seeds ~10k employees + structures
Full stack:     docker compose up --build
```

## Project Structure

```
salary-mgmt/
├── apps/
│   ├── web/                 → Next.js frontend (App Router)
│   │   ├── app/             → routes (employees, payroll, payslips)
│   │   └── lib/             → client utils, API wiring
│   └── api/                 → NestJS backend
│       └── src/
│           ├── employees/   → employee module (entity, service, controller)
│           ├── salary/      → salary-structure module (effective-dated)
│           ├── payroll/     → payroll generation (deterministic, idempotent)
│           ├── payslips/    → payslip + history module
│           ├── reporting/   → aggregate compensation queries
│           ├── database/    → TypeORM config, migrations, seeds
│           └── common/      → shared pipes, filters, money utils
├── packages/
│   ├── types/               → shared DTO/contract types (FE ↔ BE)
│   ├── config/              → shared tsconfig, eslint, tailwind presets
│   ├── money/               → minor-unit money helpers (shared)
│   ├── errors/              → shared error types and core messages (FE)
│   ├── store/               → TanStack Query, API client, Zustand helpers (FE)
│   └── ui/                  → shared shadcn/ui component library (FE)
├── docs/                    → requirements.md, spec.md, specs/, ADRs
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Code Style

TypeScript strict mode everywhere. Domain logic is pure and unit-testable; framework wiring (controllers, modules) stays thin. Money is **always** integer minor units — never floats.

```ts
// apps/api/src/payroll/payroll.calculator.ts
// Pure, deterministic. No DB, no I/O — trivially testable.

export interface SalaryComponentMinor {
  readonly code: string;       // e.g. "BASIC", "HRA", "PF"
  readonly amountMinor: number; // integer minor units (e.g. cents/paise)
  readonly kind: "EARNING" | "DEDUCTION";
}

export interface PayrollResultMinor {
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
}

export function computePayroll(
  components: readonly SalaryComponentMinor[],
): PayrollResultMinor {
  const grossMinor = sumBy(components, "EARNING");
  const deductionsMinor = sumBy(components, "DEDUCTION");
  return { grossMinor, deductionsMinor, netMinor: grossMinor - deductionsMinor };
}

function sumBy(
  components: readonly SalaryComponentMinor[],
  kind: SalaryComponentMinor["kind"],
): number {
  return components.reduce((acc, c) => (c.kind === kind ? acc + c.amountMinor : acc), 0);
}
```

**Conventions:**
- Naming: `PascalCase` types/classes, `camelCase` vars/functions, `SCREAMING_SNAKE` for component codes & enums-as-constants. Files `kebab-case.ts`; NestJS files use `*.service.ts`, `*.controller.ts`, `*.entity.ts`.
- DTOs validated at the boundary with `class-validator`; never trust raw input.
- All money fields/vars carry a `Minor` suffix to make units unmistakable.
- No floating-point arithmetic on currency, ever.
- Shared FE↔BE contracts live in `packages/types`, imported by both — no duplicated shapes.

## Testing Strategy

| Level | Tool | Where | Focus |
|---|---|---|---|
| Unit | Vitest | beside source (`*.spec.ts`) | Pure domain logic: payroll calc, money helpers, effective-dated resolution |
| Integration | `@nestjs/testing` + test Postgres | `apps/api/test` | Module wiring, repository queries, idempotency of payroll runs, pagination |
| Component | Vitest + Testing Library | `apps/web` (`*.test.tsx`) | Critical UI: employee list (search/filter/paginate), payslip view |
| E2E (stretch) | — | `e2e/` | Happy-path: create employee → set structure → run payroll → view payslip |

**Coverage bar:** ~80% on core domain logic (`payroll/`, `salary/`, `money`). UI/glue code not held to a blanket number. Prioritize meaningful behavior tests over coverage gaming.

Per-module "non-negotiable test cases" are defined in each domain spec.

## Boundaries

- **Always:** run `pnpm typecheck && pnpm lint && pnpm test` before committing; store money as integer minor units; validate all API inputs; add/adjust tests with every domain change; keep this spec and the relevant `specs/*` file in sync with reality.
- **Ask first:** changing the DB schema or migrations; adding a new dependency; altering the monorepo structure or shared `packages/*` contracts; changing CI config; bringing anything from "Out of Scope" into scope.
- **Never:** commit secrets or real employee data; use floats for money; delete/skip failing tests without approval; overwrite historical salary/payroll records; implement features not listed in a spec or the task list.

## Global Success Criteria

Cross-cutting, repo-level criteria. Module-specific criteria live in each domain spec.

- [ ] `docker compose up --build` brings up db + api + web from a clean checkout; `pnpm seed` populates ~10k employees.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass from the repo root.
- [ ] Core domain logic (`payroll`, `salary`, `money`) at ~80% coverage with each module's non-negotiable test cases passing.
- [ ] All four compensation questions in the Objective are answerable through the running system.

## Out of Scope (from requirements §6)

Tax filings/statutory compliance, variable CTC (bonuses/incentives), statutory engine (PF/ESIC/PT/TDS), country-specific tax rules, payment/bank disbursement, leave/attendance/overtime, auth/RBAC, full immutable audit trail, notifications, employee self-service, BI dashboards, PDF payslip export (stretch only).

## Open Questions

1. ~~**Package manager** — pnpm assumed. Confirm vs npm/yarn?~~ **Resolved:** [ADR-0001](decisions/ADR-0001-pnpm-turborepo-monorepo.md)
2. ~~**Component library** — shadcn/ui assumed over MUI. Confirm?~~ **Resolved:** [ADR-0002](decisions/ADR-0002-shadcn-ui-component-library.md)
3. **Multi-currency aggregates** — sum per-currency (no FX) assumed. Is a base-currency conversion ever needed for the "payroll cost by department" view? (see [`specs/reporting.md`](./specs/reporting.md))
4. **Cost center** — requirements mention "cost center" in a question but it's not in the employee fields list. Add `costCenter` to the model? (see [`specs/employees.md`](./specs/employees.md))
5. **Coverage target** — is ~80% on core domain the right bar, or do you want a specific repo-wide number?
6. **Deployment target** — docker-compose for local assumed; is there a specific cloud/host to design Dockerfiles for?
7. ~~**Test runner for backend** — Vitest or stick with Jest (NestJS default)?~~ **Resolved:** [ADR-0003](decisions/ADR-0003-vitest-backend-test-runner.md)
