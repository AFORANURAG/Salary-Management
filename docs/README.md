# Documentation

Authoritative project documentation for the Employee Salary Management System. Agent execution logs live outside this folder in [`../traces/`](../traces/).

## Layout

```
docs/
├── README.md           ← you are here
├── requirements.md     ← business requirements (input)
├── spec.md             ← root spec: stack, structure, boundaries
├── specs/              ← domain specs (what to build)
├── plans/              ← implementation plans (how to build)
└── decisions/          ← ADRs (why choices were made)
```

## Start here

| Doc | Purpose |
|---|---|
| [requirements.md](./requirements.md) | Business problem, user needs, scope from stakeholders |
| [spec.md](./spec.md) | Cross-cutting technical spec — stack, commands, structure, boundaries, spec index |
| [specs/](./specs/) | Per-module specs owned by domain areas (`employees`, `payroll`, etc.) |
| [plans/](./plans/) | Ordered task breakdowns and commit sequences per spec |
| [decisions/](./decisions/) | Architecture Decision Records |

## Spec index

| Spec | Owns |
|---|---|
| [spec.md](./spec.md) | Repo-wide objective, stack, boundaries |
| [specs/scaffolding.md](./specs/scaffolding.md) | Monorepo foundation (complete) |
| [specs/employees.md](./specs/employees.md) | Employee CRUD, search, filter |
| [specs/salary-structure.md](./specs/salary-structure.md) | Effective-dated salary structures |
| [specs/payroll.md](./specs/payroll.md) | Deterministic payroll generation |
| [specs/payslips.md](./specs/payslips.md) | Payslip view + history |
| [specs/reporting.md](./specs/reporting.md) | Aggregate compensation queries |

## How the pieces fit together

| Artifact | Location | Answers |
|---|---|---|
| Requirements | `docs/requirements.md` | What does the business need? |
| Spec | `docs/specs/*.md` | What must we build? (rules, API, success criteria) |
| Plan | `docs/plans/*.md` | In what order, with what commits? |
| ADR | `docs/decisions/ADR-*.md` | Why this technical choice? |
| Trace | `traces/*.md` | What did the agent actually do? |

**Flow:** requirements → spec → plan → implement → trace → evaluate against spec intent.

## Technology stack

Locked choices from [requirements.md](./requirements.md) and [spec.md](./spec.md). Where an ADR exists, it is the authoritative record.

| Concern | Choice | Why / notes | ADR |
|---|---|---|---|
| **Runtime** | Node.js 20 LTS | Stable LTS baseline for monorepo | — |
| **Language** | TypeScript (strict) | Shared types across FE/BE; type-safe domain logic | — |
| **Monorepo** | pnpm 9 + Turborepo 2 | Shared packages, cached parallel tasks, fast iteration | [ADR-0001](./decisions/ADR-0001-pnpm-turborepo-monorepo.md) |
| **Frontend framework** | Next.js 14+ (App Router) | Production React framework, routing, SSR for HR UI | — |
| **Component library** | shadcn/ui via `@salary-mgmt/ui` (Radix + Tailwind) | Shared package; composable primitives | [ADR-0002](./decisions/ADR-0002-shadcn-ui-component-library.md), [ADR-0004](./decisions/ADR-0004-shared-fe-packages.md) |
| **Client data layer** | TanStack Query + Zustand (`@salary-mgmt/store`) | Server state + local UI state | [ADR-0004](./decisions/ADR-0004-shared-fe-packages.md) |
| **Styling** | Tailwind CSS | Utility-first styling aligned with shadcn/ui | — |
| **Backend framework** | NestJS 10+ | Modular architecture, DI, testable domain modules | — |
| **Database** | PostgreSQL 16 | ACID, relational payroll data, indexing at 10k scale | — |
| **ORM** | TypeORM 0.3+ | NestJS integration, migrations, entity-driven modeling | — |
| **Containerization** | Docker + docker-compose | Reproducible local/CI/deploy environments | — |
| **FE testing** | Vitest + Testing Library | Fast component tests for critical UI flows | — |
| **BE testing** | Vitest + `@nestjs/testing` | Unified test runner across monorepo | [ADR-0003](./decisions/ADR-0003-vitest-backend-test-runner.md) |
| **CI** | GitHub Actions | install → typecheck → lint → test → build on PR/push | — |

