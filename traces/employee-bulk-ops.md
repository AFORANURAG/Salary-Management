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
