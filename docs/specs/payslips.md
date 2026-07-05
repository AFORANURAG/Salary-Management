# Spec: Payslips & Salary History

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/payslips`.

## Objective

Present a per-employee, per-period **payslip** with a line-item breakdown, and expose **salary history** so past pay can be reviewed and reconstructed. Read-oriented module built on top of [`payroll.md`](./payroll.md) results and [`salary-structure.md`](./salary-structure.md) versions.

## What a Payslip Shows

For a given `(employee, period)`:
- Employee identity (name, code, department, country).
- Currency.
- Earnings line items (code + `amountMinor`) → **gross**.
- Deduction line items (code + `amountMinor`) → **total deductions**.
- **Net pay**.
- The pay period and generation date.

All amounts sourced from the `PayrollResult` and the `structureId` it references — **never recomputed live** from the current structure (which may have changed since).

## API Surface

```
GET /employees/:id/payslips                 → list periods with results (history index)
GET /employees/:id/payslips/:period         → full payslip breakdown for that period
```

> PDF export is **out of scope** (stretch). The in-app view is the deliverable.

## Key Rules

- Payslips are **reconstructed from persisted snapshots**, not from live structure data — guarantees historical accuracy.
- A payslip exists only where a `PayrollResult` exists for that `(employee, period)`.
- History is immutable from this module's perspective (read-only).

## Non-Negotiable Test Cases

- Payslip line items + gross/deductions/net exactly match the stored `PayrollResult` for the period.
- After a salary-structure change and a new run, an **old** period's payslip is unchanged.
- History index lists every period the employee has a result for, newest first.

## Success Criteria

- [ ] Payslip view renders full line-item breakdown for any past period.
- [ ] History index correctly enumerates an employee's pay periods.
- [ ] Values are read from snapshots, verified identical to the originating run.

## Frontend

Pages and components in `apps/web`. Client data layer via `@salary-mgmt/store`
(TanStack Query + typed API client). UI primitives from `@salary-mgmt/ui`.

### Pages / Routes

| Route | Description |
|---|---|
| `/employees/[id]` | Extend existing detail page: add payslip history section (period list, newest first) |
| `/employees/[id]/payslips/[period]` | Full payslip view — earnings table, deductions table, net summary |

### Components

| Component | Description |
|---|---|
| `PayslipHistoryList` | List of past pay periods on the employee detail page. Each row shows `period`, `grossMinor`, `netMinor`, `currency`. Row click navigates to `/employees/[id]/payslips/[period]`. Loading skeleton and empty state (no runs yet). |
| `PayslipCard` | Full payslip on the detail route. Shows employee identity (name, code, department, country), currency, period, earnings table, deductions table, gross/deductions/net summary footer. |

### Data Layer (hooks in `@salary-mgmt/store`)

| Hook | Used by |
|---|---|
| `usePayslipHistory(employeeId: string)` | `PayslipHistoryList` — fetches all periods for the employee |
| `usePayslip(employeeId: string, period: string)` | `PayslipCard` — fetches full breakdown for one period |

### Non-Negotiable Frontend Test Cases

**Unit / component (mocked hooks, jsdom)**
- `PayslipHistoryList` renders one row per history item with correct period and net amount.
- `PayslipHistoryList` renders loading skeleton while `isLoading` is true.
- `PayslipHistoryList` renders empty state when the employee has no pay runs.
- `PayslipCard` renders earnings rows, deductions rows, gross, deductions total, and net pay.
- `PayslipCard` renders loading skeleton while `isLoading` is true.

**Integration (real hooks + MSW, jsdom)**
- Employee detail page renders `PayslipHistoryList` with data from real `usePayslipHistory` hook + MSW `GET /v1/employees/:id/payslips`.
- Payslip detail page renders `PayslipCard` with data from real `usePayslip` hook + MSW `GET /v1/employees/:id/payslips/:period`.

**E2E (Playwright, full stack)**
- Employee detail page shows the payslip history list after a payroll run.
- Clicking a period row navigates to the payslip detail page and shows the correct line items.
- Net pay on the payslip matches the value shown in the history list row.

### Frontend Success Criteria

- [ ] Employee detail page shows payslip history list or a clear empty state.
- [ ] Payslip detail page shows full earnings/deductions/net breakdown.
- [ ] All non-negotiable frontend test cases pass (unit + integration + E2E).
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [ ] Playwright E2E suite passes against the running Docker stack.

## Open Questions

- Any required payslip fields beyond the breakdown above (employer details, tax IDs)? (Note: statutory content is out of scope.)

## Implementation

### Backend

| Phase | Branch |
|---|---|
| Types, module wiring, test harness update | `feat/payslips-pr1-foundation` |
| RED — unit + integration specs | `feat/payslips-pr2-test-harness` |
| GREEN — service, controller, module | `feat/payslips-pr3-implementation` |

### Frontend

| Phase | Branch |
|---|---|
| Store API fns + hooks + RED component specs | `feat/payslips-fe-pr1-hooks-red` |
| GREEN — components + page wiring | `feat/payslips-fe-pr2-components` |
| Integration + E2E tests | `feat/payslips-fe-pr3-tests` |

Plan: [`docs/plans/payslips.md`](../plans/payslips.md) · Trace: [`traces/payslips.md`](../../traces/payslips.md)
