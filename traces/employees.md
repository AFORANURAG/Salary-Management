# Trace: Employees

> Spec: [`docs/specs/employees.md`](../docs/specs/employees.md) · Plan: [`docs/plans/employees.md`](../docs/plans/employees.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET1 | Shared employee contracts in `packages/types` | _pending_ | |
| ET2 | Employee entity + first migration (schema — ask-first) | _pending_ | |
| ET3 | Integration test harness | _pending_ | |

### Phase 2 — RED (failing test suite)

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET4 | Unit specs (DTO validation, list-query parsing) | _pending_ | |
| ET5 | Integration specs (CRUD + list) | _pending_ | |
| ET5b | Scale/perf specs (enabled after ET9) | _pending_ | |

**RED checkpoint:** _pending_ — confirm all fail for the right reason.

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET6 | Create + fetch one | _pending_ | |
| ET7 | Update + soft delete | _pending_ | |
| ET8 | List (search/filter/paginate/sort) | _pending_ | |

### Phase 4 — Data + refactor

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET9 | Seed ~10k employees (dependency — ask-first) | _pending_ | |
| ET10 | Refactor + enable ET5b + perf check | _pending_ | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Search by partial name/code/email — correct, stable, paginated over 10k | _pending_ | |
| Combined filters (department + country + status) compose with search | _pending_ | |
| Soft-delete preserves payroll/payslip references | _pending_ | |
| List p95 < 300ms locally over 10k on indexed queries | _pending_ | |
| Pagination returns correct `total` and stable ordering across pages | _pending_ | |
| CRUD enforces uniqueness on `employeeCode` and `email` | _pending_ | |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
