# Trace: Payroll Generation

> Spec: [`docs/specs/payroll.md`](../docs/specs/payroll.md) · Plan: [`docs/plans/payroll.md`](../docs/plans/payroll.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR1 | `PayrollResult`, `PayrollRunSummary`, `PayrollResultQuery` added to `@salary-mgmt/types` | 1c07962 | types build + typecheck pass |
| PR2 | `PayrollResultEntity` + migration: `payroll_results` table, unique `(employee_id, period)`, indexes, FKs to employees + salary_structures (RESTRICT) | 1c07962 | `migration:run` applied table, unique constraint, 2 indexes, 2 FKs |
| PR3 | `TestDataSource` + `global-setup` updated with `PayrollResultEntity` and new migration; `truncateAll` covers `payroll_results` first (FK order) | 1c07962 | 76/76 existing tests still green |

### Phase 2 — RED

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR4 | Unit specs: `computePayroll` (5 cases), `resolvePeriodStructure` (7 cases) | 000f951 | RED — `payroll.service.ts` not found |
| PR5 | Integration specs: 10× POST runs, 2× GET summary, 3× GET results | 000f951 | RED — all routes 404 (controller not registered) |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR6 | | | |
| PR7 | | | |
| PR8 | | | |
| PR9 | | | |

### Phase 4 — Scale

| Task | Description | Commit | Verification |
|---|---|---|---|
| PR10 | | | |
| PR11 | | | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| `POST /payroll/runs` produces exactly one result per eligible employee | | |
| Re-posting the same period returns 409 | | |
| Each result references the exact `structureId` used | | |
| Historical structure version used (not latest) | | |
| 10k-employee run completes in < 30 s locally | | |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
