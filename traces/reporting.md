# Trace: Reporting (Aggregate Compensation)

> Spec: [`docs/specs/reporting.md`](../docs/specs/reporting.md) · Plan: [`docs/plans/reporting.md`](../docs/plans/reporting.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

Branch: `feat/reporting-pr1-foundation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP1 | `GroupByDimension`, `PayrollCostGroup`, `PayrollCostBucket`, `PayrollCostResponse`, `PayrollSummaryBucket`, `PayrollSummaryResponse` added to `@salary-mgmt/types` | `feat(types,api): add reporting types and wire ReportingModule` | types build + typecheck pass |
| RP2 | `ReportingModule` wired with `TypeOrmModule.forFeature([PayrollResultEntity, EmployeeEntity])`; stub `ReportingController` + `ReportingService` registered; `AppModule` already imported it | (same commit) | app boots; `pnpm --filter api typecheck` clean |
| RP3 | No harness changes needed — no new entities; 114/114 existing tests green | (same commit) | 114/114 green |

### Phase 2 — RED

Branch: `feat/reporting-pr2-test-harness`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP4 | Unit spec `reporting.service.spec.ts`: `buildCostResponse` — 4 cases (by department, by country, by costCenter, empty rows) | `test(api): add failing reporting unit and integration specs (RP4-RP7)` | RED — `buildCostResponse` not exported from service |
| RP5 | Unit spec `reporting.service.spec.ts`: `buildSummaryResponse` — 2 cases (single currency totals, multi-currency separate buckets) | (same commit) | RED — `buildSummaryResponse` not exported from service |
| RP6 | Integration spec: `GET /v1/reporting/payroll-cost` — 6 cases (by department, by country, by costCenter null exclusion, 400 missing period, 400 invalid groupBy, empty buckets) | (same commit) | RED — route 404 (controller has no handler) |
| RP7 | Integration spec: `GET /v1/reporting/payroll-summary` — 4 cases (totals, multi-currency buckets, 400 missing period, empty buckets) | (same commit) | RED — route 404 (controller has no handler) |

### Phase 3 — GREEN

Branch: `feat/reporting-pr3-implementation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP8 | `PayrollCostQueryDto` (`@Matches` period, `@IsIn` groupBy) + `PayrollSummaryQueryDto` (`period` only) in `src/reporting/dto/` | `feat(api): implement reporting GREEN phase — DTOs, service, controller (RP8-RP11)` | typecheck clean |
| RP9 | `ReportingService.getPayrollCost()` — QueryBuilder JOIN + GROUP BY dimension+currency + SUM; null costCenter excluded; `buildCostResponse` pure helper exported for unit tests | (same commit) | 6 unit cases + integration cost cases green |
| RP10 | `ReportingService.getPayrollSummary()` — QueryBuilder GROUP BY currency; `buildSummaryResponse` pure helper | (same commit) | 2 unit cases + integration summary cases green |
| RP11 | `ReportingController` at `reporting/payroll-cost` + `reporting/payroll-summary`; `ReportingModule` fully wired | (same commit) | 130/130 tests green; typecheck + lint clean |

### Phase 4 — Frontend: Store hooks + RED specs

Branch: `feat/reporting-fe-pr1-hooks-red`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF1 | `getReportingPayrollCost` + `getReportingSummary` API fns; `useReportingPayrollCost` + `useReportingSummary` hooks; `reporting.cost` + `reporting.summary` query keys; re-exported from store index | `feat(store): add reporting API fns, hooks, and RED unit specs (RF1-RF2)` | `pnpm --filter @salary-mgmt/store typecheck` clean |
| RF2 | RED unit specs: `reporting-cost-table.test.tsx` (3 cases) + `reporting-summary-card.test.tsx` (2 cases) | (same commit) | RED — component files not found; 57 existing tests unaffected |

### Phase 5 — Frontend: Components + page wiring

Branch: `feat/reporting-fe-pr2-components`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF3 | `ReportingSummaryCard` — per-currency buckets with gross/deductions/net/headcount; loading skeleton | `feat(web): reporting components and page — GREEN (RF3-RF5)` | unit spec 2/2 GREEN |
| RF4 | `ReportingCostTable` — grouped results table; loading skeleton; empty state | (same commit) | unit spec 3/3 GREEN |
| RF5 | `/reporting/page.tsx` — period month picker + groupBy selector; renders both components | (same commit) | typecheck clean; 62/62 tests green |

### Phase 6 — Frontend: Integration tests (MSW + real hooks)

Branch: `feat/reporting-fe-pr3-integration`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF6 | MSW handlers `reportingHandlers` in `test/msw/handlers/reporting.ts`; registered in `test/msw/server.ts` | `test(web): reporting MSW handlers and integration tests (RF6-RF8)` | server picks up handlers; existing 62 tests unaffected |
| RF7 | Integration: `reporting-cost.integration.test.tsx` — `ReportingPage` renders Engineering + Sales group keys via real `useReportingPayrollCost` + MSW | (same commit) | GREEN |
| RF8 | Integration: `reporting-summary.integration.test.tsx` — `ReportingPage` renders USD currency bucket via real `useReportingSummary` + MSW | (same commit) | GREEN; 64/64 tests pass; typecheck + lint clean |

### Phase 7 — Frontend: E2E tests (Playwright, full stack)

Branch: `feat/reporting-fe-pr4-e2e`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF9 | E2E: `/reporting` page loads and shows summary card (currency) and cost table (department row) for a payroll period | `test(web): reporting E2E specs RF9-RF11` | GREEN against Docker stack |
| RF10 | E2E: switching groupBy from `department` → `country` re-fetches and updates the column header | (same commit) | GREEN |
| RF11 | E2E: cost table shows "No results for this period." for a period with no payroll run | (same commit) | GREEN |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Grouped totals equal sum of underlying `PayrollResult` rows | PASS | 6 integration cases verify SUM aggregation per group; no double-counting |
| Mixed-currency data reported per currency, not summed across currencies | PASS | `buildCostResponse` / `buildSummaryResponse` bucket by currency; unit spec covers multi-currency case |
| Grouping by department / country / costCenter returns correct keys and headcounts | PASS | Integration spec covers all three dimensions; null costCenter rows excluded |
| Reporting page shows grouped cost breakdown with period + groupBy controls | PASS | `ReportingCostTable` + period input + groupBy select wired in `/reporting/page.tsx` |
| Summary card shows org-wide totals per currency | PASS | `ReportingSummaryCard` renders per-currency buckets with gross / deductions / net / headcount |
| All non-negotiable frontend test cases pass (unit + integration + E2E) | PASS | 5 unit + 2 integration + 3 E2E — all green |
| `pnpm typecheck && pnpm lint && pnpm test` green from repo root | PASS | 64 web + 130 api tests; typecheck + lint clean |
| Playwright E2E suite passes against running Docker stack | PASS | RF9-RF11 green; unique timestamp-based periods prevent cross-run collision |

## Learnings
