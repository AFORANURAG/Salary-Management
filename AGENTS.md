# AGENTS.md

Single source of truth for AI agents working in this repo — regardless of tool
(Cursor, Claude Code, Codex, Gemini, Copilot, etc.). Rules and conventions are
inlined here; deeper reusable knowledge lives in `.ai/` and is referenced below.

## Project

**Salary Management System** — Employee Salary Management MVP for ACME HR
operations. pnpm + Turborepo monorepo.

| Path | Stack |
|---|---|
| `apps/web` | Next.js (App Router) + `@salary-mgmt/ui` + `@salary-mgmt/store` |
| `apps/api` | NestJS + TypeORM + PostgreSQL |
| `packages/config` | Shared tsconfig / eslint / prettier presets |
| `packages/types` | Shared TypeScript types (built workspace package) |
| `packages/money` | Minor-unit (integer) money helpers |
| `packages/errors` | Shared error types and core messages (FE) |
| `packages/store` | TanStack Query, API client, Zustand helpers (FE) |
| `packages/ui` | Shared shadcn/ui component library (FE) |
| `docs/` | Specs, plans, ADRs |
| `traces/` | Agent execution logs |

Prerequisites: Node 20+, pnpm 9+, Docker (for the full stack / Postgres).

## Conversational Style

- Keep answers short, concise, and technical. No fluff or cheerful filler.
- No emojis in commits, issues, PRs, or code.
- When the user asks a question, answer it first before making edits or running
  implementation commands.
- When responding to feedback or an analysis, say whether you agree or disagree
  before saying what you changed.

## Spec-Driven Workflow

This repo is spec-driven. Layers: **Specs** (`docs/specs/*.md`, source of truth)
→ **Plans** (`docs/plans/*.md`) → **Rules** (this file + `.ai/rules/`) →
**Implementation** (`apps/*`, `packages/*`) → **Traces** (`traces/*.md`).

Per-task loop:

1. Read the spec and the relevant plan task.
2. Write failing test(s) for the slice first (RED) — see the test-driven-development skill.
3. Implement the smallest complete slice to make them pass (GREEN).
4. Verify: `pnpm typecheck && pnpm lint && pnpm test` (as applicable).
5. Commit using Conventional Commits (see below).
6. Append a trace entry to `traces/<spec>.md` **in the same commit** (include the
   commit SHA).
7. At checkpoints, evaluate against spec intent — not just passing tests.

### Workflow Lifecycle (skill-bound)

