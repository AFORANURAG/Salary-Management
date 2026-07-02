# Trace: Employees

> Spec: [`docs/specs/employees.md`](../docs/specs/employees.md) · Plan: [`docs/plans/employees.md`](../docs/plans/employees.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET1 | Shared employee contracts in `packages/types` | `8e1df56` | types build + typecheck pass |
| ET2 | Employee entity + first migration (schema — approved) | `8e1df56` | `migration:run` applied table, enum, 6 indexes, unique constraints |
| ET3 | Integration test harness (Vitest + SWC + `@nestjs/testing`, auto-created `salary_mgmt_test`, per-test truncation) | `d254b9a` | harness smoke test green |

### Phase 2 — RED (failing test suite)

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET4 | Unit specs (DTO validation, list-query parsing) | `d254b9a` | authored RED |
| ET5 | Integration specs (CRUD + list) | `d254b9a` | authored RED |
| ET5b | Scale/perf specs (enabled after ET9) | `d254b9a` | authored, `describe.skip` |

**RED checkpoint:** reached — suite fails for the right reason (routes 404, parser throws, DTOs undecorated).

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET6 | Create + fetch one | `9abdb78` | create/fetch specs green |
| ET7 | Update + soft delete | `9abdb78` | update/soft-delete specs green |
| ET8 | List (search/filter/paginate/sort) | `9abdb78` | list specs green |

**GREEN checkpoint:** 48 passed / 3 skipped; root `pnpm typecheck && pnpm lint && pnpm test` all green.

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
