# Spec: Payroll Operations (Lifecycle, History & Period Diff)

> Domain spec under [`../spec.md`](../spec.md). Extends `apps/api/src/payroll`
> and the payroll pages in `apps/web`.
> Depends on [`hr-auth.md`](./hr-auth.md).

## Objective

Extend the payroll module beyond single-run creation. HR needs to see the full
history of payroll runs, void an erroneous run (admin only), and compare two
periods side-by-side to understand salary movements, headcount changes, and
cost deltas between months. The `/payroll` page graduates from a blank period
form to a live payroll operations hub.

## Data Model Changes

### `payroll_runs` — new table

The original payroll implementation had no persisted run record — summaries
were aggregated at query time from `payroll_results`. This spec introduces a
dedicated `payroll_runs` table that stores one row per period.

Migration `1751500000000-CreatePayrollRuns` creates the table with columns:
`id` (uuid pk), `period` (varchar 7, unique), `status` (enum: PENDING |
COMPLETED | VOIDED, default PENDING), `headcount` (integer), `total_gross_minor`
(bigint), `total_deductions_minor` (bigint), `total_net_minor` (bigint),
`currency` (varchar 10, default USD), `ran_at` (timestamptz nullable),
`voided_at` (timestamptz nullable), `voided_by` (varchar nullable).

Migration `1751600000000-ExpandPayrollRunCurrency` widens `currency` to
`varchar(10)` to accommodate the `"MIXED"` sentinel value.

## API Surface

```
GET  /v1/payroll/runs                        → paginated list of all runs
POST /v1/payroll/runs/:period/void           → void a completed run
GET  /v1/payroll/runs/:period/diff           → compare two periods
```

### `GET /v1/payroll/runs`

**Auth:** any authenticated role.

Query params:
- `page` (default 1), `pageSize` (default 20, max 50)
- `status` — filter by `PENDING | COMPLETED | VOIDED` (repeatable)

Response: `PaginatedResponse<PayrollRunSummary>` where:
```ts
interface PayrollRunSummary {
  period: string;
  status: "PENDING" | "COMPLETED" | "VOIDED";
  headcount: number;
  totalGrossMinor: number;
  totalDeductionsMinor: number;
  totalNetMinor: number;
  currency: string;          // dominant currency; "MIXED" if >1
  ranAt: string | null;
  voidedAt: string | null;
  voidedBy: string | null;   // HrUser email
}
```

### `POST /v1/payroll/runs/:period/void`

**Auth:** `ADMIN` only.

Rules:
- 404 if no run exists for the period.
- 409 if run is already `VOIDED`.
- 422 if run status is `PENDING` (cannot void a run in progress).
- Sets `status = VOIDED`, `voidedAt = NOW()`, `voidedBy = currentUser.email`.
- Does **not** delete `PayrollResult` rows — history is preserved.
- Audit log entry written (once `audit-log` spec is implemented; wired in
  Phase 4 of that spec).

Response: `{ period, status: "VOIDED", voidedAt, voidedBy }`.

### `GET /v1/payroll/runs/:period/diff?compareTo=YYYY-MM`

**Auth:** any authenticated role.

Compares the payroll results of two periods. Returns per-employee changes.

Query param `compareTo` is required; 400 if missing or malformed.

Response:
```ts
{
  basePeriod: string;       // :period
  comparePeriod: string;    // ?compareTo value
  newHires: Array<{         // in basePeriod but not comparePeriod
    employeeCode: string; name: string; department: string;
    netMinor: number; currency: string;
  }>;
  terminations: Array<{     // in comparePeriod but not basePeriod
    employeeCode: string; name: string; department: string;
    netMinor: number; currency: string;
  }>;
  salaryChanges: Array<{    // in both periods, netMinor changed
    employeeCode: string; name: string; department: string;
    baseNetMinor: number; compareNetMinor: number;
    deltaMinor: number;     // positive = increase, negative = decrease
    currency: string;
  }>;
  totals: {
    baseTotalNetMinor: number;
    compareTotalNetMinor: number;
    deltaTotalMinor: number;
    currency: string;
  };
}
```

404 if either period has no run. Diff operates on `PayrollResult` rows — if
either period is `VOIDED`, the diff still runs (voided data is informational).

## Frontend

### `/payroll` — Payroll History Page

Replaces the current minimal `/payroll/page.tsx`. Layout:

```
┌─────────────────────────────────────────────────────────┐
│  Payroll Runs                        [Run Payroll ▶]    │
│                                                         │
│  Status filter: [All] [Completed] [Pending] [Voided]   │
├────────────────────────────────────────────────────────┤
│  Table: Period | Status | Headcount | Total Net | Date │
│  ─────────────────────────────────────────────────────│
│  Jul 2026  ● COMPLETED  42  $84,000   01 Jul 2026     │
│  Jun 2026  ● COMPLETED  41  $82,500   01 Jun 2026 [↔]  │
│  May 2026  ● VOIDED     40  $80,000   voided by admin  │
└────────────────────────────────────────────────────────┘
```

- Clicking a row navigates to `/payroll/[period]` (existing detail page).
- `[↔]` diff icon button on completed rows → opens `PeriodDiffDrawer`.
- `Run Payroll` button → `RunPayrollModal` (same as dashboard; shared component).
- Void button on the detail page `/payroll/[period]` — visible to `ADMIN` only;
  opens a `VoidConfirmModal`.

### `VoidConfirmModal`

