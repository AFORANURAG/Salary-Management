# Implementation Plan: Dashboard (Operational Home)

> Source spec: [`../specs/dashboard.md`](../specs/dashboard.md) · Trace log: [`../../traces/dashboard.md`](../../traces/dashboard.md)

## Overview

Replaces the health-check homepage with a real operational hub. One new
backend endpoint (`GET /v1/dashboard/summary`) aggregates stats, last run,
department breakdown, and recent runs into a single response. The frontend
renders stat cards, quick-action cards, a `recharts` bar chart, and a recent
runs timeline. Eight stacked branches (3 backend, 5 frontend).

## Architecture Decisions

- **Single aggregated endpoint** — `GET /v1/dashboard/summary?period=YYYY-MM`;
  all above-the-fold data in one round trip; p95 < 500ms target.
- **`DashboardModule`** — new module that imports `TypeOrmModule.forFeature`
  for `EmployeeEntity`, `PayrollRunEntity`, `PayrollResultEntity`,
  `SalaryStructureEntity`; does not import other modules' services to avoid
  circular deps.
- **`recharts` in `apps/web`** — not added to `@salary-mgmt/ui` (chart is
  dashboard-specific, not a shared primitive); needs user confirmation before
  install (ask-first boundary).
- **`RunPayrollModal` is a shared component** — lives in
  `components/payroll/run-payroll-modal.tsx`; reused by dashboard and payroll
  history page (payroll-ops spec).
- **Period picker** — client state only; drives `useDashboardSummary(period)`;
  no URL param for MVP.
- **Money formatting** — all display uses `packages/money` helpers; never raw
  integer division.
- **Department breakdown** — all 5 departments always shown; zero-headcount
  gets a 0-length bar (not absent bar); headcount-based bar, not payroll-cost.

## Ask-First Boundaries

- `recharts` installation in `apps/web` (DA7).
- Any additional `DashboardSummaryResponse` fields beyond spec (do not expand
  scope unilaterally).

---

## Task List

### Phase 1 — Types & Module Stub

Branch: `feat/dashboard-pr1-types-module`

| Task | Description | Commit |
|---|---|---|
| DA1 | `packages/types`: add `DashboardStats`, `DashboardLastRun`, `DashboardDeptBreakdown`, `DashboardRecentRun`, `DashboardSummaryResponse` interfaces | `feat(types): add dashboard summary response types` |
| DA2 | `DashboardModule` stub: `TypeOrmModule.forFeature([EmployeeEntity, PayrollRunEntity, PayrollResultEntity, SalaryStructureEntity])`; stub controller + service; register in `AppModule` | `feat(api): add DashboardModule stub` |

**Acceptance**
- [ ] Types exported and `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [ ] Module boots; no runtime errors.

---

### Phase 2 — RED

Branch: `feat/dashboard-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| DA3 | Unit spec `DashboardService.getSummary()`: correct `totalActiveEmployees`; correct `totalPayrollCostMinor` summed from results; `lastPayrollRun` null when no run exists; `departmentBreakdown` includes all 5 departments with zero headcount depts present; `recentPayrollRuns` returns at most 5, ordered `ranAt DESC` | `test(api): add failing dashboard unit specs (DA3)` |
| DA4 | Integration spec `GET /v1/dashboard/summary`: 200 with correct shape; `period` defaults to current month when omitted; 400 for malformed period; 401 without cookie | `test(api): add failing dashboard integration spec (DA4)` |

**Acceptance**
- [ ] All specs fail RED — controller returns 404.

---

### Phase 3 — API (GREEN)

Branch: `feat/dashboard-pr3-api`

| Task | Description | Commit |
|---|---|---|
| DA5 | `DashboardQueryDto`: optional `period` string with `@Matches(/^\d{4}-\d{2}$/)` | `feat(api): add DashboardQueryDto` |
| DA6 | `DashboardService.getSummary()`: 4 QueryBuilder queries (stats, lastRun, deptBreakdown, recentRuns); aggregate correctly; default period = current month | `feat(api): implement DashboardService (DA6)` |
| DA6b | `DashboardController` at `/v1/dashboard/summary`; `@JwtAuthGuard` (inherited from global); `@CurrentUser()` not needed here | `feat(api): add DashboardController (DA6b)` |

**Acceptance**
- [ ] All unit specs from DA3 GREEN.
- [ ] All integration specs from DA4 GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.
- [ ] p95 < 500ms against seeded data (manual check via curl).

### Checkpoint: Backend complete
- [ ] All 5 departments in breakdown even with zero headcount.
- [ ] `lastPayrollRun` null when no runs exist (no crash).

---

### Phase 4 — Frontend: Hooks

Branch: `feat/dashboard-fe-pr1-hooks`

| Task | Description | Commit |
|---|---|---|
| DA7 | Install `recharts` in `apps/web` (ask-first confirmed) | `chore(web): add recharts dependency` |
| DA8 | `@salary-mgmt/store`: `getDashboardSummary(period)` API fn; `useDashboardSummary(period)` hook — `queryKey: ['dashboard', 'summary', period]`, `staleTime: 60_000` | `feat(store): add useDashboardSummary hook` |
| DA9 | MSW handler for `GET /v1/dashboard/summary` in `apps/web/test/msw/handlers/dashboard.ts`; register in server | `test(web): add dashboard MSW handler` |

