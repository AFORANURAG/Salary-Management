# Spec: Data Export (CSV Downloads)

> Domain spec under [`../spec.md`](../spec.md). Extends `apps/api/src/employees`,
> `apps/api/src/payroll`, `apps/api/src/payslips`.
> Depends on [`hr-auth.md`](./hr-auth.md) — all exports require authentication.

## Objective

Allow HR users to download structured CSV files from any data-bearing page:
employee directory, payroll run results, and individual employee payslip
history. No new tables needed — export endpoints reuse existing service queries
and stream the result as `text/csv` with an `attachment` filename.

CSV-only for MVP. XLSX is a future enhancement.

## API Surface

```
GET /v1/employees/export                         → employee directory CSV
GET /v1/payroll/runs/:period/export              → payroll results CSV for a period
GET /v1/employees/:employeeId/payslips/export    → all payslips for an employee CSV
```

All three endpoints:
- Protected: any authenticated role.
- Response headers:
  ```
  Content-Type: text/csv; charset=utf-8
  Content-Disposition: attachment; filename="<name>.csv"
  ```
- Stream via `res.setHeader` + `res.write` / `res.end` — do not buffer the
  entire dataset in memory (important at 10k rows).

### `GET /v1/employees/export`

Accepts the same query params as `GET /v1/employees` (`q`, `department`,
`country`, `status`) — the exported file reflects the current filter state.
No pagination — all matching rows.

CSV columns:
`employeeCode, name, email, department, designation, country, currency, joiningDate, employmentStatus, costCenter`

Filename: `employees-{YYYY-MM-DD}.csv` (server date at request time).

### `GET /v1/payroll/runs/:period/export`

404 if no payroll run exists for the period.

CSV columns:
`employeeCode, employeeName, department, country, currency, grossMinor, deductionsMinor, netMinor, period`

Money columns are exported as **minor units** (integers) — no conversion. A
header comment row is NOT included; column names are the header row.

Filename: `payroll-{period}.csv` (e.g. `payroll-2026-07.csv`).

### `GET /v1/employees/:employeeId/payslips/export`

404 if employee does not exist.

CSV columns:
`period, grossMinor, deductionsMinor, netMinor, currency, generatedAt`

Filename: `payslips-{employeeCode}-{YYYY-MM-DD}.csv`.

## Frontend

### Export Button Placement

Export buttons appear as icon buttons (`Download` icon from `lucide-react`) in
the page header / toolbar of the relevant page. No new pages — export is
always triggered in-place.

| Page | Button placement | Endpoint called |
|---|---|---|
| `/employees` | Toolbar right, beside "Add Employee" | `GET /v1/employees/export` + current filters |
| `/payroll/[period]` | Page header | `GET /v1/payroll/runs/:period/export` |
| `/employees/[id]` (payslips section) | Section header | `GET /v1/employees/:id/payslips/export` |
| `/reporting` | Page header | `GET /v1/employees/export` (employee list) or payroll export — see note |

On the reporting page the export button triggers the **payroll results CSV**
for the currently selected period (same period as the reporting view).

### Download Mechanism

No JavaScript file-saving library needed. Flow:

1. User clicks Download button.
2. Frontend constructs the URL with current query params.
3. Sets `window.location.href = url` (triggers browser download for
   `Content-Disposition: attachment`).
4. Cookie is sent automatically (same-origin, `SameSite=Strict`).

Button shows a brief loading state (300ms debounce) to prevent double-clicks,
then resets immediately after navigation.

### Visibility Rules

- Export buttons are visible to all authenticated roles.
- `HR_VIEWER` can export (read-only access includes data export).

## Data Layer (`@salary-mgmt/store`)

No TanStack Query hooks needed — exports use direct URL navigation, not fetch.
Add utility fns to `@salary-mgmt/store`:

- `buildEmployeeExportUrl(filters: EmployeeListQuery): string`
- `buildPayrollExportUrl(period: string): string`
- `buildPayslipExportUrl(employeeId: string): string`

These are pure URL builders (no fetch) — used by the button components.

## Key Rules

- Export endpoints are **streaming** — use Node.js `Writable` stream via
  `res.write` row-by-row; never load the full result set into an array first.
- CSV values containing commas or quotes must be properly escaped (RFC 4180):
  wrap in double quotes, escape inner double quotes as `""`.
- Money values in CSV are **raw minor units** (integers) — callers who need
  display formatting should use `packages/money` after import.
- Export endpoints respect the same soft-delete filter as list endpoints
  (terminated employees appear in exports unless filtered out by `status`).

## Non-Negotiable Test Cases

**Unit**
- `CsvExportService.streamEmployees()` produces a correctly escaped CSV with
  the right headers for a given fixture; commas and quotes in values are
  RFC 4180 compliant.
- `CsvExportService.streamPayrollResults()` produces correct money minor units
  (no float division).
- Filter params passed to employee export are forwarded to the same query as
  the list endpoint.

**Integration**
- `GET /v1/employees/export` returns `Content-Disposition: attachment`,
  `Content-Type: text/csv`, correct header row, and data rows matching the DB.
- `GET /v1/payroll/runs/:period/export` 404 when period has no run.
- `GET /v1/employees/:id/payslips/export` 404 for unknown employee.
- Unauthenticated request → 401.

**E2E (Playwright)**
- Employee list: clicking Download sets up a download listener; file is received
  with a `.csv` extension and correct first header row.
- Payroll page: export button for a completed run triggers a download with the
  correct filename pattern `payroll-{period}.csv`.
- Filters applied on employee list are reflected in the exported file (export
  only includes filtered employees).

## Success Criteria

- [ ] All three export endpoints stream without buffering the full dataset.
- [ ] RFC 4180 escaping correct for all string fields.
- [ ] Download triggered client-side without a separate download library.
- [ ] All non-negotiable test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `CsvExportService` (shared streaming helper), export endpoint types | `feat/data-export-pr1-csv-service` |
| RED — unit + integration tests for all three export endpoints | `feat/data-export-pr2-test-harness` |
| Export endpoints wired into employees, payroll, payslips controllers (GREEN) | `feat/data-export-pr3-api` |

### Frontend

| Phase | Branch |
|---|---|
| URL builder utils in `@salary-mgmt/store`; Download button component | `feat/data-export-fe-pr1-download-button` |
| Wire Download button onto employees list, payroll detail, employee detail, reporting | `feat/data-export-fe-pr2-page-wiring` |
| Unit + integration + E2E tests | `feat/data-export-fe-pr3-tests` |

Plan: [`docs/plans/data-export.md`](../plans/data-export.md) · Trace: [`traces/data-export.md`](../../traces/data-export.md)
