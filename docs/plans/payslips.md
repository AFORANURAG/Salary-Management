# Implementation Plan: Payslips & Salary History

> Source spec: [`../specs/payslips.md`](../specs/payslips.md) · Trace log: [`../../traces/payslips.md`](../../traces/payslips.md)

## Overview

Read-only module that reconstructs per-employee payslips from persisted
`PayrollResult` rows and the `SalaryStructure`/`SalaryComponent` snapshot they
reference. No new tables — joins existing data. Backend across three stacked
branches; frontend across three stacked branches.

Built **test-first**: RED suite authored before any implementation.

## Architecture Decisions

- **No new migrations** — payslips are a read-only view over `payroll_results`
  joined to `salary_structures` + `salary_components`. The schema is complete.
- **Service joins `PayrollResultEntity` → `SalaryStructureEntity` → `SalaryComponentEntity`**
  via existing FK relations (`structureId`). Employee identity joined via
  `employeeId`.
- **Component amounts come from the snapshot** — `structureId` on the result
  pins which structure version was used; the service loads components from that
  version, never from the current active structure.
- **History index uses existing `idx_payroll_results_employee_id` index** —
  no additional indexes needed; `ORDER BY period DESC` on a small per-employee
  result set is cheap.
- **`PayslipsModule` imports `TypeORM` repos for 4 entities** — `PayrollResult`,
  `SalaryStructure`, `SalaryComponent`, `Employee` (for identity fields).
- **New shared types** — `PayslipSummary` (index row) and `Payslip` (full
  breakdown with line items) added to `@salary-mgmt/types`.

## Ask-First Boundaries

- Any DB schema changes (none expected).
- New dependencies beyond what is already installed.

---

## Task List

### Phase 1 — Foundation

Branch: `feat/payslips-pr1-foundation`

| Task | Description | Commit |
|---|---|---|
| PS1 | `packages/types`: add `PayslipSummary` and `Payslip` + `PayslipLineItem` interfaces | `feat(types,api): add payslip type contracts and wire payslips module` |
| PS2 | Wire `PayslipsModule`: import `TypeOrmModule.forFeature([PayrollResultEntity, SalaryStructureEntity, SalaryComponentEntity, EmployeeEntity])`; register in `AppModule` | (same commit) |
| PS3 | Extend `TestDataSource` entities list + `truncateAll` if needed; verify existing 104 tests still green | (same commit) |

**Acceptance**
- [ ] `PayslipSummary` and `Payslip` exported from `@salary-mgmt/types`; build + typecheck pass.
- [ ] `PayslipsModule` registered in `AppModule`; app boots.
- [ ] All existing tests remain green.

---

### Phase 2 — RED

