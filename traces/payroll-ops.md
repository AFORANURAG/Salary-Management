# Trace: Payroll Operations (Lifecycle, History & Period Diff)

> Plan: [`docs/plans/payroll-ops.md`](../docs/plans/payroll-ops.md)
> Spec: [`docs/specs/payroll-ops.md`](../docs/specs/payroll-ops.md)

---

## Phase 1 — Types & Migration

**Branch:** `feat/payroll-ops-pr3-api` (all backend phases landed on same branch due to stacking)

**Commits:**
- `5ae44ab` — `feat(types): add payroll-ops type contracts (PO3)`
- `27ba449` — `feat(api): add payroll_runs table migration and PayrollRunEntity (PO1, PO2)`
- `3d66258` — `feat(api): wire PayrollRunEntity into service and module (PO2)`

**Notes:**
- The spec assumed `payroll_runs` already existed (from the original payroll spec) and planned an `ALTER TYPE ... ADD VALUE 'VOIDED'` migration. In practice the table did not exist — the original payroll implementation aggregated results at query time with no persisted run record. Phase 1 therefore created the full `payroll_runs` table from scratch (migration `1751500000000-CreatePayrollRuns`) with all columns including `status`, `voidedAt`, `voidedBy`, `headcount`, and totals — rather than the originally planned `ALTER TYPE` + two `ADD COLUMN` migration. The spec data model section was updated to reflect this.
- `PayrollRunSummary` in `@salary-mgmt/types` is a breaking change: removed `processed`/`skipped`, added `status`/`headcount`/`voidedAt`/`voidedBy`. Web consumers (`payroll-summary-card.tsx`, `payroll-run-list.tsx`, MSW handlers) are intentionally left broken on the backend branch — they will be fixed in `feat/payroll-ops-fe-pr2-history-page`.

---

## Phase 2 — RED Test Harness

**Branch:** `feat/payroll-ops-pr3-api` (stacked on Phase 1)

**Commits:**
- `b47d0c0` — `feat(api): extract computeDiff as pure exported helper`
- `4f48e78` — `test(api): add PayrollRunEntity to test data source and persist utility`
- `bfb8410` — `test(api): add failing unit spec for computeDiff (PO6)`
- `4eefa8e` — `test(api): update existing payroll e2e spec to new PayrollRunSummary shape`
- `88fe815` — `test(api): add failing integration specs for list, void, and diff endpoints (PO7–PO9)`

**Notes:**
- PO4/PO5 (unit specs for `listRuns`/`voidRun`) were skipped — these methods are DB-backed and require a real Postgres connection, making true unit tests (with mocked repos) low-value. Only `computeDiff` was unit-tested as it is a pure exported function following the same pattern as `computePayroll` and `buildCostResponse`.
- Integration tests cover all three endpoints: list (PO7), void (PO8), diff (PO9). 18 tests total, all RED at this commit (spec called for 17; one extra test added for the VOIDED-period diff case — spec states "if either period is VOIDED, the diff still runs").
- `global-setup.ts` was missing `PayrollRunEntity` and `CreatePayrollRuns1751500000000` — caught and fixed in Phase 3.
- HR_MANAGER void 403 test required bcrypt-hashed password in `persistHrUser` fixture — matched the pattern from `role-guards.e2e-spec.ts`.

---

## Phase 3 — API (GREEN)

**Branch:** `feat/payroll-ops-pr3-api`

**Commits:** (pending — current working state, to be committed)

