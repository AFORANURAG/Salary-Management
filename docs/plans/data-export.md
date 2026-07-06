# Implementation Plan: Data Export (CSV Downloads)

> Source spec: [`../specs/data-export.md`](../specs/data-export.md) · Trace log: [`../../traces/data-export.md`](../../traces/data-export.md)

## Overview

Streaming CSV export from three existing endpoints: employee directory, payroll
run results, payslips by employee. No new tables; exports extend existing
service queries. A shared `CsvExportService` handles RFC 4180 formatting and
streaming. Five stacked branches (3 backend, 2 frontend).

## Architecture Decisions

- **Shared `CsvExportService`** — utility service in a new `CsvExportModule`
  (or added to `CommonModule` if one exists); injected into employees, payroll,
  payslips controllers. Exposes `streamRows(res, headers, rows)` helper.
- **Node.js `res.write()` streaming** — no in-memory array; rows are written
  as they come from a `QueryBuilder` cursor via `TypeORM` `stream()` API.
- **RFC 4180 escaping** — values with commas, double quotes, or newlines are
  wrapped in double quotes; inner double quotes doubled. No library needed.
- **No client-side download library** — `window.location.href = url`; cookie
  sent automatically (same-origin, `SameSite=Strict`).
- **URL builders in `@salary-mgmt/store`** — pure functions, no fetch; used by
  button components to construct download URLs with current filter params.
- **Money in minor units** — CSV exports raw integers; no conversion at export time.

## Ask-First Boundaries

- No new dependencies expected — streaming is native Node.js + TypeORM.

---

## Task List

### Phase 1 — CSV Service & Types

Branch: `feat/data-export-pr1-csv-service`

| Task | Description | Commit |
|---|---|---|
| DE1 | `packages/types`: no new types needed (export endpoints return streams, not JSON); confirm existing types cover query params for employee export | `chore(types): confirm no new types needed for data-export` |
| DE2 | `CsvExportService` (`apps/api/src/common/csv-export.service.ts`): `escape(value: string): string` — RFC 4180; `formatRow(cells: string[]): string` — join with commas + CRLF; `streamResponse(res, headers, rows: AsyncIterable<object>, columnMap)` — sets headers, writes rows | `feat(api): add CsvExportService with RFC 4180 streaming` |
| DE3 | Register `CsvExportService` in a `CommonModule` (create if absent); export it for injection by other modules | `feat(api): add CommonModule with CsvExportService` |

**Acceptance**
- [ ] `CsvExportService` unit-testable in isolation.
- [ ] `pnpm typecheck` passes.

---

### Phase 2 — RED