Branch: `feat/payslips-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| PS4 | Unit spec: `PayslipsService.buildPayslip()` — assembles `Payslip` from a `PayrollResult` + related `SalaryComponent` rows; 4 cases (earnings only, deductions only, mixed, empty components) | `test(api): add failing payslip unit and integration specs` |
| PS5 | Integration spec: `GET /v1/employees/:id/payslips` — returns history newest-first; 404 for unknown employee; empty array when no runs | (same commit) |
| PS6 | Integration spec: `GET /v1/employees/:id/payslips/:period` — returns full payslip; 404 for unknown employee; 404 for period with no result | (same commit) |

**Acceptance**
- [ ] All specs fail RED: routes 404, service not yet written — not harness errors.

---

### Phase 3 — GREEN

Branch: `feat/payslips-pr3-implementation`

| Task | Description | Commit |
|---|---|---|
| PS7 | `PayslipsService.getHistory(employeeId)` — validates employee exists; queries `payroll_results` by `employeeId` ordered by `period DESC`; maps to `PayslipSummary[]` | `feat(api): implement payslips GREEN — service, controller, module` |
| PS8 | `PayslipsService.getPayslip(employeeId, period)` — validates employee; loads `PayrollResult` for `(employeeId, period)`; joins `SalaryComponent` rows by `structureId`; builds `Payslip` via `buildPayslip()` | (same commit) |
| PS9 | `PayslipsController` at `employees/:employeeId/payslips`; `PayslipsModule` wired with all 4 TypeORM repos | (same commit) |

**Acceptance**
- [ ] All unit specs GREEN.
- [ ] All integration specs GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Backend complete
- [ ] Non-negotiable test cases all covered and green.
- [ ] Payslip line items + gross/deductions/net match stored `PayrollResult`.
- [ ] Old period's payslip unchanged after structure update + new run.
- [ ] History lists all periods newest-first.

---

### Phase 4 — Frontend PR1: Store hooks + RED specs

Branch: `feat/payslips-fe-pr1-hooks-red`

| Task | Description | Commit |
|---|---|---|
| PS10 | `packages/store`: `getPayslipHistory`, `getPayslip` API fns; `usePayslipHistory`, `usePayslip` hooks; `payslips` query-key family; re-export from store index | `feat(store): add payslip API fns, hooks, and RED unit specs` |
| PS11 | RED unit specs: `payslip-history-list.test.tsx` (3 cases), `payslip-card.test.tsx` (2 cases) — fail because components not yet implemented | (same commit) |

**Acceptance**
- [ ] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [ ] Unit tests fail RED: component files not found.

---

### Phase 5 — Frontend PR2: Components + page wiring (GREEN)

Branch: `feat/payslips-fe-pr2-components`

| Task | Description | Commit |
|---|---|---|
| PS12 | `PayslipHistoryList` component — renders period rows, loading skeleton, empty state; row click navigates to `/employees/[id]/payslips/[period]` | `feat(web): add payslip components and pages — GREEN` |
| PS13 | Wire `PayslipHistoryList` into existing `/employees/[id]/page.tsx` below the salary structure section | (same commit) |
| PS14 | `PayslipCard` component — earnings table, deductions table, gross/deductions/net footer, loading skeleton | (same commit) |
| PS15 | New route `apps/web/app/employees/[id]/payslips/[period]/page.tsx` — renders `PayslipCard` | (same commit) |

**Acceptance**
- [ ] All unit specs from PS11 GREEN.
- [ ] `pnpm --filter web typecheck` passes.

### Checkpoint: GREEN
- [ ] Employee detail page renders payslip history section.
- [ ] Payslip detail page renders full breakdown.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 6 — Frontend PR3: Integration + E2E tests

Branch: `feat/payslips-fe-pr3-tests`

| Task | Description | Commit |
|---|---|---|
| PS16 | MSW handlers: `GET /v1/employees/:id/payslips` + `GET /v1/employees/:id/payslips/:period`; add to shared handler array | `test(web): payslip MSW handlers, integration tests, and E2E specs` |
| PS17 | Integration: employee detail page renders `PayslipHistoryList` via real `usePayslipHistory` + MSW | (same commit) |
| PS18 | Integration: payslip detail page renders `PayslipCard` via real `usePayslip` + MSW | (same commit) |
| PS19 | E2E: employee detail page shows history after a payroll run; clicking a period navigates to detail; net pay matches | (same commit) |

**Acceptance**
- [ ] 2/2 integration tests GREEN.
- [ ] 3/3 E2E tests GREEN against `docker compose up --build`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` clean from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Frontend Test Cases pass (unit + integration + E2E).
- [ ] Frontend Success Criteria all satisfied.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `SalaryComponentEntity` not eagerly loaded — N+1 per payslip | Med | Load components in one query keyed by `structureId`; no lazy relations |
| Employee 404 check before payroll query — TOCTOU window | Low | Acceptable for read-only; employees are soft-deleted, FK is RESTRICT |
| Payslip detail route conflicts with existing `/employees/[id]` catch-all | Low | Next.js nested route `[id]/payslips/[period]` resolves correctly |