**Acceptance**
- [ ] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [ ] MSW handler returns fixture matching `DashboardSummaryResponse` shape.

---

### Phase 5 — Frontend: Stat Cards & Quick Actions

Branch: `feat/dashboard-fe-pr2-stat-cards`

| Task | Description | Commit |
|---|---|---|
| DA10 | `StatCard` component (`components/dashboard/stat-card.tsx`): value, label, secondary label, loading skeleton variant | `feat(web): add StatCard component` |
| DA11 | `QuickActionCard` component (`components/dashboard/quick-action-card.tsx`): icon, label, CTA button, disabled state with tooltip | `feat(web): add QuickActionCard component` |
| DA12 | `RunPayrollModal` (`components/payroll/run-payroll-modal.tsx`): period input (default current month), confirm/cancel; calls `useRunPayroll()` (add to store if not present); on 201 invalidates `['dashboard', 'summary']` + `['payroll', 'runs']`; on 409 shows inline error; role gate: button disabled for HR_VIEWER with tooltip | `feat(web): add RunPayrollModal shared component` |
| DA13 | Unit specs: `StatCard` renders value, label, skeleton; `QuickActionCard` disabled state with tooltip; `RunPayrollModal` submit calls hook; 409 shows inline error without closing; HR_VIEWER disabled button | `test(web): add StatCard, QuickActionCard, RunPayrollModal unit specs` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] `pnpm typecheck` passes.

---

### Phase 6 — Frontend: Chart

Branch: `feat/dashboard-fe-pr3-chart`

| Task | Description | Commit |
|---|---|---|
| DA14 | `DepartmentBarChart` component (`components/dashboard/department-bar-chart.tsx`): `recharts` `BarChart` (horizontal); X = headcount; Y = department; 5 fixed colors; tooltip "{dept}: {headcount} employees"; `ResponsiveContainer width="100%" height={240}`; empty state when all headcounts are 0 | `feat(web): add DepartmentBarChart with recharts` |
| DA15 | Unit spec: `DepartmentBarChart` renders correct bar count from 5-dept fixture; empty state renders when all headcounts 0 | `test(web): add DepartmentBarChart unit spec` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] `pnpm typecheck` passes (recharts types resolve).

---

### Phase 7 — Frontend: Page Assembly

Branch: `feat/dashboard-fe-pr4-page`

| Task | Description | Commit |
|---|---|---|
| DA16 | `RecentPayrollRunsCard` component: list of up to 5 runs; period label, status badge, net total, `ranAt`; each row links to `/payroll/[period]`; empty state | `feat(web): add RecentPayrollRunsCard component` |
| DA17 | `PeriodPicker` component: prev/next chevrons; "Month YYYY" label; disables next on current month; calls `onPeriodChange` callback | `feat(web): add PeriodPicker component` |
| DA18 | Dashboard page (`app/(authenticated)/page.tsx`): replaces health-check; assembles `PeriodPicker` + 4 `StatCard`s + `QuickActionCard`s + `DepartmentBarChart` + `RecentPayrollRunsCard`; loading skeleton when `useDashboardSummary` is fetching | `feat(web): replace homepage with operational dashboard` |

**Acceptance**
- [ ] Dashboard page renders without errors.
- [ ] Period picker re-fetches on change.
- [ ] Old health-check page fully removed.
- [ ] `pnpm typecheck && pnpm lint` passes.

---

### Phase 8 — Tests

Branch: `feat/dashboard-fe-pr5-tests`

| Task | Description | Commit |
|---|---|---|
| DA19 | Unit spec: `RecentPayrollRunsCard` renders period, status badge, net total; empty state; `PeriodPicker` prev decrements month; next disabled on current month | `test(web): add RecentPayrollRunsCard and PeriodPicker unit specs` |
| DA20 | Integration spec (MSW): dashboard page renders all 4 stat cards from fixture; period change triggers new request with updated period param; `RunPayrollModal` MSW 201 → toast shown, modal closed; MSW 409 → inline error | `test(web): add dashboard integration specs` |
| DA21 | E2E: dashboard loads; all 4 stat cards show non-skeleton content; "View All" on Employees navigates to `/employees`; HR_MANAGER opens Run Payroll modal + submits; HR_VIEWER sees disabled button with tooltip; department chart renders | |

**Acceptance**
- [ ] All unit + integration specs GREEN.
- [ ] E2E spec GREEN against running stack.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases covered and green.
- [ ] `GET /v1/dashboard/summary` p95 < 500ms (verified manually).
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `recharts` `BarChart` hard to unit test in jsdom (SVG rendered by browser APIs) | Med | Test data flow + empty state only in unit; visual rendering covered by E2E |
| `DashboardService` aggregation joins timeout at 10k+ rows | Med | All joins use indexed columns; add `EXPLAIN ANALYZE` check manually before merge |
| `RunPayrollModal` shared between dashboard + payroll-ops; later spec may want different behavior | Low | Keep modal stateless / prop-driven; any payroll-ops differences handled via props, not forking |
| Period default (server-side current month) diverges from client timezone | Low | Client sends explicit period after mount; server default only used if period param is omitted (e.g. direct curl) |
