# Implementation Plan: Payroll Generation

> Source spec: [`../specs/payroll.md`](../specs/payroll.md) · Trace log: [`../../traces/payroll.md`](../../traces/payroll.md)

## Overview

Generate monthly payroll for a selected pay period: for each employee with an
active salary structure, compute gross, deductions, and net from that structure
and persist a per-employee `PayrollResult`. Runs must be deterministic and
idempotent per `(employee, period)`.

Built **test-first**: RED suite authored before any implementation. Backend
across four stacked branches; frontend across three stacked branches.

## Architecture Decisions

- **Idempotency via unique constraint** — `(employeeId, period)` is a DB-level
  unique constraint. Bulk insert uses `ON CONFLICT DO NOTHING`; a subsequent
  `GET /runs/:period` returning results triggers the 409 at service level.
- **Pure computation helpers** — `computePayroll()` and `resolvePeriodStructure()`
  are pure functions exported from the service file so unit tests can exercise
  them without a DB or NestJS context.
- **Historical structure snapshot by reference** — each `PayrollResult` records
  the `structureId` used; later structure edits cannot retroactively change a
  generated result.
- **Bulk insert in 500-row batches** — `QueryBuilder.insert().values(chunk)` per
  batch; no per-row round trips. Handles 10k employees in ~5s locally.
- **Skipped employees are reported, not failed** — employees without an active
  structure for the period appear in the run summary's `skipped` array.
- **No list-all-runs API endpoint** — the frontend `usePayrollRuns` hook returns
  an empty array as a placeholder; the hub page is driven by navigating to known
  periods returned from `useRunPayroll` success.

## Ask-First Boundaries

- DB schema changes (entity + migration).
- New dependencies beyond what is already installed.

---

## Task List

### Phase 1 — Foundation

Branch: `feat/payroll-pr1-foundation`

| Task | Description | Commit |
|---|---|---|
| PR1 | `packages/types`: add `PayrollResult`, `PayrollRunSummary`, `PayrollResultQuery` | `feat(types,api): add payroll contracts, entity, migration and test harness` |
| PR2 | `PayrollResultEntity` + migration: `payroll_results` table, unique `(employee_id, period)`, indexes, FKs to employees + salary_structures (RESTRICT) | (same commit) |
| PR3 | `TestDataSource` + `global-setup` updated with `PayrollResultEntity` and new migration; `truncateAll` covers `payroll_results` first (FK order) | (same commit) |

**Acceptance**
- [x] Types exported from `@salary-mgmt/types`; build + typecheck pass.
- [x] Migration applies cleanly: table, unique constraint, 2 indexes, 2 FKs.
- [x] All existing tests remain green.

---

### Phase 2 — RED