- Shows: "Void payroll run for {period}? This will mark the run as voided.
  Employee payslips will remain on record."
- Confirm button calls `useVoidPayrollRun(period)`.
- On success: invalidates `['payroll', 'runs']` + `['payroll', 'run', period]`;
  shows toast; modal closes.
- On 409 (already voided): shows inline "This run has already been voided."

### `PeriodDiffDrawer`

Right-side drawer (not a full page route for MVP). Opens when user clicks diff
icon on a run row or a "Compare with previous" button on the detail page.

Header: "Jun 2026 vs May 2026" with a period selector for `compareTo`.

Three collapsible sections:
1. **Totals Summary** — two side-by-side stat tiles: base period net / compare
   period net + delta amount + delta percentage.
2. **Salary Changes** — table of employees with changed net pay. Columns:
   Employee, Department, Base Net, Compare Net, Δ (colored: green if increase,
   red if decrease).
3. **Headcount Changes** — two sub-tables: "New Hires in {period}" and
   "Terminations since {period}".

Loading skeleton while `usePeriodDiff` is fetching. Empty state if no
differences found ("No changes between {base} and {compare}.").

### `/payroll/[period]` — Run Detail Page Updates

Existing page gains:
- Void button (ADMIN only) in page header → `VoidConfirmModal`.
- "Compare with previous" button → opens `PeriodDiffDrawer` with `compareTo`
  defaulted to the month before.
- Status badge updated to show `VOIDED` variant (red) if applicable.

## Data Layer (`@salary-mgmt/store`)

- `getPayrollRuns(query)` API fn + `usePayrollRuns(query)` hook — `queryKey: ['payroll', 'runs', query]`
- `postVoidPayrollRun(period)` API fn + `useVoidPayrollRun()` mutation
- `getPayrollDiff(period, compareTo)` API fn + `usePayrollDiff(period, compareTo)` hook — `queryKey: ['payroll', 'diff', period, compareTo]`
- Add `PayrollRunSummary`, `PayrollDiffResponse` to `@salary-mgmt/types`

## Key Rules

- Voiding preserves all `PayrollResult` rows — only the `PayrollRun.status`
  changes. Do not cascade-delete.
- `PENDING` runs cannot be voided (422) — only `COMPLETED`.
- Period diff requires both periods to have a run (returns 404 if either
  is missing — not a partial diff).
- The diff endpoint is read-only and idempotent.
- Money in all responses is minor-unit integers; the frontend uses
  `packages/money` for display.

## Non-Negotiable Test Cases

**Unit**
- `PayrollService.listRuns()` returns paginated results with correct status filter. *(covered by integration tests; no isolated unit spec — listRuns is DB-backed)*
- `PayrollService.voidRun()`: voids a COMPLETED run correctly; throws on PENDING; throws on already VOIDED. *(covered by integration tests)*
- `PayrollService.getDiff()`: correctly categorizes new hires, terminations, and salary changes from fixture data; returns 404 when either period has no run. *(pure `computeDiff` helper unit-tested in `payroll-ops.service.spec.ts`; 404 path covered by integration tests)*

**Integration**
- `GET /v1/payroll/runs` returns paginated list; status filter works.
- `POST /v1/payroll/runs/:period/void` 200 for ADMIN + COMPLETED run; 403 for HR_MANAGER; 409 for VOIDED run; 422 for PENDING run.
- `GET /v1/payroll/runs/:period/diff?compareTo=` 200 with correct structure; 400 missing compareTo; 404 for missing period.

**E2E (Playwright)**
- Payroll history page loads with seeded runs.
- ADMIN can void a COMPLETED run; status badge updates to VOIDED.
- HR_MANAGER: void button not visible on detail page.
- Diff drawer opens; salary changes table renders; totals show correct delta.

## Success Criteria

- [ ] `GET /v1/payroll/runs` list replaces the blank form on `/payroll`.
- [x] Void flow: ADMIN only; status updated; results preserved.
- [x] Diff correctly identifies new hires, terminations, and salary changes.
- [x] All non-negotiable test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `payroll_runs` table migration; `PayrollRunEntity`; `PayrollRunSummary` + `PayrollDiffResponse` types | `feat/payroll-ops-pr3-api` |
| RED — `computeDiff` pure helper; unit + integration tests for list, void, diff | `feat/payroll-ops-pr3-api` |
| `listRuns`, `voidRun`, `getDiff` in `PayrollService`; controller routes (GREEN) | `feat/payroll-ops-pr3-api` |

### Frontend

| Phase | Branch |
|---|---|
| Phase 4 — `usePayrollRuns`, `useVoidPayrollRun`, `usePayrollDiff` hooks; store types | `feat/payroll-ops-fe-pr1-hooks` |
| Phase 5 — Payroll history page + status filter + `RunPayrollModal` reuse | `feat/payroll-ops-fe-pr2-history-page` |
| Phase 6 — `VoidConfirmModal` + void button on detail page | `feat/payroll-ops-fe-pr3-void` |
| Phase 7 — `PeriodDiffDrawer` + "compare" button on history + detail | `feat/payroll-ops-fe-pr4-diff-drawer` |
| Phase 8 — Unit + integration + E2E tests | `feat/payroll-ops-fe-pr5-tests` |

Plan: [`docs/plans/payroll-ops.md`](../plans/payroll-ops.md) · Trace: [`traces/payroll-ops.md`](../../traces/payroll-ops.md)
