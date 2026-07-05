# Implementation Plan: Reporting (Aggregate Compensation)

> Source spec: [`../specs/reporting.md`](../specs/reporting.md) · Trace log: [`../../traces/reporting.md`](../../traces/reporting.md)

## Overview

Aggregate compensation reporting over persisted `PayrollResult` rows. Two read-only
endpoints: a grouped cost breakdown (`payroll-cost`) and an org-wide summary
(`payroll-summary`). No new tables — pure joins + GROUP BY against existing data.
Multi-currency: results are bucketed per currency, never blended.

Built **test-first**: RED suite authored before any implementation. Backend across
three stacked branches; frontend across two stacked branches.

## Architecture Decisions

- **No new migrations** — `PayrollResult` + `EmployeeEntity` already have everything
  needed (`department`, `country`, `costCenter`, `currency`, `grossMinor`,
  `deductionsMinor`, `netMinor`). `costCenter` is nullable — rows with `NULL`
  costCenter are excluded from `groupBy=costCenter` results (reported as skipped).
- **Pure SQL aggregation** — `QueryBuilder` with `SELECT` + `GROUP BY` + `SUM`.
  No in-memory aggregation loops. One query per endpoint.
- **Multi-currency bucketing** — `currency` is always a grouping column alongside
  the primary key. A group row carries one currency value; the response collects
  them into an array of `{ currency, groups[] }` buckets.
- **`costCenter` is in scope** — the field exists on `EmployeeEntity` and in
  `@salary-mgmt/types`; the open question is resolved.
- **`ReportingModule` imports `TypeOrmModule.forFeature([PayrollResultEntity, EmployeeEntity])`**
  — no other entities needed.
- **New shared types** — `PayrollCostGroup`, `PayrollCostResponse`,
  `PayrollSummaryResponse` added to `@salary-mgmt/types`.
- **Frontend: new top-level `/reporting` route** — single page with a period picker,
  groupBy selector, and results table. No sub-routes needed for MVP.

## Ask-First Boundaries

- Any DB schema changes (none expected).
- New dependencies beyond what is already installed.

---

## Task List

### Phase 1 — Foundation

Branch: `feat/reporting-pr1-foundation`

| Task | Description | Commit |
|---|---|---|
| RP1 | `packages/types`: add `GroupByDimension` enum (`department \| country \| costCenter`), `PayrollCostGroup`, `PayrollCostBucket`, `PayrollCostResponse`, `PayrollSummaryResponse` interfaces | |
| RP2 | Wire `ReportingModule`: replace placeholder with `TypeOrmModule.forFeature([PayrollResultEntity, EmployeeEntity])`; register `ReportingController` + `ReportingService` stubs; confirm `AppModule` already imports `ReportingModule` | |
| RP3 | Verify all existing tests still green; no harness changes needed (no new entities) | |

**Acceptance**
- [ ] New types exported from `@salary-mgmt/types`; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [ ] `ReportingModule` boots with stub controller/service; `pnpm --filter api typecheck` clean.
- [ ] All existing tests remain green.

---

### Phase 2 — RED

Branch: `feat/reporting-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| RP4 | Unit spec: `ReportingService.getPayrollCost()` — 4 cases: groups by department, groups by country, groups by costCenter, skips employees with null costCenter when grouping by costCenter | |
| RP5 | Unit spec: `ReportingService.getPayrollSummary()` — 2 cases: correct org-wide totals, multi-currency produces separate buckets (no cross-currency sum) | |
| RP6 | Integration spec: `GET /v1/reporting/payroll-cost?period=&groupBy=department` — correct groups + headcounts; 400 on missing period; 400 on invalid groupBy | |
| RP7 | Integration spec: `GET /v1/reporting/payroll-summary?period=` — correct totals; 400 on missing period; empty buckets when no results for period | |

**Acceptance**
- [ ] All specs fail RED: routes 404, service not yet written — not harness errors.

---

### Phase 3 — GREEN

Branch: `feat/reporting-pr3-implementation`

| Task | Description | Commit |
|---|---|---|
| RP8 | `PayrollCostQueryDto` (`@IsString @IsNotEmpty period`, `@IsIn(['department','country','costCenter']) groupBy`) + `PayrollSummaryQueryDto` (`period` only) | |
| RP9 | `ReportingService.getPayrollCost(period, groupBy)` — single `QueryBuilder` with `JOIN employees`, `GROUP BY` on dimension + currency, `SUM` on gross/deductions/net, `COUNT` headcount; excludes null costCenter rows when `groupBy=costCenter` | |
| RP10 | `ReportingService.getPayrollSummary(period)` — single `QueryBuilder` grouping by `currency` only; returns `PayrollSummaryResponse` | |
| RP11 | `ReportingController` at `/reporting` with `GET payroll-cost` and `GET payroll-summary`; `ReportingModule` wired with controller + service + TypeORM repos | |

**Acceptance**
- [ ] All unit specs GREEN.
- [ ] All integration specs GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Backend complete
- [ ] Non-negotiable test cases all covered and green.
- [ ] Grouped totals equal sum of underlying `PayrollResult` rows (no double-counting).
- [ ] Mixed-currency data is reported per currency, never summed across currencies.
- [ ] Grouping by each of department / country / costCenter returns correct keys and headcounts.

---

### Phase 4 — Frontend PR1: Store hooks + RED unit specs

Branch: `feat/reporting-fe-pr1-hooks-red`

| Task | Description | Commit |
|---|---|---|
| RF1 | `packages/store`: `getPayrollCost`, `getPayrollSummary` API fns; `usePayrollCost`, `usePayrollSummary` hooks; `reporting` query-key family; re-export from store index | |
| RF2 | RED unit specs: `reporting-cost-table.test.tsx` (3 cases — rows, loading skeleton, empty state); `reporting-summary-card.test.tsx` (2 cases — totals, loading skeleton) — fail because components not yet implemented | |

**Acceptance**
- [ ] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [ ] Unit tests fail RED: component files not found.

---

### Phase 5 — Frontend PR2: Components + page wiring (GREEN)

Branch: `feat/reporting-fe-pr2-components`

| Task | Description | Commit |
|---|---|---|
| RF3 | `ReportingSummaryCard` component — per-currency buckets: gross, deductions, net totals; loading skeleton | |
| RF4 | `ReportingCostTable` component — period + groupBy selector (department / country / costCenter); results table with key, headcount, gross, net, currency; loading skeleton; empty state | |
| RF5 | New route `apps/web/app/reporting/page.tsx` — renders `ReportingSummaryCard` + `ReportingCostTable`; link from nav | |
| RF6 | MSW handlers: `GET /v1/reporting/payroll-cost` + `GET /v1/reporting/payroll-summary`; integration tests: reporting page renders both components via real hooks + MSW | |

**Acceptance**
- [ ] All unit specs from RF2 GREEN.
- [ ] 2/2 integration tests GREEN.
- [ ] `pnpm --filter web typecheck` passes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases pass.
- [ ] Frontend Success Criteria all satisfied.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `costCenter` is null for many employees — confusing empty groups | Med | Exclude null rows from costCenter grouping; document in response (no phantom empty-string group) |
| Multi-currency response shape unfamiliar to frontend | Med | Define `PayrollCostBucket[]` type clearly; MSW fixture covers multi-currency case |
| QueryBuilder JOIN produces duplicate rows on multi-result joins | Med | Use `addGroupBy` on all non-aggregate SELECT columns; verify with unit tests |
| No E2E branch for reporting | Low | Frontend phase 5 combines components + integration in one branch — E2E deferred; can add as phase 6 if needed |
