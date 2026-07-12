# Trace: Employee Bulk Operations

> Spec: [`docs/specs/employee-bulk-ops.md`](../docs/specs/employee-bulk-ops.md)
> Plan: [`docs/plans/employee-bulk-ops.md`](../docs/plans/employee-bulk-ops.md)

---

## Phase 1 — Types

Branch: `feat/employee-bulk-ops-pr1-types`

Added `BulkStatusRequest`, `BulkStatusResponse`, `ImportFailedRow`, `ImportResponse` to `packages/types/src/index.ts`. No regressions; typecheck passes.

---

## Phase 2 — RED

Branch: `feat/employee-bulk-ops-pr2-test-harness`

Added unit specs for `bulkUpdateStatus` (4 cases) and `importFromCsv` (6 cases) plus integration specs for both endpoints (12 cases). All failed RED as expected — routes 404, methods not implemented.

---

## Phase 3 — API (GREEN)

Branch: `feat/employee-bulk-ops-pr3-api`

- Installed `csv-parse` in `apps/api`.
- Implemented `BulkStatusDto` + `bulkUpdateStatus()` (single QueryBuilder UPDATE).
- Implemented `importFromCsv(buffer)`: `csv-parse` with `columns:true`, per-row `plainToInstance`+`validate`, email-dedup via SELECT, transaction commit, failure collection.
- Added `MulterExceptionFilter` (duck-typed `isMulterLimitError`; avoids direct multer import breaking vitest). Registered globally in `main.ts` and `test-app.ts`.
- `FileInterceptor` + manual size/mime checks in handler (dropped `ParseFilePipe` — returned 422 for all files).
- All 214 API tests green.

Notable workarounds:
- `@IsUUID("4")` rejects non-conformant fake UUIDs — changed test fixtures to valid v4 format.
- `ParseFilePipe` intercepted before `FileInterceptor` limits, returning 422 unconditionally; replaced with manual checks.
- `@Catch()` filter with re-throw for `HttpException` caused request hangs; fixed by handling `HttpException` inline.

---

## Phase 4 — Frontend: List Checkboxes & Bulk Toolbar

Branch: `feat/employee-bulk-ops-fe-pr1-list-select`

- `postBulkStatusChange` API fn + `useBulkStatusChange` mutation in `@salary-mgmt/store` (BO10).
- Row checkboxes + header select-all in `EmployeeList` via optional `selectedIds`/`onSelectionChange` props (BO11).
- `BulkActionToolbar` component: fixed bottom, status dropdown, confirm → mutation → toast, deselect ×; hidden for HR_VIEWER (BO12).
- Selection state in `employees/page.tsx`; clears on page/filter change; `canBulkEdit` role guard (BO12).
- 8 unit tests for `BulkActionToolbar` GREEN (BO13).

Commit: `177e382`

---

## Phase 5 — Frontend: Import Wizard

Branch: `feat/employee-bulk-ops-fe-pr2-import-wizard`

- BO14: `postEmployeeImport(file)` API fn (raw `fetch` with `FormData` — skips `Content-Type: application/json` from base client); `useEmployeeImport()` mutation in store.
- BO15: Static template at `apps/web/public/templates/employees-import-template.csv` with correct header row + one example row.
- BO16: Replaced placeholder `/employees/bulk` with full import wizard; "Import CSV" button added to employee list page (ADMIN/HR_MANAGER only); existing sidebar "Bulk Operations" item already points to this route.
- BO17: Upload step — drag-drop zone, browse button, CSV/size validation client-side, file name+size display, "Download template" link, "Preview & Import" button.
- BO18: Results step — imported count, failure table (row, code, errors), "Import More" reset, "View Employees" navigate.
- BO19: 11 unit tests GREEN. Notable: `userEvent.upload` doesn't trigger `onChange` on hidden inputs in jsdom — used `fireEvent.change` with `Object.defineProperty(input, "files", ...)` helper.

Commit: `97b3e07`

---

## Phase 6 — Tests

Branch: `feat/employee-bulk-ops-fe-pr3-tests`

- BO20: 3 MSW integration specs for bulk status — select all → toolbar count → confirm → list refetches + toolbar disappears; deselect clears; individual checkbox selects one row.
- BO21: 4 MSW integration specs for import wizard — all-valid 201, partial 201 with failure table, server 400 error shown, Import More resets.
- BO22: 4 Playwright E2E specs — select 3 rows → Set Inactive → toast → INACTIVE badges; valid CSV upload → results; 2-invalid-row CSV → failure table; template link href + download attribute.

Notable: integration tests check list refetch count and toolbar visibility instead of toast text (Toaster not mounted in renderWithFreshClient wrapper — consistent with all other integration tests in this repo).

Commit: `25f3e52`