Each phase below maps to a **mandatory** skill in `.ai/skills/`. Load and
follow the skill before acting in that phase. Full skill index: [Skills](#skills).

- **spec** — `.ai/skills/spec-driven-development/SKILL.md`
- **plan** — `.ai/skills/planning-and-task-breakdown/SKILL.md`
- **tasks** — `.ai/skills/planning-and-task-breakdown/SKILL.md`
  (`references/definition-of-done.md`)
- **test** — `.ai/skills/test-driven-development/SKILL.md`
- **build** — `.ai/skills/security-and-hardening/SKILL.md` +
  `.ai/skills/observability-and-instrumentation/SKILL.md`
- **review** — `.ai/skills/code-review-and-quality/SKILL.md`
- **commit** — `.ai/skills/git-workflow-and-versioning/SKILL.md`

Tests come before build: write them first (RED), bound to the task/spec; `build`
makes them pass (GREEN). Never reorder these two.

Cross-cutting (apply when the work touches that domain):

- **docs / ADRs** — `.ai/skills/documentation-and-adrs/SKILL.md`
- **browser work** — `.ai/skills/browser-testing-with-devtools/SKILL.md`

Full detail: `.ai/rules/spec-driven-workflow.md`.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Run web (:3000) + api (:3001) via Turborepo |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | TypeScript check across workspace |
| `pnpm lint` | ESLint across workspace |
| `pnpm test` | Vitest across workspace |
| `pnpm --filter api migration:run` | Run TypeORM migrations |
| `pnpm --filter api seed` | Run seed |
| `docker compose up -d db` | Start Postgres only (needed before `pnpm dev`) |
| `docker compose up --build` | Full stack: db + api + web |

- Run `pnpm typecheck && pnpm lint && pnpm test` after code changes (not docs)
  and fix all issues before committing.
- Start Postgres (`docker compose up -d db`) before the API — TypeORM connects on
  boot and `/health` is unavailable without a running database.
- If you create or modify a test, run it and iterate until it passes.

## Code Quality

- Read files in full before wide-ranging changes and before editing files you
  have not fully inspected. Do not rely on search snippets for broad changes.
- **Money is always integer minor units.** Never use floats/doubles for money;
  use `packages/money` helpers.
- No `any` unless absolutely necessary. Top-level imports only (no dynamic
  `await import()` / `import("pkg").Type` for types).
- Import `@salary-mgmt/types` from the built workspace package — do not
  tsconfig-path into another app/package `src/` (breaks `rootDir` checks).
- React FE packages (`errors`, `store`, `ui`) export TypeScript source; Next.js
  transpiles via `transpilePackages` — do not tsconfig-path into their `src/`.
- `@salary-mgmt/config` packages need noop turbo scripts (`build`, `lint`,
  `typecheck`, `test`) to participate in the pipeline.
- Use `next.config.mjs` (not `.ts`) on Next.js 14; keep `output: "standalone"`
  for Docker.
- Always ask before removing functionality or code that appears intentional. Do
  not preserve backward compatibility unless the user asks.

More local-dev learnings: `.ai/rules/scaffolding-learnings.md`.

## Git and Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

<optional body — why, not what>
```

- Types: `feat`, `fix`, `chore`, `docs`, `ci`, `test`, `refactor`.
- Scopes match repo layout: `(web)`, `(api)`, `(config)`, `(types)`, `(money)`, `(errors)`, `(store)`, `(ui)`;
  omit for repo-wide changes.
- One logical unit per commit; no per-file micro-commits. Keep each commit
  working (install/build where possible).
- Trace entries ship in the **same commit** as the task implementation.
- Stage explicit paths (`git add <path>`); do not `git add -A` / `git add .`.
- Never commit secrets — use `.env.example` only.

Full detail: `.ai/rules/commit-conventions.md`.

## Boundaries

**Ask first before:**

- DB schema changes
- Adding new dependencies
- Monorepo structure changes
- CI changes

**Never:**

- Commit secrets
- Use floats for money
- Skip or disable failing tests without approval
- Implement undeclared features
- Commit unless the user asks

## Skills

Reusable, situational playbooks live in `.ai/skills/`. Load the relevant
`SKILL.md` on demand (agentic tools can open these files directly). Phase
ordering and mandatory bindings: [Workflow Lifecycle (skill-bound)](#workflow-lifecycle-skill-bound).

| Skill | Use when | Path |
|---|---|---|
| Spec-driven development | Starting a project/feature with no spec yet | `.ai/skills/spec-driven-development/SKILL.md` |
| Planning and task breakdown | Turning a spec into ordered, verifiable tasks | `.ai/skills/planning-and-task-breakdown/SKILL.md` |
| Test-driven development | Implementing logic, fixing a bug, changing behavior | `.ai/skills/test-driven-development/SKILL.md` |
| Code review and quality | Before merging any change | `.ai/skills/code-review-and-quality/SKILL.md` |
| Security and hardening | Handling untrusted input, auth, storage, integrations | `.ai/skills/security-and-hardening/SKILL.md` |
| Observability and instrumentation | Adding logging, metrics, tracing, alerting | `.ai/skills/observability-and-instrumentation/SKILL.md` |
| Documentation and ADRs | Architectural decisions, API changes, shipping features | `.ai/skills/documentation-and-adrs/SKILL.md` |
| Git workflow and versioning | Committing, branching, resolving conflicts | `.ai/skills/git-workflow-and-versioning/SKILL.md` |
| Browser testing with DevTools | Building/debugging anything that runs in a browser | `.ai/skills/browser-testing-with-devtools/SKILL.md` |

## Feedback Loop

Patterns, failures, and workarounds discovered during work → record in
`traces/*.md`, then promote durable ones into `.ai/rules/` (and this file) so
future sessions improve.

## User Override

If the user's instructions conflict with any rule here, ask for explicit
confirmation before overriding. Only then execute their instructions.
