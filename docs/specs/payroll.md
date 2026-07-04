# Spec: Payroll Generation

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/payroll`. **This is the deepest-risk module** — determinism and idempotency live or die here.

## Objective

Generate monthly payroll for a selected pay period: for each employee with an active salary structure, compute **gross, deductions, and net** from that structure and persist a per-employee result. Runs must be **deterministic** and **idempotent** per `(employee, period)`.

## Concepts

- **Pay period** identifier: `YYYY-MM` (monthly cycle, requirements §7).
- A **payroll run** processes all eligible employees for one period.
- A **payroll result** is the computed, persisted outcome for one `(employee, period)`.

## Data Model

`PayrollResult`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `employeeId` | uuid (FK) | |
| `period` | string `YYYY-MM` | |
| `structureId` | uuid (FK → SalaryStructure) | the exact version used — snapshot anchor |
| `grossMinor` | integer | |
| `deductionsMinor` | integer | |
| `netMinor` | integer | |
| `currency` | string | |
| `generatedAt` | timestamptz | |

**Uniqueness constraint:** `(employeeId, period)` — this is the idempotency key.

## Computation

Pure function (see root spec Code Style for `computePayroll`):

```
gross      = Σ amountMinor where kind = EARNING
deductions = Σ amountMinor where kind = DEDUCTION
net        = gross − deductions
```

- Inputs come solely from the salary-structure version active for that period (resolved per [`salary-structure.md`](./salary-structure.md)).
- No proration, bonuses, or tax engine in MVP (out of scope).
- All arithmetic in integer minor units.

## Key Rules

- **Idempotent:** re-running a period that already has results returns 409 — never creates duplicates, never silently changes existing rows.
- **Deterministic:** same structure version + same period ⇒ identical result, every time.
- **Snapshot by reference:** each result records the `structureId` used, so later structure edits cannot retroactively change a generated result.
- Employees without an active structure for the period are skipped and reported, not failed.
- Batch processing must handle 10k employees efficiently (chunked, not row-by-row round trips).

## API Surface

```
POST   /v1/payroll/runs                      → { period } : generate run for the period
GET    /v1/payroll/runs/:period              → run summary (counts, totals, skipped)
GET    /v1/payroll/runs/:period/results      → individual results; ?employeeId= filter
```

## Non-Negotiable Test Cases (Backend)

- Running the same period twice returns 409 and produces no duplicate `PayrollResult` rows.
- Same inputs yield identical gross/deductions/net across repeated runs (determinism).
- Editing an employee's salary structure **after** a run does not change that run's already-generated result.
- An employee with no active structure for the period is skipped and appears in the run's "skipped" report.

## Backend Success Criteria

- [x] `POST /v1/payroll/runs` for `YYYY-MM` produces exactly one result per eligible employee.
- [x] Re-posting the same period returns 409.
- [x] Batch run over 10k employees completes in < 30s locally (actual: ~5s).
- [x] Each result references the exact `structureId` used.

---

## Frontend

Pages and components in `apps/web`. Client data layer via `@salary-mgmt/store`
(TanStack Query + typed API client). UI primitives from `@salary-mgmt/ui`.

### Pages

| Route | Description |
|---|---|
| `/payroll` | Payroll hub — list of past runs by period; button to trigger a new run |
| `/payroll/[period]` | Run detail — summary card (processed/skipped/totals) + per-employee results table |

### Components

| Component | Location | Notes |
|---|---|---|
| `RunPayrollDialog` | `app/payroll/components/` | Period picker (YYYY-MM); confirm/cancel; shows run summary on success |
| `PayrollRunList` | `app/payroll/components/` | Table of past runs: period, processed count, total gross/net; row click → detail |
| `PayrollSummaryCard` | `app/payroll/[period]/components/` | Processed, skipped count, total gross, total net for the period |
| `PayrollResultsTable` | `app/payroll/[period]/components/` | Per-employee results: name, gross, deductions, net, currency; filterable by employee |

### Data layer (hooks in `@salary-mgmt/store`)

| Hook | Used by |
|---|---|
| `usePayrollRuns()` | Payroll hub — list of all periods that have runs |
| `usePayrollSummary(period: string)` | Run detail — summary card |
| `usePayrollResults(period: string, query?: { employeeId?: string })` | Run detail — results table |
| `useRunPayroll()` | RunPayrollDialog — mutation, POST /v1/payroll/runs |

### Non-Negotiable Frontend Test Cases

**Component (mocked hooks, jsdom)**
- `PayrollRunList` renders period, processed count, and total net columns correctly.
- `PayrollRunList` shows empty state when no runs exist.
- `RunPayrollDialog` calls `useRunPayroll` with the entered period on submit.
- `RunPayrollDialog` shows a 400 validation error for an invalid period format (e.g. `2026-13`).
- `RunPayrollDialog` shows a 409 conflict message when the period has already been run.
- `PayrollSummaryCard` renders processed, skipped, gross, and net totals.
- `PayrollResultsTable` renders one row per result with correct amounts.
- `PayrollResultsTable` filters to a single employee when an employeeId is provided.

**Integration (real hooks + MSW, jsdom)**
- `/payroll` page renders the run list fetched via the real `usePayrollRuns` hook with MSW.
- Clicking "Run Payroll", entering a valid period, and confirming triggers `POST /v1/payroll/runs` and re-fetches the run list.
- `/payroll/[period]` page renders the summary card and results table via real hooks + MSW.
- Providing an `employeeId` filter on the results table triggers a new request with the correct query param.

**E2E (Playwright, full stack)**
- `/payroll` page loads and shows the run list (or empty state).
- Clicking "Run Payroll" and entering a valid period produces a success summary.
- Navigating to a past run's detail page shows the correct summary and results rows.
- Attempting to re-run the same period shows a 409 conflict message in the dialog.

### Frontend Success Criteria

- [x] `/payroll` page is interactive: trigger a run, see the result, navigate to detail.
- [x] All non-negotiable frontend test cases pass (component + integration + E2E).
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [x] Playwright E2E suite passes against the running Docker stack.

---

## Implementation

### Backend

| Phase | Branch |
|---|---|
| Types, entity, migration, test harness | `feat/payroll-pr1-foundation` |
| RED unit + integration specs | `feat/payroll-pr2-test-harness` |
| GREEN — DTOs, service, controller | `feat/payroll-pr3-implementation` |
| Scale spec — 10k employees in < 30s | `feat/payroll-pr4-scale` |

### Frontend

| Phase | Branch |
|---|---|
| Store API fns + hooks + RED component specs | `feat/payroll-fe-pr1-hooks-red` |
| GREEN — components + page wiring | `feat/payroll-fe-pr2-components` |
| Integration + E2E tests | `feat/payroll-fe-pr3-tests` |
