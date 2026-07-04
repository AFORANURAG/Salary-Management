# Trace: Payroll Generation

> Spec: [`docs/specs/payroll.md`](../docs/specs/payroll.md) · Plan: [`docs/plans/payroll.md`](../docs/plans/payroll.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR1 | `PayrollResult`, `PayrollRunSummary`, `PayrollResultQuery` added to `@salary-mgmt/types` | 1c07962 | types build + typecheck pass |
| PR2 | `PayrollResultEntity` + migration: `payroll_results` table, unique `(employee_id, period)`, indexes, FKs to employees + salary_structures (RESTRICT) | 1c07962 | `migration:run` applied table, unique constraint, 2 indexes, 2 FKs |
| PR3 | `TestDataSource` + `global-setup` updated with `PayrollResultEntity` and new migration; `truncateAll` covers `payroll_results` first (FK order) | 1c07962 | 76/76 existing tests still green |

### Phase 2 — RED

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR4 | Unit specs: `computePayroll` (5 cases), `resolvePeriodStructure` (7 cases) | 000f951 | RED — `payroll.service.ts` not found |
| PR5 | Integration specs: 10× POST runs, 2× GET summary, 3× GET results | 000f951 | RED — all routes 404 (controller not registered) |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR6 | `RunPayrollDto` (`@Matches` period regex) + `PayrollResultQueryDto` (`@IsOptional @IsUUID employeeId`) | 57a613e | typecheck pass, 400 on bad period/missing period |
| PR7 | `computePayroll()` pure helper + `resolvePeriodStructure()` pure helper; both exported for unit test | 57a613e | 12/12 unit tests GREEN |
| PR8 | `PayrollService.run()` (hard 409, bulk insert ON CONFLICT DO NOTHING), `findSummary()` (404 if no run), `findResults()` (filter by employeeId) | 57a613e | 15/15 integration tests GREEN |
| PR9 | `PayrollController` at `/payroll`; `PayrollModule` wired with TypeORM repos for all 4 entities | 57a613e | 103/103 total tests GREEN, no regressions |

### Phase 4 — Scale

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR10 | `persistPayrollSeed(count, effectiveFrom)` — bulk-inserts employees + salary structures (500-row batches) directly via TestDataSource | 63e4c79 | utility compiles, seeds 10k employees+structures in ~3s |
| PR11 | `payroll.scale.e2e-spec.ts` — seeds 10k, POST /v1/payroll/runs, asserts processed=10000 and elapsed < 30s | 63e4c79 | GREEN: 4.9s (< 30s budget); 104/104 total tests GREEN |

### Phase 5 — Frontend PR1: Store hooks + RED unit specs

Branch: `feat/payroll-fe-pr1-hooks-red`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PF1 | `packages/store`: `runPayroll`, `getPayrollSummary`, `getPayrollResults` API calls; `usePayrollRuns`, `usePayrollSummary`, `usePayrollResults`, `useRunPayroll` TanStack Query hooks; payroll query keys (`summary`, `results`) | af2d3a0 | `pnpm --filter @salary-mgmt/store typecheck` pass |
| PF4 | RED unit tests (8): `RunPayrollDialog`, `PayrollRunList`, `PayrollSummaryCard`, `PayrollResultsTable` — all mocked via `vi.mock`; fail because components not yet implemented | af2d3a0 | RED — component files not found |

### Phase 6 — Frontend PR2: Components + pages (GREEN)

Branch: `feat/payroll-fe-pr2-components`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PF2 | `apps/web/app/payroll/page.tsx` — hub page with Run Payroll button + `RunPayrollDialog` + `PayrollRunList` components | TBD | renders; 8/8 unit tests GREEN |
| PF3 | `apps/web/app/payroll/[period]/page.tsx` — detail page with `PayrollSummaryCard` + `PayrollResultsTable` + employeeId filter | TBD | renders; typecheck pass |

### Phase 7 — Frontend PR3: Integration + E2E tests

Branch: `feat/payroll-fe-pr3-tests`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PF5 | MSW `payrollHandlers` + integration tests (4): hub and detail pages via real TanStack Query hooks | TBD | 4/4 GREEN |
| PF6 | E2E tests (4 PF01–PF04): hub load, dialog run flow, 409 conflict, detail summary+results | TBD | 4/4 GREEN (see note) |

**Note PF6**: E2E required two fixes after initial commit:
1. Static assets (`.next/static/`) must be copied to `.next/standalone/apps/web/.next/static/` before running the standalone server — omitting this causes JS chunk 404s and React never hydrates, so click handlers don't fire.
2. Periods derived from fixed dates collide across test sessions; replaced with `Date.now()`-based year (5000–9999 range) to ensure unique periods per run.

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| `POST /payroll/runs` produces exactly one result per eligible employee | PASS | payroll.e2e-spec.ts |
| Re-posting the same period returns 409 | PASS | payroll.e2e-spec.ts |
| Each result references the exact `structureId` used | PASS | payroll.e2e-spec.ts |
| Historical structure version used (not latest) | PASS | payroll.e2e-spec.ts |
| 10k-employee run completes in < 30 s locally | PASS | 4.9s — payroll.scale.e2e-spec.ts |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