Branch: `feat/payroll-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| PR4 | Unit specs: `computePayroll` (5 cases), `resolvePeriodStructure` (7 cases) | `test(api): add failing payroll unit and integration specs` |
| PR5 | Integration specs: 10× POST runs, 2× GET summary, 3× GET results | (same commit) |

**Acceptance**
- [x] Tests fail for the right reason: missing service/controller, not harness errors.

---

### Phase 3 — GREEN

Branch: `feat/payroll-pr3-implementation`

| Task | Description | Commit |
|---|---|---|
| PR6 | `RunPayrollDto` (`@Matches` period regex) + `PayrollResultQueryDto` (`@IsOptional @IsUUID employeeId`) | `feat(api): implement payroll GREEN phase — DTOs, service, controller` |
| PR7 | `computePayroll()` pure helper + `resolvePeriodStructure()` pure helper | (same commit) |
| PR8 | `PayrollService.run()` (hard 409, bulk insert ON CONFLICT DO NOTHING), `findSummary()`, `findResults()` | (same commit) |
| PR9 | `PayrollController` at `/payroll`; `PayrollModule` wired with TypeORM repos for all 4 entities | (same commit) |

**Acceptance**
- [x] 12/12 unit tests GREEN.
- [x] 15/15 integration tests GREEN.
- [x] All prior tests still green.

---

### Phase 4 — Scale

Branch: `feat/payroll-pr4-scale`

| Task | Description | Commit |
|---|---|---|
| PR10 | `persistPayrollSeed(count, effectiveFrom)` — bulk-inserts employees + salary structures (500-row batches) via TestDataSource | `test(api): payroll scale spec — 10k employees in < 30s` |
| PR11 | `payroll.scale.e2e-spec.ts` — seeds 10k, POST /v1/payroll/runs, asserts `processed=10000` and `elapsed < 30s` | (same commit) |

**Acceptance**
- [x] Scale spec passes: 10k-employee run < 30s (actual: ~5s).
- [x] 104/104 total tests GREEN.

---

### Phase 5 — Frontend PR1: Store hooks + RED unit specs

Branch: `feat/payroll-fe-pr1-hooks-red`

| Task | Description | Commit |
|---|---|---|
| PF1 | `packages/store`: `runPayroll`, `getPayrollSummary`, `getPayrollResults` API fns; `usePayrollRuns`, `usePayrollSummary`, `usePayrollResults`, `useRunPayroll` hooks; payroll query keys (`summary`, `results`) | `feat(store): add payroll API fns, hooks, and RED unit specs` |
| PF4 | RED unit tests (9): `RunPayrollDialog` (3), `PayrollRunList` (2), `PayrollSummaryCard` (2), `PayrollResultsTable` (3) — all mocked via `vi.mock`; fail because components not yet implemented | (same commit) |

**Acceptance**
- [x] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [x] Unit tests fail RED: component files not found.

---

### Phase 6 — Frontend PR2: Components + pages (GREEN)

Branch: `feat/payroll-fe-pr2-components`

| Task | Description | Commit |
|---|---|---|
| PF2 | Hub page `apps/web/app/payroll/page.tsx`: Run Payroll button + `RunPayrollDialog` + `PayrollRunList` | `feat(web): payroll components and pages — GREEN` |
| PF3 | Detail page `apps/web/app/payroll/[period]/page.tsx`: `PayrollSummaryCard` + `PayrollResultsTable` + employeeId filter input | (same commit) |

**Acceptance**
- [x] All 9 unit tests from PF4 now GREEN.
- [x] `pnpm --filter web typecheck` passes.

---

### Phase 7 — Frontend PR3: Integration + E2E tests

Branch: `feat/payroll-fe-pr3-tests`

| Task | Description | Commit |
|---|---|---|
| PF5 | MSW `payrollHandlers` added to shared test server; integration tests (4): hub and detail pages via real TanStack Query hooks | `test(web): payroll MSW handlers, integration tests, and E2E specs` |
| PF6 | E2E tests (4 — PF01–PF04): hub load, dialog run flow, 409 conflict, detail summary+results | (same commit) |

**Acceptance**
- [x] 4/4 integration tests GREEN.
- [x] 4/4 E2E tests GREEN against `docker compose up --build`.
- [x] `pnpm typecheck && pnpm lint && pnpm test` clean from repo root.

---

## Checkpoints

| Checkpoint | Gate |
|---|---|
| After Phase 1 | All existing tests green; migration applies cleanly |
| After Phase 2 | RED confirmed — fail for right reason |
| After Phase 3 | 27/27 payroll tests GREEN; no regressions |
| After Phase 4 | Scale spec passes < 30s; 104/104 total |
| After Phase 6 | 9/9 unit tests GREEN; typecheck clean |
| After Phase 7 | Full suite GREEN; spec closeout checklist complete |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bulk insert performance degrades on large batches | High | 500-row chunks; tested at 10k |
| Re-running period silently creates duplicates | High | DB unique constraint + service-level 409 |
| Structure edit retroactively changes a past result | High | `structureId` snapshot; RESTRICT FK prevents deletion |
| E2E period collisions across test runs | Med | `Date.now()`-based year (5000–9999 range) per test |
| `usePayrollRuns` has no backend list-all endpoint | Med | Hook returns `[]` placeholder; hub driven by mutation success response |
