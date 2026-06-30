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

## Open Questions

- Any required payslip fields beyond the breakdown above (employer details, tax IDs)? (Note: statutory content is out of scope.)
