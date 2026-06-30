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

- **Idempotent:** re-running a period that already has results is a no-op (or an explicit, opt-in recompute) — never creates duplicates, never silently changes existing rows.
- **Deterministic:** same structure version + same period ⇒ identical result, every time.
- **Snapshot by reference:** each result records the `structureId` used, so later structure edits cannot retroactively change a generated result.
- Employees without an active structure for the period are skipped and reported, not failed.
- Batch processing must handle 10k employees efficiently (chunked, not row-by-row round trips).

## API Surface

```
POST   /payroll/runs            → { period } : generate run for the period
GET    /payroll/runs/:period    → run summary (counts, totals, skipped)
GET    /payroll/runs/:period/results?employeeId=  → individual results
```

## Non-Negotiable Test Cases

- Running the same period twice produces no duplicate `PayrollResult` rows and identical values (idempotency).
- Same inputs yield identical gross/deductions/net across repeated runs (determinism).
- Editing an employee's salary structure **after** a run does not change that run's already-generated result.
- An employee with no active structure for the period is skipped and appears in the run's "skipped" report.

## Success Criteria

- [ ] `POST /payroll/runs` for `YYYY-MM` produces exactly one result per eligible employee.
- [ ] Re-posting the same period is a no-op.
- [ ] Batch run over 10k employees completes within an acceptable local time budget (target: confirm with reviewer).
- [ ] Each result references the exact `structureId` used.

## Open Questions

- Should re-running a period be hard-blocked, or allowed via an explicit `recompute=true` that supersedes prior results (keeping history)?
- Acceptable wall-clock budget for a 10k-employee run?
