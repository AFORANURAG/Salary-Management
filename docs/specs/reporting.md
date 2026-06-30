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

## Open Questions

- Base-currency conversion ever needed for a blended org total? (root Open Question #3)
- Is `costCenter` in scope as a grouping dimension for MVP? (depends on [`employees.md`](./employees.md))
