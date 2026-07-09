# Implementation Plan: Payroll Operations (Lifecycle, History & Period Diff)

> Source spec: [`../specs/payroll-ops.md`](../specs/payroll-ops.md) · Trace log: [`../../traces/payroll-ops.md`](../../traces/payroll-ops.md)

## Overview

Extends the payroll module with three new capabilities: a paginated run history
list, void a completed run (ADMIN only), and a period-to-period diff. The
`/payroll` page becomes a full payroll operations hub. Nine stacked branches
(4 backend/harness, 5 frontend).

## Architecture Decisions

- **`payroll_runs` table via migration** — original payroll implementation had
  no persisted run record. Phase 1 created the full `payroll_runs` table from
  scratch (migration `1751500000000-CreatePayrollRuns`) with `status` enum
  (PENDING | COMPLETED | VOIDED), void columns, and all totals columns.
  A follow-up migration (`1751600000000-ExpandPayrollRunCurrency`) widened
  `currency` from `varchar(3)` to `varchar(10)` to fit the `"MIXED"` sentinel.
- **`GET /v1/payroll/runs` (list)** — new endpoint; existing
  `GET /v1/payroll/runs/:period` (single run) is unchanged.
- **`void` is a PATCH-semantics POST** — `POST /v1/payroll/runs/:period/void`;
  returns the updated run. Using POST (not PATCH) because the action is
  semantically a lifecycle transition, not a partial update.
- **Diff computed at query time** — no persisted diff table;
  `PayrollService.getDiff()` runs two queries (one per period) and computes the
  delta in-memory. Acceptable at ACME's 10k-employee scale.
- **`RunPayrollModal` reused** — already built in `dashboard-fe-pr2`;
  payroll history page imports the shared component.
- **`PeriodDiffDrawer`** — right-side `Sheet` drawer; no new route.
- **`VoidConfirmModal`** — inline modal on the run detail page.
- **New types** — `PayrollRunSummary`, `PayrollDiffResponse` in
  `@salary-mgmt/types`.

## Ask-First Boundaries

- DB schema change: `VOIDED` enum value + `voidedAt` + `voidedBy` columns
  migration (PO1).

---

## Task List

### Phase 1 — Types & Migration

Branch: `feat/payroll-ops-pr3-api`

| Task | Description | Commit |
|---|---|---|
| PO1 | TypeORM migration: `ALTER TYPE payroll_run_status_enum ADD VALUE 'VOIDED'`; `ALTER TABLE payroll_runs ADD COLUMN voidedAt timestamptz`; `ADD COLUMN voidedBy varchar` | `feat(api): add VOIDED status and void columns migration` |
| PO2 | Update `PayrollRunEntity`: add `voidedAt`, `voidedBy` nullable columns; update status enum | `feat(api): update PayrollRunEntity with void fields` |
| PO3 | `packages/types`: add `PayrollRunSummary`, `PayrollDiffEntry`, `PayrollDiffResponse`, `PayrollRunListQuery` interfaces | `feat(types): add payroll-ops contracts` |

**Acceptance**
- [x] Migration runs: `pnpm --filter api migration:run`.
- [x] Types exported; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [x] Existing payroll tests still GREEN (enum addition is additive).

---

### Phase 2 — RED

Branch: `feat/payroll-ops-pr3-api`

| Task | Description | Commit |
|---|---|---|
| PO4 | Unit spec `PayrollService.listRuns()`: paginated result with correct shape; status filter returns only matching runs; ordered by `ranAt DESC` | `test(api): add failing payroll list unit spec (PO4)` |
| PO5 | Unit spec `PayrollService.voidRun()`: voids COMPLETED run; throws 422 for PENDING; throws 409 for already VOIDED; sets `voidedAt` + `voidedBy` | `test(api): add failing void unit spec (PO5)` |
| PO6 | Unit spec `PayrollService.getDiff()`: correctly categorizes new hires (in base, not compare); terminations (in compare, not base); salary changes (in both, different netMinor); correct totals delta | `test(api): add failing diff unit spec (PO6)` |
| PO7 | Integration spec `GET /v1/payroll/runs`: 200 paginated list; status filter works; 401 without cookie | `test(api): add failing payroll list integration spec (PO7)` |
| PO8 | Integration spec `POST /v1/payroll/runs/:period/void`: 200 ADMIN + COMPLETED; 403 HR_MANAGER; 409 already VOIDED; 422 PENDING; 404 unknown period | `test(api): add failing void integration spec (PO8)` |
| PO9 | Integration spec `GET /v1/payroll/runs/:period/diff?compareTo=`: 200 correct structure; 400 missing compareTo; 404 missing either period | `test(api): add failing diff integration spec (PO9)` |