**Shared packages:** `@salary-mgmt/types` (FE↔BE contracts), `@salary-mgmt/config` (tsconfig/eslint/prettier/tailwind presets), `@salary-mgmt/money` (integer minor-unit helpers), `@salary-mgmt/errors` (shared error types/messages), `@salary-mgmt/store` (TanStack Query + API client + Zustand), `@salary-mgmt/ui` (shadcn/ui components).

**Key conventions:** money stored as integer minor units (never floats); Conventional Commits; specs are source of truth before code changes.

Full commands and repo layout: [spec.md](./spec.md).

## Agent tooling

How humans and Cursor agents work on this repo. Skills and rules are referenced by path — not duplicated here.

### Workflow layers

| Layer | Location | Role |
|---|---|---|
| Specs | `docs/specs/*.md` | **What** to build |
| Plans | `docs/plans/*.md` | **How** to build it (tasks, commits) |
| Rules | `.cursor/rules/*.mdc` | Codified conventions (always applied) |
| Implementation | `apps/*`, `packages/*` | Code |
| Traces | `traces/*.md` | **What happened** during agent execution |

**Feedback loop:** traces observe → rules encode learnings → future sessions improve.

### Cursor rules (project)

| Rule | Purpose |
|---|---|
| [commit-conventions.mdc](../.cursor/rules/commit-conventions.mdc) | Conventional Commits, scopes, scaffolding commit order |
| [spec-driven-workflow.mdc](../.cursor/rules/spec-driven-workflow.mdc) | Spec → plan → implement → verify → commit → trace workflow |
| [scaffolding-learnings.mdc](../.cursor/rules/scaffolding-learnings.mdc) | Local dev, Next.js, Vitest, monorepo gotchas from scaffold |

### Agent skills

| Purpose | Path |
|---|---|
| Spec authoring | `~/.cursor/skills/spec-driven-development/SKILL.md` |
| Task breakdown / plans | `~/.cursor/skills/planning-and-task-breakdown/SKILL.md` |
| ADRs + documentation | [`.cursor/skills/documentation-and-adrs/SKILL.md`](../.cursor/skills/documentation-and-adrs/SKILL.md) (project) |
| Commits + branching | `~/.cursor/skills/git-workflow-and-versioning/SKILL.md` |
| Tests | `~/.cursor/skills/test-driven-development/SKILL.md` |
| Traces / observability | `~/.cursor/skills/observability-and-instrumentation/SKILL.md` |
| Security / boundaries | `~/.cursor/skills/security-and-hardening/SKILL.md` |

Per-spec execution logs and trace format: [traces/README.md](../traces/README.md).

## Adding a new domain spec

1. Write `docs/specs/<name>.md` (see [spec-driven-development skill](../.cursor/skills/spec-driven-development/SKILL.md) or `~/.cursor/skills/spec-driven-development/SKILL.md`).
2. Add a row to the index in [spec.md](./spec.md).
3. Create `docs/plans/<name>.md` with ordered tasks (see [plans/](./plans/)).
4. Create `traces/<name>.md` with the trace template (see [traces/README.md](../traces/README.md)).
5. Commit: `docs: add spec and plan for <name>`.

Significant technical choices get an ADR in [decisions/](./decisions/) before or during implementation.

## Related (outside `docs/`)

- [Root README](../README.md) — quick start, commands, repo structure
- [traces/](../traces/) — agent execution logs (observability, not authored docs)
