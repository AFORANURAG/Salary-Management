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

Branch: `feat/payslips-pr3-implementation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS7 | `PayslipsService.getHistory()` — asserts employee exists, queries `payroll_results` by `employeeId` ordered `period DESC`, maps to `PayslipSummary[]` | `c2477a6` | integration history + empty array specs green |
| PS8 | `PayslipsService.getPayslip()` — asserts employee exists, loads `PayrollResult` for `(employeeId, period)`, loads `SalaryComponent` rows by `structureId`, calls `buildPayslip()` | `c2477a6` | all unit + integration specs green |
| PS9 | `PayslipsController` at `employees/:employeeId/payslips`; `PayslipsModule` wired with controller + service; fix: controller path must not include `v1` prefix (global prefix adds it) | `c2477a6` | 114/114 tests green; typecheck + lint clean |

### Phase 4 — Frontend: Store hooks + RED specs

Branch: `feat/payslips-fe-pr1-hooks-red`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS10 | `getPayslipHistory`, `getPayslip` API fns in `@salary-mgmt/store/src/api/payslips.ts`; `usePayslipHistory`, `usePayslip` hooks in `query/payslips.ts`; `history` key added to `payslips` query-key family; re-exported from `query/index.ts` and `index.ts` | `2518623` | `pnpm --filter @salary-mgmt/store typecheck` clean |
| PS11 | RED unit specs: `payslip-history-list.test.tsx` (3 cases — rows, skeleton, empty state); `payslip-card.test.tsx` (2 cases — line items, skeleton) | `2518623` | RED — component files not found |

### Phase 5 — Frontend: Components + page wiring

Branch: `feat/payslips-fe-pr2-components`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS12 | `PayslipHistoryList` — period rows with net pay via `formatMinor`, loading skeleton (`data-slot="skeleton"`), empty state ("No payslips found."); each row is a `Link` to the payslip detail route | `f854610` | unit spec 3/3 GREEN |
| PS13 | `PayslipHistoryList` wired into `/employees/[id]/page.tsx` below salary structure section | `f854610` | typecheck clean |
| PS14 | `PayslipCard` — earnings table, deductions table, gross/deductions/net summary footer, loading skeleton; located at `payslips/[period]/components/payslip-card.tsx` | `f854610` | unit spec 2/2 GREEN |
| PS15 | New route `apps/web/app/employees/[id]/payslips/[period]/page.tsx` — client page rendering `PayslipCard` with `id` + `period` params | `f854610` | typecheck clean; 55/55 tests green |

### Phase 6 — Frontend: Integration tests (MSW + real hooks)

Branch: `feat/payslips-fe-pr3-integration`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS16 | MSW handlers in `test/msw/handlers/payslips.ts`: `GET /v1/employees/:id/payslips` + `GET /v1/employees/:id/payslips/:period`; registered in `test/msw/server.ts` | `065c82f` | server picks up handlers; existing 57 tests unaffected |
| PS17 | Integration: `payslip-history.integration.test.tsx` — `EmployeeDetailPage` renders period rows via real `usePayslipHistory` + MSW | `065c82f` | GREEN |
| PS18 | Integration: `payslip-detail.integration.test.tsx` — `PayslipDetailPage` renders name, employeeCode, line items via real `usePayslip` + MSW | `065c82f` | GREEN; 57/57 tests pass; typecheck + lint clean |

### Phase 7 — Frontend: E2E tests (Playwright, full stack)

Branch: `feat/payslips-fe-pr4-e2e`

| Task | Description | Commit | Verification |
|---|---|---|---|
| PS19 | | | |
| PS20 | | | |
| PS21 | | | |

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

- Controller path must not include the `v1` prefix — `app.setGlobalPrefix("v1")` in `test-app.ts` and `main.ts` prepends it; doubling it causes all routes to 404.