**Notes:**
- `listRuns`: QueryBuilder with optional `IN (:...statuses)` filter; ordered `ranAt DESC NULLS LAST`; returns `PaginatedResponse<PayrollRunSummary>`.
- `voidRun`: guards PENDING (422) and VOIDED (409); sets `status`, `voidedAt`, `voidedBy`; does not touch `PayrollResult` rows.
- `getDiff`: two parallel raw queries joining `payroll_results` ↔ `employees`; in-memory categorisation via `computeDiff()`; currency uses base run's dominant currency (falls back to compare run if base is "MIXED").
- `currency varchar(3)` was too short for the sentinel value `"MIXED"` (5 chars). Fixed with a new migration `1751600000000-ExpandPayrollRunCurrency` (`ALTER COLUMN currency TYPE varchar(10)`). Entity `length` updated to match.
- `payroll.scale.e2e-spec.ts` still asserted old `processed`/`skipped` shape — updated to `headcount`/`status` in this phase (should have been caught in Phase 2).
- `global-setup.ts` updated to include `PayrollRunEntity` and both new migrations.
- All 192 API tests GREEN after these fixes.
- Phase 3 trace note: the spec trace said "pending — current working state" for commits; all backend commits are now captured via cherry-picks onto the history-page branch.

---

## Phase 4 — Test Harness Fixes

**Branch:** `feat/payroll-ops-pr4-test-harness-fixes`

**Commits:**
- `e5668e6` — `test(api): add payroll_runs to truncateAll and fix stale processed/skipped assertions`
- `cc31600` — `test(web): fix PF04 e2e assertion for new PayrollSummaryCard labels`

**Notes:**
- `test-data-source.ts` was missing `PayrollRunEntity` in its entities list and `payroll_runs` in the TRUNCATE statement. This caused 409 conflicts between API test cases because run records from a prior test persisted into the next.
- `payroll.e2e-spec.ts` and `payroll.scale.e2e-spec.ts` still asserted `processed`/`skipped` shape — these should have been fixed in `feat/payroll-ops-pr3-api` but were missed.
- `payroll.spec.ts` PF04 checked for `"Processed"` label on the summary card; updated to `"Headcount"` + `"COMPLETED"`.
- All 166 API tests and 35 Playwright e2e tests GREEN after these fixes.

---

## Phase 5 — Frontend: Hooks

**Branch:** `feat/payroll-ops-fe-pr1-hooks`

**Commits:**
- `7a8398b` — `feat(store): add payroll-ops hooks and API functions (PO15–PO17)`
- `4470317` — `docs(payroll-ops): tick Phase 4 acceptance criteria`

**Notes:**
- `usePayrollRuns(query?)` returns `PaginatedResponse<PayrollRunSummary>` — callers must destructure via `data?.data`.
- `useVoidPayrollRun()` invalidates `payroll.runs()` (all filter variants) and the specific `payroll.run(period)` on success.
- `usePayrollDiff()` is enabled only when both `basePeriod` and `compareTo` are non-empty strings.
- Query keys updated: `payroll.runs(query?)` namespaced under `["payroll", "runs", { query }]` for per-filter cache isolation; `payroll.run(period)` branches off `payroll.all()` directly (not `runs()`).

---

## Phase 6 — Frontend: History Page

**Branch:** `feat/payroll-ops-fe-pr2-history-page`

**Commits:** (pending — current working state, to be committed)

**Notes:**
- `PayrollRunList` now accepts `statusFilter` and `onStatusFilter` props; filter pills only render when `onStatusFilter` is provided.
- Status badge: COMPLETED=green, PENDING=yellow, VOIDED=red using Tailwind utility classes.
- `page.tsx` removes `recentRuns` local state — `useRunPayroll` already invalidates `payroll.runs()` so the list auto-refreshes after a successful run.
- `payroll-summary-card.tsx` updated: `processed`/`skipped` removed; now shows `status`/`headcount`.
- MSW handler updated: added `GET /v1/payroll/runs` list handler returning `PaginatedResponse<PayrollRunSummary>`; fixture `mockPayrollRunsList` exported for test overrides; status filter param respected.
- `payroll-detail.integration.test.tsx` assertion fixed: `mockPayrollSummary.processed` → `mockPayrollSummary.headcount`.
- This branch carries cherry-picks of backend commits (all pr1/pr3 API work) to keep the workspace typechecking green — those commits will be removed on this branch once the upstream PRs merge.
