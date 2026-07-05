# Trace: Payslips & Salary History

> Spec: [`docs/specs/payslips.md`](../docs/specs/payslips.md) · Plan: [`docs/plans/payslips.md`](../docs/plans/payslips.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS1 | `PayslipLineItem`, `PayslipSummary`, `Payslip` interfaces added to `@salary-mgmt/types` | this commit | types build + typecheck pass |
| PS2 | `PayslipsModule` wired with `TypeOrmModule.forFeature([PayrollResultEntity, SalaryStructureEntity, SalaryComponentEntity, EmployeeEntity])`; registered in `AppModule` (already present) | this commit | app boots; `pnpm --filter api typecheck` clean |
| PS3 | Verified `TestDataSource` + `truncateAll` require no changes — `payroll_results` CASCADE already covers all tables in FK order | this commit | 104/104 existing tests green |

### Phase 2 — RED

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS4 | | | |
| PS5 | | | |
| PS6 | | | |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS7 | | | |
| PS8 | | | |
| PS9 | | | |

### Phase 4 — Frontend: Store hooks + RED specs

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS10 | | | |
| PS11 | | | |

### Phase 5 — Frontend: Components + page wiring

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS12 | | | |
| PS13 | | | |
| PS14 | | | |
| PS15 | | | |

### Phase 6 — Frontend: Integration + E2E tests

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS16 | | | |
| PS17 | | | |
| PS18 | | | |
| PS19 | | | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Payslip line items + gross/deductions/net match stored `PayrollResult` | | |
| Old period's payslip unchanged after structure update + new run | | |
| History index lists all periods newest-first | | |
| Employee detail page shows payslip history or clear empty state | | |
| Payslip detail page shows full earnings/deductions/net breakdown | | |
| All non-negotiable frontend test cases pass (unit + integration + E2E) | | |
| `pnpm typecheck && pnpm lint && pnpm test` green from repo root | | |
| Playwright E2E suite passes against running Docker stack | | |

## Learnings

_To be filled during implementation._
