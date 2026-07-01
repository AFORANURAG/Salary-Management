# Trace: Scaffolding

> Spec: [`docs/specs/scaffolding.md`](../docs/specs/scaffolding.md) · Plan: [`docs/plans/scaffolding.md`](../docs/plans/scaffolding.md)

Append-only agent execution log.

---

### Phase 0 — ADRs 0001-0003

| Field | Value |
|---|---|
| **Spec** | `docs/specs/scaffolding.md` |
| **Date** | 2026-06-30 |
| **Skills / rules** | documentation-and-adrs, spec-driven-workflow |
| **Verification** | ADRs indexed in `docs/decisions/README.md` |
| **Commit** | `aa0db79` — docs: add scaffolding ADRs 0001-0003 |

### Phase 1 — Workflow infrastructure

| Field | Value |
|---|---|
| **Skills / rules** | planning-and-task-breakdown, commit-conventions, spec-driven-workflow |
| **Files** | `docs/plans/`, `traces/`, `.cursor/rules/` |
| **Commit** | `b20ed65` — docs: add spec-driven workflow infrastructure |

### T1–T11 — Monorepo scaffold

| Task | Commit | Verification |
|---|---|---|
| T1 root | `056d5f0` | pnpm workspace initialized |
| T2 turbo | `dd2d6ba` | turbo pipeline wired |
| T3 config | `155c08b` | shared presets exported |
| T4 types | `eea05de` | package builds |
| T5 money | `f158931` | 4 Vitest tests pass |
| T6 api | `e33b205` | NestJS skeleton + `/health` |
| T7 api db | `07b1d96` | TypeORM + migration + seed |
| T8 web | `0ca8122` | Next.js + shadcn Button |
| T9 docker | `d1edcf3` | compose + Dockerfiles |
| T10 ci | `37abd85` | GitHub Actions workflow |
| T11 docs | `31313eb` | README + `.env.example` |

**Root verification (2026-06-30):** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` — all pass.

**Runtime verification:** With `docker compose up -d db`, `GET /health` returns `{"status":"ok",...}`; `migration:run` and `seed` succeed (no-op).

**Learnings:** Next.js 14 requires `next.config.mjs` not `.ts`; Vitest needs `singleThread` pool on this environment; API requires Postgres running (start `db` service first for local dev).

---

### Phase 3 — Shared FE packages

| Task | Description | Verification |
|---|---|---|
| T12 | Docs: spec/plan/ADR-0004/READMEs/AGENTS/commit-conventions | Scaffolding spec reopened with Phase 3 scope |
| T13 | `packages/errors` | `ErrorLike`, `CORE_ERROR_MESSAGES`, `getRequestFailedMessage`; typechecks |
| T14 | `packages/config` react-library preset + shadcn tailwind preset | `typescript/react-library.json` exported; tailwind tokens + animate plugin |
| T15 | `packages/ui` | 14 shadcn components, globals.css, 6 Button Vitest tests pass |
| T16 | `packages/store` | TanStack Query, API client, Zustand helpers, salary-mgmt query key stubs; typechecks |
| T17 | `apps/web` wiring | QueryProvider in layout; Button from `@salary-mgmt/ui`; `createApiClient` for `/health`; local button removed; web build passes |
| T18 | Trace closeout + learnings | This entry; `.ai/rules/scaffolding-learnings.md` updated |

**Root verification (2026-07-02):** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm --filter web build` — all pass.

**Commit:** `a9f15ba` — feat: add shared FE packages and wire web (scaffolding Phase 3)

**Learnings:** React FE packages export TS source + `transpilePackages` in Next.js (not `dist/` like `@salary-mgmt/types`); Tailwind `content` must scan `packages/ui/src/**`; `@types/node` required in store for `process.env`; ui tests need `jsdom` devDependency.

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| `docker compose up --build` brings up db + api + web | Partial | `db` verified; full stack build configured, not run end-to-end in session |
| `GET /health` + web home reaches API | Pass | `/health` verified with DB; web build succeeds |
| `pnpm typecheck && pnpm lint && pnpm test` pass | Pass | All green from repo root |
| `migration:run` and `seed` succeed against compose db | Pass | No-op seed; migrations table created |
| `packages/types` importable by web and api | Pass | Workspace package consumed in health controller + web page |
| Monorepo boots via `pnpm dev` | Pass | turbo dev wired |
| Five domain module folders exist as placeholders | Pass | employees, salary, payroll, payslips, reporting |
| packages/types, config, money consumable | Pass | Built and imported |
| packages/errors, store, ui consumable by web | Pass | Wired in layout, page, api client |
| apps/web wired to shared FE packages | Pass | QueryProvider + `@salary-mgmt/ui` Button; local shadcn removed |
| `@salary-mgmt/errors` importable by store | Pass | API client uses core error messages |

## Learnings distilled to rules

See `.ai/rules/scaffolding-learnings.md`.