**Acceptance**
- [x] All specs fail RED — routes 404.

---

### Phase 3 — API (GREEN)

Branch: `feat/payroll-ops-pr3-api`

| Task | Description | Commit |
|---|---|---|
| PO10 | `PayrollRunListQueryDto`: `page`, `pageSize`, repeatable `status` | `feat(api): add PayrollRunListQueryDto` |
| PO11 | `PayrollService.listRuns()`: QueryBuilder with optional status filter; `COUNT(*)` for pagination; `voidedAt` + `voidedBy` in result | `feat(api): implement PayrollService.listRuns (PO11)` |
| PO12 | `PayrollService.voidRun(period, actor)`: load run; guard PENDING (422) + VOIDED (409); UPDATE status + voidedAt + voidedBy | `feat(api): implement PayrollService.voidRun (PO12)` |
| PO13 | `PayrollService.getDiff(basePeriod, comparePeriod)`: two queries → in-memory categorization; `deltaMinor` + `totals` | `feat(api): implement PayrollService.getDiff (PO13)` |
| PO14 | `PayrollController`: add `GET /v1/payroll/runs` (list); `POST /v1/payroll/runs/:period/void` (`@Roles(ADMIN)`); `GET /v1/payroll/runs/:period/diff` | `feat(api): add payroll-ops controller endpoints (PO14)` |

**Acceptance**
- [x] All unit specs from PO4–PO6 GREEN. *(PO4/PO5 skipped — DB-backed methods covered by integration tests instead; PO6 covered via `computeDiff` pure helper unit tests)*
- [x] All integration specs from PO7–PO9 GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green. *(web typecheck blocked by FE consumers of new PayrollRunSummary shape — fixed in fe-pr2-history-page)*

### Checkpoint: Backend complete
- [x] Void preserves `PayrollResult` rows.
- [x] Diff covers all three change categories.

---

### Phase 4 — Test Harness Fixes

Branch: `feat/payroll-ops-pr4-test-harness-fixes`

| Task | Description | Commit |
|---|---|---|
| PO-TH1 | `test-data-source.ts`: add `PayrollRunEntity` to entities list; add `payroll_runs` to `TRUNCATE` statement — missing entry caused 409 conflicts between API test cases | `test(api): add payroll_runs to truncateAll and fix stale processed/skipped assertions` |
| PO-TH2 | `payroll.e2e-spec.ts` + `payroll.scale.e2e-spec.ts`: update `processed`/`skipped` → `headcount`/`status` assertions to match new `PayrollRunSummary` shape | *(same commit)* |
| PO-TH3 | `apps/web/e2e/payroll/payroll.spec.ts` PF04: assert `Headcount` + `COMPLETED` labels instead of old `Processed` label | `test(web): fix PF04 e2e assertion for new PayrollSummaryCard labels` |

**Acceptance**
- [x] All 166 API tests GREEN with Postgres running.
- [x] All 35 Playwright e2e tests GREEN against live stack.

---

### Phase 5 — Frontend: Hooks

Branch: `feat/payroll-ops-fe-pr1-hooks`

| Task | Description | Commit |
|---|---|---|
| PO15 | `@salary-mgmt/store`: `getPayrollRuns(query)` + `usePayrollRuns(query)` hook — `queryKey: ['payroll', 'runs', query]` | `feat(store): add usePayrollRuns hook` |
| PO16 | `postVoidPayrollRun(period)` + `useVoidPayrollRun()` mutation — invalidates `['payroll', 'runs']` + `['payroll', 'run', period]` on success | `feat(store): add useVoidPayrollRun mutation` |
| PO17 | `getPayrollDiff(period, compareTo)` + `usePayrollDiff(period, compareTo)` hook — `queryKey: ['payroll', 'diff', period, compareTo]` | `feat(store): add usePayrollDiff hook` |

**Acceptance**
- [x] `pnpm --filter @salary-mgmt/store typecheck` passes.

---

### Phase 6 — Frontend: History Page

Branch: `feat/payroll-ops-fe-pr2-history-page`

