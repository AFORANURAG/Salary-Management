# Trace: Payslips & Salary History

> Spec: [`docs/specs/payslips.md`](../docs/specs/payslips.md) · Plan: [`docs/plans/payslips.md`](../docs/plans/payslips.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

Branch: `feat/payslips-pr1-foundation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS1 | `PayslipLineItem`, `PayslipSummary`, `Payslip` interfaces added to `@salary-mgmt/types` | `7f97b5e` | types build + typecheck pass |
| PS2 | `PayslipsModule` wired with `TypeOrmModule.forFeature([PayrollResultEntity, SalaryStructureEntity, SalaryComponentEntity, EmployeeEntity])`; registered in `AppModule` (already present) | `7f97b5e` | app boots; `pnpm --filter api typecheck` clean |
| PS3 | Verified `TestDataSource` + `truncateAll` require no changes — `payroll_results` CASCADE already covers all tables in FK order | `7f97b5e` | 104/104 existing tests green |

### Phase 2 — RED

Branch: `feat/payslips-pr2-test-harness`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS4 | Unit spec: `buildPayslip` — 4 cases (mixed, earnings-only, deductions-only, empty) | `4eef25f` | RED — `./payslips.service` not found |
| PS5 | Integration spec: `GET /v1/employees/:id/payslips` — history newest-first, empty array, 404 unknown | `4eef25f` | RED — routes 404 (no controller) |
| PS6 | Integration spec: `GET /v1/employees/:id/payslips/:period` — full payslip, 404 unknown employee, 404 no result for period | `4eef25f` | RED — routes 404 (no controller) |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS7 | `PayslipsService.getHistory()` — asserts employee exists, queries `payroll_results` by `employeeId` ordered `period DESC`, maps to `PayslipSummary[]` | this commit | integration history + empty array specs green |
| PS8 | `PayslipsService.getPayslip()` — asserts employee exists, loads `PayrollResult` for `(employeeId, period)`, loads `SalaryComponent` rows by `structureId`, calls `buildPayslip()` | this commit | all unit + integration specs green |
| PS9 | `PayslipsController` at `employees/:employeeId/payslips`; `PayslipsModule` wired with controller + service; fix: controller path must not include `v1` prefix (global prefix adds it) | this commit | 114/114 tests green; typecheck + lint clean |

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
