# Spec: Dashboard (Operational Home)

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/dashboard`,
> `apps/web/app/(authenticated)/page.tsx`, and related components.
> Depends on [`hr-auth.md`](./hr-auth.md) and [`app-shell.md`](./app-shell.md).
> Aggregates data from: employees, payroll, reporting modules.

## Objective

Replace the health-check homepage with a real operational hub. An HR user
landing on `/` immediately sees the state of the workforce and the last payroll
cycle, can navigate to any domain in one click, and can trigger payroll for the
current period without leaving the page.

The dashboard is intentionally **read-mostly** — it surfaces information;
actions are shallow (navigate or open a confirm modal). It must load fast:
the backend delivers all stat-card data in a single aggregated endpoint rather
than requiring the frontend to fan out multiple calls.

## Backend: `GET /v1/dashboard/summary`

Single endpoint; returns everything the dashboard needs above the fold.

### Request

```
GET /v1/dashboard/summary?period=YYYY-MM
```

`period` defaults to the current calendar month (server-side) if omitted.

### Response

```ts
{
  period: string;                  // "2026-07"
  stats: {
    totalActiveEmployees: number;
    totalPayrollCostMinor: number; // sum of netMinor for the period; 0 if no run
    payrollCostCurrency: string;   // dominant currency (most employees); "MIXED" if >1
    avgBaseSalaryMinor: number;    // avg of active employees' base salary; 0 if none
    avgBaseSalaryCurrency: string;
  };
  lastPayrollRun: {
    period: string;
    status: "PENDING" | "COMPLETED" | "VOIDED";
    headcount: number;
    totalNetMinor: number;
    currency: string;
    ranAt: string | null;          // ISO timestamp
  } | null;                        // null if no run has ever been executed
  departmentBreakdown: Array<{
    department: string;
    headcount: number;
    totalNetMinor: number;
    currency: string;
  }>;
  recentPayrollRuns: Array<{       // last 5 completed or voided runs
    period: string;
    status: string;
    headcount: number;
    totalNetMinor: number;
    currency: string;
    ranAt: string | null;
  }>;
}
```

### Implementation notes

- `stats` — single `QueryBuilder` join: active employees count, latest salary
  structures for base salary avg, `PayrollResult` sum for the given period.
- `lastPayrollRun` — most recent `PayrollRun` row by `ranAt DESC` (any status).
- `departmentBreakdown` — reuses the same aggregation logic as
  `ReportingService.getPayrollCost(groupBy=department)` for the given period;
  zero-headcount departments from active employees are included with
  `totalNetMinor: 0` when no payroll run exists.
- `recentPayrollRuns` — last 5 `PayrollRun` rows ordered by `ranAt DESC`.
- Protected: `JwtAuthGuard` + any authenticated role.

## Data Model

No new entities. `DashboardModule` imports:
- `TypeOrmModule.forFeature([EmployeeEntity, PayrollRunEntity, PayrollResultEntity, SalaryStructureEntity])`

## Frontend: Dashboard Page

### Layout (top → bottom)

```
┌─────────────────────────────────────────────────────────┐
│  Period picker   [← prev month]  July 2026  [next →]    │
├────────────┬────────────┬────────────┬───────────────────┤
│ StatCard   │ StatCard   │ StatCard   │ StatCard          │
│ Active     │ Payroll    │ Avg Base   │ Last Run          │
│ Employees  │ Cost       │ Salary     │ Status            │
├────────────┴────────────┴────────────┴───────────────────┤
│  Quick Actions                                           │
│  [Employees]  [Run Payroll ▶]  [Reports]  [Export]      │
├──────────────────────────┬──────────────────────────────┤
│  Department Breakdown    │  Recent Payroll Runs          │
│  (Bar chart: headcount   │  (Timeline list: last 5 runs  │
│   per dept, colored)     │   with status badge + cost)   │
└──────────────────────────┴──────────────────────────────┘
```

### Stat Cards

| Card | Value | Secondary label |
|---|---|---|
| Active Employees | `stats.totalActiveEmployees` | "employees" |
| Payroll Cost | formatted `stats.totalPayrollCostMinor` | period label; "No run yet" if 0 and no run |
| Avg Base Salary | formatted `stats.avgBaseSalaryMinor` | "per employee (active)" |
| Last Run | `lastPayrollRun.status` badge | "period · headcount employees" |

- Money values formatted with `packages/money` helpers.
- Skeleton shown while loading (4-card skeleton row).
- Cards are not links — they are summary tiles only.

### Quick Actions

Four cards with icon + label + CTA button:

| Card | Icon | Action |
|---|---|---|
| Employees | `Users` | Button "View All" → `/employees` |
| Run Payroll | `Play` | Button "Run Now" → opens `RunPayrollModal` |
| Reports | `BarChart2` | Button "Open" → `/reporting` |
| Export Data | `Download` | Button "Export" → `/export` (future) or dropdown |

`RunPayrollModal`:
- Confirms period (defaulted to current month, editable).
- Calls `POST /v1/payroll/runs` with `{ period }`.
- On success: invalidates `dashboard.summary` query + `payroll.runs` query, shows toast.
- On 409 (run already exists): shows "Run already exists for {period}" error inline.
- Only rendered/visible to `HR_MANAGER` and `ADMIN` — `HR_VIEWER` sees a disabled button
  with tooltip "Read-only access".

### Department Breakdown Chart

Library: `recharts` (add to `apps/web` dependencies — ask first).

`BarChart` (horizontal):
- X axis: headcount (integer)
- Y axis: department names
- Each bar: colored by department (fixed palette, 5 colors for 5 departments)
- Tooltip on hover: "{dept}: {headcount} employees, {totalNet} net payroll"
- Shows "No payroll data for this period" empty state when all `totalNetMinor` are 0
  but renders headcount bars regardless (bar chart is headcount, not payroll cost)
- Responsive via `<ResponsiveContainer width="100%" height={240}>`

### Recent Payroll Runs

List of up to 5 items:
- Period label (e.g. "Jun 2026")
- Status badge: `COMPLETED` → green, `PENDING` → yellow, `VOIDED` → red
- Headcount + formatted net total
- `ranAt` formatted as "DD MMM YYYY HH:mm"
- Each row is a link → `/payroll/[period]`
- Empty state: "No payroll runs yet. Use Run Payroll to process the first one."

### Period Picker

- Prev/Next month chevron buttons.
- Displays "Month YYYY" label.
- On change: re-fetches `useDashboardSummary(period)`.
- Cannot navigate to a future month.

## Data Layer (`@salary-mgmt/store`)

- `getDashboardSummary(period: string)` API fn
- `useDashboardSummary(period: string)` hook — `queryKey: ['dashboard', 'summary', period]`, `staleTime: 60_000`
- `useRunPayroll()` mutation — wraps `POST /v1/payroll/runs`; already exists in store if payroll hooks are present; otherwise add here

## Key Rules

- Dashboard is the first page an authenticated user sees — its p95 load time
  must stay under 500ms locally (single API call, not fan-out).
- `departmentBreakdown` always shows all 5 departments (zero-headcount ones
  have a 0-length bar, not an absent bar).
- `RunPayrollModal` is idempotent from the user's perspective: if a run exists,
  the modal shows an informative error rather than running again.
- Money formatting uses `packages/money` — never raw integer division to display.

## Non-Negotiable Test Cases

**Unit / component**
- `StatCard` renders value, label, and skeleton state.
- `DepartmentBarChart` renders correct bar count from fixture data; shows empty state for all-zero data.
- `RecentRunsTable` renders period, status badge, and net total; empty state when list is empty.
- `RunPayrollModal` calls `useRunPayroll` on submit; shows 409 error inline without dismissing modal.
- Period picker: "prev" decrements month; "next" is disabled on current month.

**Integration (MSW)**
- Dashboard page renders all 4 stat cards with values from MSW fixture.
- Period change triggers new `GET /v1/dashboard/summary?period=...` request.
- `RunPayrollModal` submit → MSW 201 → toast shown, modal closed.
- `RunPayrollModal` submit → MSW 409 → inline error, modal stays open.

**E2E (Playwright)**
- Dashboard loads and all 4 stat cards show non-skeleton content.
- Clicking "View All" on Employees card navigates to `/employees`.
- `HR_MANAGER` opens Run Payroll modal; submits; sees success toast.
- `HR_VIEWER` sees Run Payroll button disabled with tooltip.
- Department chart renders (at least one bar visible for seeded data).

## Success Criteria

- [ ] `GET /v1/dashboard/summary` p95 < 500ms locally against seeded data.
- [ ] All stat cards populated correctly from the aggregated response.
- [ ] `departmentBreakdown` shows all 5 departments including zero-headcount ones.
- [ ] All non-negotiable test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## New Dependencies

Ask before installing:

| Package | Location | Purpose |
|---|---|---|
| `recharts` | `apps/web` | Department bar chart |

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `DashboardModule` stub, `DashboardSummaryResponse` type, `@salary-mgmt/types` additions | `feat/dashboard-pr1-types-module` |
| RED — unit + integration tests for summary endpoint | `feat/dashboard-pr2-test-harness` |
| `DashboardService` + `DashboardController` (GREEN) | `feat/dashboard-pr3-api` |

### Frontend

| Phase | Branch |
|---|---|
| `useDashboardSummary` hook + `getDashboardSummary` API fn + MSW handler | `feat/dashboard-fe-pr1-hooks` |
| `StatCard`, `QuickActions`, `RunPayrollModal` components | `feat/dashboard-fe-pr2-stat-cards` |
| `DepartmentBarChart` + `recharts` wiring | `feat/dashboard-fe-pr3-chart` |
| `RecentPayrollRuns` list + period picker + page assembly | `feat/dashboard-fe-pr4-page` |
| Unit + integration + E2E tests | `feat/dashboard-fe-pr5-tests` |

Plan: [`docs/plans/dashboard.md`](../plans/dashboard.md) · Trace: [`traces/dashboard.md`](../../traces/dashboard.md)
