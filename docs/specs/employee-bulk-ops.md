# Spec: Employee Bulk Operations

> Domain spec under [`../spec.md`](../spec.md). Extends `apps/api/src/employees`
> and `apps/web/app/(authenticated)/employees/`.
> Depends on [`hr-auth.md`](./hr-auth.md) — writes require `HR_MANAGER` or `ADMIN`.

## Objective

Two operations that HR uses when onboarding or status-changing multiple
employees at once: **CSV import** (create many employees in one upload) and
**bulk status change** (terminate, deactivate, or reactivate a selection from
the list). Neither requires a new database table — both extend the existing
`EmployeesService` and `EmployeesController`.

## API Surface

```
POST /v1/employees/bulk-status   → change status for N employee IDs
POST /v1/employees/import        → create employees from CSV upload
```

### `POST /v1/employees/bulk-status`

**Auth:** `HR_MANAGER`, `ADMIN`

Request body:
```ts
{ ids: string[];  status: "ACTIVE" | "INACTIVE" | "TERMINATED" }
```

Rules:
- Max 200 IDs per request.
- Unknown IDs are silently skipped (not a 400) — reflects a soft-delete-safe
  design (the IDs may have been removed between select and submit).
- Returns:
  ```ts
  { updated: number; skipped: number }
  ```
- Single `UPDATE ... WHERE id IN (...)` — not N individual updates.

### `POST /v1/employees/import`

**Auth:** `HR_MANAGER`, `ADMIN`

- `Content-Type: multipart/form-data`, field name `file`, `.csv` only.
- Max file size: 2 MB.
- CSV columns (header row required, order-independent):
  `employeeCode, name, email, department, designation, country, currency, joiningDate, employmentStatus`
- `joiningDate` format: `YYYY-MM-DD`.
- Processing: validate every row before committing any — all-or-partial mode
  is **partial** (valid rows are inserted; invalid rows are reported, not
  blocking).
- Response:
  ```ts
  {
    imported: number;
    failed: Array<{
      row: number;          // 1-based, excludes header
      employeeCode: string | null;
      errors: string[];     // field-level messages
    }>;
  }
  ```
- Duplicate `employeeCode` or `email` (against existing DB records) reports a
  row error — does not abort the import.
- Empty file or missing header row → 400.

## Frontend

### Employee List Page Additions

- **Row checkboxes**: each row gets a leading checkbox column; header checkbox
  selects/deselects all rows on the current page.
- **Bulk action toolbar**: appears (slides up from bottom) when ≥1 row
  is selected. Shows:
  - "{N} selected" count
  - Status change dropdown: "Set Active", "Set Inactive", "Terminate"
  - Deselect all (×) button
  - Confirm button → calls `useBulkStatusChange()` → invalidates employee list
    cache on success → shows toast.
- Toolbar is not shown for `HR_VIEWER` (role check at render time).

### Import Page: `/employees/bulk`

Accessible from the "Bulk Operations" sidebar item (Workforce section) and an
"Import CSV" button on the list page (visible to `HR_MANAGER`/`ADMIN` only).

Wizard — 2 steps:

**Step 1 — Upload**
- Drag-and-drop file zone + "Browse" button.
- Accepts `.csv` only; shows file name and size after selection.
- "Download template" link — serves a static CSV template file with the correct
  headers (hosted in `apps/web/public/templates/employees-import-template.csv`).
- "Preview & Import" button → calls `POST /v1/employees/import`.

**Step 2 — Results**
- Shows a summary: "{N} employees imported successfully."
- If any rows failed: expandable table of failures — row number, field, error.
- "Import More" button → resets to Step 1.
- "View Employees" button → navigates to `/employees`.

## Data Layer (`@salary-mgmt/store`)

- `postBulkStatusChange(ids, status)` API fn
- `postEmployeeImport(file: File)` API fn — `FormData` upload
- `useBulkStatusChange()` mutation — invalidates `['employees']` on success
- `useEmployeeImport()` mutation — no cache invalidation (results page handles navigation)

## Key Rules

- Bulk status change is a **soft operation** — it goes through the same status
  validation as `PATCH /v1/employees/:id` (cannot re-activate a `TERMINATED`
  employee — that row is silently skipped and counted in `skipped`).
- CSV import uses the same DTO validators as `POST /v1/employees` — no
  parallel validation path.
- Row numbers in the failure response are 1-based and exclude the header row.
- The bulk toolbar must not submit if 0 rows are selected (button disabled state).
- Max 2 MB file enforced both client-side (before upload) and server-side
  (`FileSizeValidator` in NestJS pipe).

## Non-Negotiable Test Cases

**Unit**
- `EmployeesService.bulkUpdateStatus()`: updates correct rows; returns accurate
  `{ updated, skipped }` when some IDs don't exist.
- `EmployeesService.importFromCsv()`: valid rows inserted; invalid rows collected
  with per-field errors; duplicate email returns row error, not thrown exception.
- CSV parser correctly maps order-independent columns (column order varies).

**Integration**
- `POST /v1/employees/bulk-status`: 200 with correct counts; 403 for `HR_VIEWER`;
  400 if `ids` exceeds 200.
- `POST /v1/employees/import`: 201 with `imported=N, failed=[]` for a valid CSV;
  partial result when some rows are invalid; 400 for non-CSV file; 400 for
  missing header row; 413 for >2 MB file.

**E2E (Playwright)**
- Employee list: select 3 rows → bulk toolbar appears → set to Inactive → toast
  shown → rows updated in list.
- Import page: upload valid CSV → results show N imported, 0 failed → "View
  Employees" navigates to list.
- Import page: upload CSV with 2 invalid rows → results show failures with
  row numbers and error messages.
- Import page: "Download template" downloads a file with the correct headers.

## Success Criteria

- [ ] Bulk status change updates N rows in a single SQL statement.
- [ ] CSV import partial-success: valid rows inserted even when some fail.
- [ ] `HR_VIEWER` cannot see or use bulk actions (toolbar absent, import route 403).
- [ ] All non-negotiable test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `BulkStatusDto`, `ImportResultDto` types; add to `@salary-mgmt/types` | `feat/employee-bulk-ops-pr1-types` |
| RED — unit + integration tests for both endpoints | `feat/employee-bulk-ops-pr2-test-harness` |
| `bulkUpdateStatus` + `importFromCsv` in `EmployeesService`; controller routes (GREEN) | `feat/employee-bulk-ops-pr3-api` |

### Frontend

| Phase | Branch |
|---|---|
| Row checkboxes, select-all, bulk action toolbar on employee list | `feat/employee-bulk-ops-fe-pr1-list-select` |
| Import wizard page (`/employees/bulk`): upload step + results step | `feat/employee-bulk-ops-fe-pr2-import-wizard` |
| Unit + integration + E2E tests | `feat/employee-bulk-ops-fe-pr3-tests` |

Plan: [`docs/plans/employee-bulk-ops.md`](../plans/employee-bulk-ops.md) · Trace: [`traces/employee-bulk-ops.md`](../../traces/employee-bulk-ops.md)
