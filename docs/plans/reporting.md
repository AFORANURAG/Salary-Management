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
| RP1 | `packages/types`: add `GroupByDimension` enum (`department \| country \| costCenter`), `PayrollCostGroup`, `PayrollCostBucket`, `PayrollCostResponse`, `PayrollSummaryResponse` interfaces | `feat(types,api): add reporting types and wire ReportingModule` |
| RP2 | Wire `ReportingModule`: replace placeholder with `TypeOrmModule.forFeature([PayrollResultEntity, EmployeeEntity])`; register `ReportingController` + `ReportingService` stubs; confirm `AppModule` already imports `ReportingModule` | (same commit) |
| RP3 | Verify all existing tests still green; no harness changes needed (no new entities) | (same commit) |

**Acceptance**
- [x] New types exported from `@salary-mgmt/types`; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [x] `ReportingModule` boots with stub controller/service; `pnpm --filter api typecheck` clean.
- [x] All existing tests remain green.

---

### Phase 2 — RED

Branch: `feat/reporting-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| RP4 | Unit spec: `ReportingService.getPayrollCost()` — 4 cases: groups by department, groups by country, groups by costCenter, skips employees with null costCenter when grouping by costCenter | `test(api): add failing reporting unit and integration specs (RP4-RP7)` |
| RP5 | Unit spec: `ReportingService.getPayrollSummary()` — 2 cases: correct org-wide totals, multi-currency produces separate buckets (no cross-currency sum) | (same commit) |
| RP6 | Integration spec: `GET /v1/reporting/payroll-cost?period=&groupBy=department` — correct groups + headcounts; 400 on missing period; 400 on invalid groupBy | (same commit) |
| RP7 | Integration spec: `GET /v1/reporting/payroll-summary?period=` — correct totals; 400 on missing period; empty buckets when no results for period | (same commit) |

**Acceptance**
- [x] All specs fail RED: routes 404, service not yet written — not harness errors.

---

### Phase 3 — GREEN

Branch: `feat/reporting-pr3-implementation`

| Task | Description | Commit |
|---|---|---|
| RP8 | `PayrollCostQueryDto` (`@Matches` period regex, `@IsIn` groupBy) + `PayrollSummaryQueryDto` (`period` only) | `feat(api): implement reporting GREEN phase — DTOs, service, controller (RP8-RP11)` |
| RP9 | `ReportingService.getPayrollCost()` — `QueryBuilder` JOIN employees, GROUP BY dimension + currency, SUM amounts, COUNT headcount; null costCenter excluded when groupBy=costCenter; `buildCostResponse` pure helper | (same commit) |
| RP10 | `ReportingService.getPayrollSummary()` — `QueryBuilder` GROUP BY currency only; `buildSummaryResponse` pure helper | (same commit) |
| RP11 | `ReportingController` at `/reporting`; `ReportingModule` wired with controller + service | (same commit) |

**Acceptance**
- [x] All unit specs GREEN.
- [x] All integration specs GREEN.
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Backend complete
- [x] Non-negotiable test cases all covered and green.
- [x] Grouped totals equal sum of underlying `PayrollResult` rows (no double-counting).
- [x] Mixed-currency data is reported per currency, never summed across currencies.
- [x] Grouping by each of department / country / costCenter returns correct keys and headcounts.

---

### Phase 4 — Frontend PR1: Store hooks + RED unit specs

Branch: `feat/reporting-fe-pr1-hooks-red`

| Task | Description | Commit |
|---|---|---|
| RF1 | `packages/store`: `getReportingPayrollCost`, `getReportingSummary` API fns; `useReportingPayrollCost`, `useReportingSummary` hooks; `reporting.cost` + `reporting.summary` query keys; re-exported from store index | `feat(store): add reporting API fns, hooks, and RED unit specs (RF1-RF2)` |
| RF2 | RED unit specs: `reporting-cost-table.test.tsx` (3 cases — rows, skeleton, empty state); `reporting-summary-card.test.tsx` (2 cases — totals, skeleton) — fail because components not yet implemented | (same commit) |

**Acceptance**
- [x] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [x] Unit tests fail RED: component files not found.

---

### Phase 5 — Frontend PR2: Components + page wiring (GREEN)

Branch: `feat/reporting-fe-pr2-components`

| Task | Description | Commit |
|---|---|---|
| RF3 | `ReportingSummaryCard` component — per-currency buckets: gross, deductions, net totals; loading skeleton | |
| RF4 | `ReportingCostTable` component — period + groupBy selector (department / country / costCenter); results table with key, headcount, gross, net, currency; loading skeleton; empty state | |
| RF5 | New route `apps/web/app/reporting/page.tsx` — renders `ReportingSummaryCard` + `ReportingCostTable`; add link from nav | |

**Acceptance**
- [ ] All unit specs from RF2 GREEN.
- [ ] `pnpm --filter web typecheck` passes.

### Checkpoint: GREEN
- [ ] Employee reporting page renders both components.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 6 — Frontend PR3: Integration tests (MSW + real hooks)

Branch: `feat/reporting-fe-pr3-integration`

| Task | Description | Commit |
|---|---|---|
| RF6 | MSW handlers in `test/msw/handlers/reporting.ts`: `GET /v1/reporting/payroll-cost` + `GET /v1/reporting/payroll-summary`; registered in `test/msw/server.ts` | |
| RF7 | Integration: reporting page renders `ReportingCostTable` via real `usePayrollCost` + MSW | |
| RF8 | Integration: reporting page renders `ReportingSummaryCard` via real `usePayrollSummary` + MSW | |

**Acceptance**
- [ ] 2/2 integration tests GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` clean from repo root.

### Checkpoint: Integration green
- [ ] All unit + integration tests pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 7 — Frontend PR4: E2E tests (Playwright, full stack)

Branch: `feat/reporting-fe-pr4-e2e`

| Task | Description | Commit |
|---|---|---|
| RF9 | E2E: `/reporting` page loads and shows the summary card and cost table for a past payroll period | |
| RF10 | E2E: selecting a groupBy dimension (department → country) re-fetches and updates the cost table rows | |
| RF11 | E2E: cost table shows empty state when no payroll run exists for the entered period | |

**Acceptance**
- [ ] 3/3 E2E tests GREEN against `docker compose up --build`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` clean from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases pass (unit + integration + E2E).
- [ ] Frontend Success Criteria all satisfied.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `costCenter` is null for many employees — confusing empty groups | Med | Exclude null rows from costCenter grouping; document in response (no phantom empty-string group) |
| Multi-currency response shape unfamiliar to frontend | Med | Define `PayrollCostBucket[]` type clearly; MSW fixture covers multi-currency case |
| QueryBuilder JOIN produces duplicate rows on multi-result joins | Med | Use `addGroupBy` on all non-aggregate SELECT columns; verify with unit tests |
| E2E period collisions across test runs | Med | Use `Date.now()`-based year (5000–9999 range) per test, same pattern as payroll E2E |
