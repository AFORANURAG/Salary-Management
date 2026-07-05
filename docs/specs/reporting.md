# Spec: Reporting (Aggregate Compensation)

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/reporting`.

## Objective

Answer aggregate compensation questions over payroll results — the organizational view on top of [`payroll.md`](./payroll.md). MVP targets operational visibility, **not** BI-grade dashboards (out of scope).

## Questions It Answers

- Monthly payroll cost by **department** / **country** / **cost center**.
- Total gross / deductions / net for a period across the org or a slice.
- (Per-employee history is served by [`payslips.md`](./payslips.md), not here.)

## API Surface

```
GET /reporting/payroll-cost?period=YYYY-MM&groupBy=department|country|costCenter
GET /reporting/payroll-summary?period=YYYY-MM
```

Response (grouped):
```
{
  period: "2026-06",
  groupBy: "department",
  currency: "USD",
  groups: [{ key: "Engineering", grossMinor, deductionsMinor, netMinor, headcount }],
  ...
}
```

## Key Rules

- Aggregates read from persisted `PayrollResult` rows for the period — consistent with payslips, never live-recomputed.
- **Multi-currency:** aggregates are grouped/summed **per currency** (no FX conversion) — see root Open Question #3. A response carries results per currency rather than a single blended total.
- Grouping keys (`department`, `country`, `costCenter`) reuse the employee fields; `costCenter` depends on the model decision in [`employees.md`](./employees.md).
- Queries run on indexed/aggregated paths suitable for 10k-scale data.

## Non-Negotiable Test Cases

- Grouped totals equal the sum of the underlying `PayrollResult` rows for the period (no double counting).
- Mixed-currency data is reported per currency, never summed across currencies.
- Grouping by each of department / country / cost center returns correct keys and headcounts.

## Success Criteria

- [ ] `payroll-cost?groupBy=department` returns correct per-currency totals matching raw results.
- [ ] `payroll-summary` returns org-wide gross/deductions/net per currency for a period.
- [ ] Reporting queries remain responsive at 10k-result scale locally.

## Frontend

Pages and components in `apps/web`. Client data layer via `@salary-mgmt/store`
(TanStack Query + typed API client). UI primitives from `@salary-mgmt/ui`.

### Pages / Routes

| Route | Description |
|---|---|
| `/reporting` | Reporting hub — period picker + groupBy selector + `ReportingCostTable`; org-wide summary card |

### Components

| Component | Description |
|---|---|
| `ReportingSummaryCard` | Org-wide gross / deductions / net per currency bucket for a period. Loading skeleton. |
| `ReportingCostTable` | Grouped cost breakdown: period + groupBy selector (department / country / costCenter); results table with key, headcount, gross, net, currency. Loading skeleton and empty state. |

### Data Layer (hooks in `@salary-mgmt/store`)

| Hook | Used by |
|---|---|
| `usePayrollCost(period: string, groupBy: GroupByDimension)` | `ReportingCostTable` |
| `usePayrollSummary(period: string)` | `ReportingSummaryCard` |

### Non-Negotiable Frontend Test Cases

**Unit / component (mocked hooks, jsdom)**
- `ReportingCostTable` renders one row per group with correct key, headcount, and net amount.
- `ReportingCostTable` renders loading skeleton while `isLoading` is true.
- `ReportingCostTable` renders empty state when no results exist for the period.
- `ReportingSummaryCard` renders gross, deductions, and net totals per currency bucket.
- `ReportingSummaryCard` renders loading skeleton while `isLoading` is true.

**Integration (real hooks + MSW, jsdom)**
- Reporting page renders `ReportingCostTable` with data from real `usePayrollCost` hook + MSW.
- Reporting page renders `ReportingSummaryCard` with data from real `usePayrollSummary` hook + MSW.

### Frontend Success Criteria

- [ ] Reporting page shows grouped cost breakdown with period + groupBy controls.
- [ ] Summary card shows org-wide totals per currency.
- [ ] All non-negotiable frontend test cases pass (unit + integration).
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Open Questions

- ~~Base-currency conversion ever needed for a blended org total?~~ **Resolved:** No FX conversion for MVP. Results are per-currency buckets only.
- ~~Is `costCenter` in scope as a grouping dimension for MVP?~~ **Resolved:** Yes — `costCenter` exists on `EmployeeEntity` and in `@salary-mgmt/types`; null values are excluded from costCenter grouping results.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| Types, module wiring | `feat/reporting-pr1-foundation` |
| RED — unit + integration specs | `feat/reporting-pr2-test-harness` |
| GREEN — DTOs, service, controller | `feat/reporting-pr3-implementation` |

### Frontend

| Phase | Branch |
|---|---|
| Store API fns + hooks + RED component specs | `feat/reporting-fe-pr1-hooks-red` |
| GREEN — components + page wiring + integration tests | `feat/reporting-fe-pr2-components` |

Plan: [`docs/plans/reporting.md`](../plans/reporting.md) · Trace: [`traces/reporting.md`](../../traces/reporting.md)