Branch: `feat/data-export-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| DE4 | Unit spec `CsvExportService`: `escape()` wraps values with commas; doubles inner quotes; handles newlines; empty string; normal string unchanged | `test(api): add failing CsvExportService unit specs (DE4)` |
| DE5 | Unit spec: `streamPayrollResults()` produces correct minor-unit money columns (no float division); correct header row | `test(api): add failing payroll export unit spec (DE5)` |
| DE6 | Integration spec `GET /v1/employees/export`: 200 `Content-Disposition: attachment`, `Content-Type: text/csv`; correct header row; rows match DB; filter params forwarded | `test(api): add failing employee export integration spec (DE6)` |
| DE7 | Integration spec `GET /v1/payroll/runs/:period/export`: 200 correct headers; 404 when period has no run | `test(api): add failing payroll export integration spec (DE7)` |
| DE8 | Integration spec `GET /v1/employees/:id/payslips/export`: 200 correct headers; 404 for unknown employee | `test(api): add failing payslips export integration spec (DE8)` |

**Acceptance**
- [ ] All specs fail RED — endpoints not yet implemented.

---

### Phase 3 — API (GREEN)

Branch: `feat/data-export-pr3-api`

| Task | Description | Commit |
|---|---|---|
| DE9 | `EmployeesController`: add `GET /v1/employees/export`; inject `CsvExportService`; pass same filter query params as list endpoint to `EmployeesService.streamForExport()` | `feat(api): add employee directory export endpoint (DE9)` |
| DE10 | `EmployeesService.streamForExport(filters, res)`: QueryBuilder stream with same WHERE conditions as list; no pagination; passes to `CsvExportService.streamResponse()` | `feat(api): implement employee stream export in service (DE10)` |
| DE11 | `PayrollController`: add `GET /v1/payroll/runs/:period/export`; 404 guard if no run; stream `PayrollResult` rows via `CsvExportService` | `feat(api): add payroll run export endpoint (DE11)` |
| DE12 | `PayslipsController`: add `GET /v1/employees/:employeeId/payslips/export`; 404 guard if employee missing; stream payslip rows | `feat(api): add payslips export endpoint (DE12)` |

**Acceptance**
- [ ] All unit specs from DE4–DE5 GREEN.
- [ ] All integration specs from DE6–DE8 GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

### Checkpoint: Backend complete
- [ ] All three export endpoints streaming with correct `Content-Disposition`.
- [ ] RFC 4180 escaping verified via unit tests.

---

### Phase 4 — Frontend: Download Button

Branch: `feat/data-export-fe-pr1-download-button`

| Task | Description | Commit |
|---|---|---|
| DE13 | `@salary-mgmt/store`: `buildEmployeeExportUrl(filters: EmployeeListQuery): string`; `buildPayrollExportUrl(period: string): string`; `buildPayslipExportUrl(employeeId: string): string` — pure URL builders | `feat(store): add export URL builder utilities` |
| DE14 | `DownloadButton` component (`components/common/download-button.tsx`): `Download` icon (lucide); on click sets `window.location.href = url`; 300ms loading state to prevent double-click; accepts `buildUrl: () => string` prop | `feat(web): add DownloadButton component` |
| DE15 | Unit spec: `DownloadButton` triggers `window.location.href` with correct URL; disabled for 300ms after click; re-enables after timeout | `test(web): add DownloadButton unit spec` |

**Acceptance**
- [ ] Unit spec GREEN.
- [ ] URL builders produce correct query strings with filter params.

---

### Phase 5 — Frontend: Page Wiring & Tests

Branch: `feat/data-export-fe-pr2-wiring-tests`

| Task | Description | Commit |
|---|---|---|
| DE16 | Employee list page: add `DownloadButton` to toolbar (beside "Add Employee"); passes `buildEmployeeExportUrl(currentFilters)` as `buildUrl` | `feat(web): wire export button onto employee list page` |
| DE17 | Payroll run detail page (`/payroll/[period]`): add `DownloadButton` in page header; passes `buildPayrollExportUrl(period)` | `feat(web): wire export button onto payroll detail page` |
| DE18 | Employee detail page (`/employees/[id]`): add `DownloadButton` in payslips section header; passes `buildPayslipExportUrl(id)` | `feat(web): wire export button onto employee payslips section` |
| DE19 | Reporting page: add `DownloadButton` in page header; passes `buildPayrollExportUrl(currentPeriod)` (exports payroll results for selected period) | `feat(web): wire export button onto reporting page` |
| DE20 | Integration spec (MSW): employee list export button — not needed (uses `window.location.href`, not fetch); verify `buildEmployeeExportUrl` includes filter params | `test(web): verify export URL builder includes active filters` |
| DE21 | E2E: employee list download → Playwright download listener → file has `.csv` extension + correct header row; payroll page export → filename matches `payroll-{period}.csv`; filters on employee list reflected in exported rows | |

**Acceptance**
- [ ] Export buttons visible on all 4 pages.
- [ ] E2E specs GREEN against running stack.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All three export endpoints reachable from the UI.
- [ ] Filters passthrough verified E2E.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TypeORM `stream()` API not available on all query types | Med | Test with `QueryBuilder.stream()` in integration test before committing to it; fall back to `getMany()` + chunked write if unavailable |
| `window.location.href` navigation blocked by popup blocker in some browsers | Low | Not a popup — `href` assignment is a navigation, not `window.open()`; no blocker issues |
| `SameSite=Strict` cookie not sent on navigation to download URL | High | Same-origin navigation always sends `SameSite=Strict` cookies — only cross-origin is blocked; verify in E2E |
| Large employee list (10k rows) causes timeout on export | Low | Streaming avoids memory pressure; TCP keepalive handles long responses; verify with manual curl at 10k |