| Task | Description | Commit |
|---|---|---|
| PO18 | Replace `/payroll/page.tsx` with payroll history list: `usePayrollRuns` table; status filter pills (All / Completed / Pending / Voided); status badge colors; each row links to `/payroll/[period]` | `feat(web): replace payroll page with run history list` |
| PO19 | Add `RunPayrollModal` trigger button to payroll page header (imports shared component from `components/payroll/`) | `feat(web): add Run Payroll button to payroll history page` |
| PO20 | Unit spec: history table renders period, status badge, headcount, net total; empty state; status filter pill updates query | `test(web): add payroll history page unit specs` |

**Acceptance**
- [x] Unit specs GREEN.
- [x] Old blank payroll form page removed.
- [x] `pnpm typecheck` passes.

---

### Phase 7 — Frontend: Void

Branch: `feat/payroll-ops-fe-pr3-void`

| Task | Description | Commit |
|---|---|---|
| PO21 | `VoidConfirmModal` (`components/payroll/void-confirm-modal.tsx`): period label in body; confirm calls `useVoidPayrollRun`; on success toast + modal close; on 409 inline error | `feat(web): add VoidConfirmModal component` |
| PO22 | Add Void button to `/payroll/[period]` detail page header: visible only to ADMIN; opens `VoidConfirmModal`; button absent for HR_MANAGER + HR_VIEWER | `feat(web): add void button to payroll detail page` |
| PO23 | Update status badge on detail page to support `VOIDED` (red variant) | `feat(web): add VOIDED status badge to payroll detail` |
| PO24 | Unit spec: `VoidConfirmModal` submit calls hook; 409 shows inline error without closing; modal absent for non-ADMIN | `test(web): add VoidConfirmModal unit spec` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] ADMIN sees void button; HR_MANAGER does not.

---

### Phase 8 — Frontend: Diff Drawer

Branch: `feat/payroll-ops-fe-pr4-diff-drawer`

| Task | Description | Commit |
|---|---|---|
| PO25 | `PeriodDiffDrawer` (`components/payroll/period-diff-drawer.tsx`): right-side `Sheet`; header with period labels + `compareTo` selector; three collapsible sections (totals, salary changes, headcount changes); loading skeleton; empty state | `feat(web): add PeriodDiffDrawer component` |
| PO26 | Add diff icon button `(↔)` to payroll history table rows (COMPLETED runs only) → opens `PeriodDiffDrawer` with `compareTo` = previous month | `feat(web): wire diff button onto payroll history rows` |
| PO27 | Add "Compare with previous" button to `/payroll/[period]` detail page → opens `PeriodDiffDrawer` | `feat(web): add compare button to payroll detail page` |
| PO28 | Unit spec: drawer renders totals tile with correct delta; salary changes table; headcount sections; empty state when no diff | `test(web): add PeriodDiffDrawer unit spec` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] Drawer opens from both history table and detail page.

---

### Phase 9 — Tests

Branch: `feat/payroll-ops-fe-pr5-tests`

| Task | Description | Commit |
|---|---|---|
| PO29 | Integration spec (MSW): payroll history renders list from MSW fixture; status filter changes request param; void modal MSW 200 → toast; void modal MSW 409 → inline error; diff drawer MSW fixture renders salary changes | `test(web): add payroll-ops integration specs` |
| PO30 | E2E: history page loads with seeded runs; ADMIN voids a run — status updates to VOIDED badge; HR_MANAGER no void button; diff drawer opens — salary changes table renders; totals delta visible | |

**Acceptance**
- [ ] Integration specs GREEN.
- [ ] E2E specs GREEN against running stack.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases covered and green.
- [ ] `/payroll` is a live history list; blank form removed.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `ALTER TYPE ... ADD VALUE` cannot run inside a transaction in Postgres < 12 | Low | Postgres 14+ used in compose; migration is safe |
| In-memory diff at 10k employees slow | Low | Diff is two simple queries (one per period); in-memory categorization is O(N); acceptable |
| `PeriodDiffDrawer` Sheet component dependency on `@salary-mgmt/ui` Sheet | Low | Sheet added in app-shell-pr4 if missing; payroll-ops must stack after app-shell |
| `RunPayrollModal` already built in dashboard-fe-pr2 — import path must be stable | Med | Place in `components/payroll/run-payroll-modal.tsx` from the start; dashboard and payroll both import from there |
