# Implementation Plan: Employee Bulk Operations

> Source spec: [`../specs/employee-bulk-ops.md`](../specs/employee-bulk-ops.md) · Trace log: [`../../traces/employee-bulk-ops.md`](../../traces/employee-bulk-ops.md)

## Overview

Two bulk operations extending the existing employees module: bulk status change
(N IDs → one SQL UPDATE) and CSV import (upload → validate per row → partial
commit). No new entity or migration. Six stacked branches (3 backend, 3 frontend).

## Architecture Decisions

- **Extends `EmployeesController` / `EmployeesService`** — no new module.
  New routes: `POST /v1/employees/bulk-status` and `POST /v1/employees/import`.
  Routes registered before `/:id` to avoid Express capturing `bulk-status` as an ID.
- **CSV parsing** — `csv-parse` (Node.js standard; no extra license concern).
  Install in `api`. Header row required; column order-independent via
  `columns: true` option.
- **Partial commit** — `importFromCsv()` validates all rows first, then runs
  `EmployeesService.create()` per valid row; collects failures; returns combined
  result. Wraps valid inserts in a single transaction.
- **Bulk status change** — single `UPDATE employees SET status = $1 WHERE id = ANY($2)`
  via QueryBuilder; counts affected rows; unknown IDs silently skipped.
- **File upload** — `@nestjs/platform-express` `FileInterceptor` +
  `FileSizeValidator` (2 MB) + `FileTypeValidator` (mimetype `text/csv`).
- **Template CSV** — static file at `apps/web/public/templates/employees-import-template.csv`;
  committed to repo; "Download template" link is a plain anchor to that path.

## Ask-First Boundaries

- `csv-parse` installation in `api` (BO3).

---

## Task List

### Phase 1 — Types

Branch: `feat/employee-bulk-ops-pr1-types`

| Task | Description | Commit |
|---|---|---|
| BO1 | `packages/types`: add `BulkStatusRequest`, `BulkStatusResponse`, `ImportResultRow`, `ImportResponse` interfaces | `feat(types): add employee bulk-ops contracts` |

**Acceptance**
- [x] Types exported; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.

---

### Phase 2 — RED

Branch: `feat/employee-bulk-ops-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| BO2 | Unit spec `EmployeesService.bulkUpdateStatus()`: updates correct rows; returns `{ updated: N, skipped: M }` when some IDs are unknown; single SQL UPDATE (verify via spy) | `test(api): add failing bulk-status unit specs (BO2)` |
| BO3 | Unit spec `EmployeesService.importFromCsv()`: all valid rows inserted; invalid rows returned with per-field errors; duplicate email is a row error not a thrown exception; column order-independent parsing | `test(api): add failing csv-import unit specs (BO3)` |
| BO4 | Integration spec `POST /v1/employees/bulk-status`: 200 correct counts; 403 for HR_VIEWER; 400 if `ids` array exceeds 200; 400 for missing `status` | `test(api): add failing bulk-status integration spec (BO4)` |
| BO5 | Integration spec `POST /v1/employees/import`: 201 all valid CSV; partial result for mixed CSV; 400 non-CSV file; 400 missing header row; 413 >2 MB file | `test(api): add failing csv-import integration spec (BO5)` |

**Acceptance**
- [x] All specs fail RED — routes 404, service methods not yet implemented.

---

### Phase 3 — API (GREEN)

Branch: `feat/employee-bulk-ops-pr3-api`

| Task | Description | Commit |
|---|---|---|
| BO6 | Install `csv-parse` in `api` (ask-first confirmed) | `chore(api): add csv-parse dependency` |
| BO7 | `BulkStatusDto` (`ids: string[]` max 200, `status: EmploymentStatus`); `EmployeesService.bulkUpdateStatus()` single QueryBuilder UPDATE | `feat(api): implement bulk status change (BO7)` |
| BO8 | `EmployeesService.importFromCsv(buffer: Buffer)`: parse CSV with `csv-parse`; validate each row via existing `CreateEmployeeDto` class-transformer; run valid rows in a transaction; collect failures | `feat(api): implement CSV import service method (BO8)` |
| BO9 | `EmployeesController`: `POST /v1/employees/bulk-status` (registered before `/:id`); `POST /v1/employees/import` with `FileInterceptor('file')` + size + type validators | `feat(api): add bulk-status and import controller endpoints (BO9)` |

**Acceptance**
- [x] All unit specs from BO2–BO3 GREEN.
- [x] All integration specs from BO4–BO5 GREEN.
- [x] `pnpm typecheck && pnpm lint && pnpm test` green.

### Checkpoint: Backend complete
- [x] Partial import: valid rows committed even when some fail.
- [x] `POST /v1/employees/bulk-status` uses a single SQL UPDATE.

---

### Phase 4 — Frontend: List Checkboxes & Bulk Toolbar

Branch: `feat/employee-bulk-ops-fe-pr1-list-select`

| Task | Description | Commit |
|---|---|---|
| BO10 | `@salary-mgmt/store`: `postBulkStatusChange(ids, status)` API fn; `useBulkStatusChange()` mutation invalidates `['employees']` on success | `feat(store): add bulk status change mutation` |
| BO11 | Employee list table: add leading checkbox column; header checkbox selects/deselects all rows on current page; selection state in `useState` (scoped to list page); clears on page change | `feat(web): add row checkboxes to employee list` |
| BO12 | `BulkActionToolbar` component (`components/employees/bulk-action-toolbar.tsx`): slides up from bottom when `selection.length > 0`; "{N} selected" count; status dropdown (Active/Inactive/Terminate); Deselect (×); Confirm button → `useBulkStatusChange()` → toast; hidden for HR_VIEWER | `feat(web): add BulkActionToolbar component` |
| BO13 | Unit spec: toolbar hidden when 0 selected; appears when ≥1 selected; submit calls `useBulkStatusChange`; HR_VIEWER: toolbar never renders | `test(web): add BulkActionToolbar unit specs` |

**Acceptance**
- [x] Unit specs GREEN.
- [x] `pnpm typecheck` passes.

---

### Phase 5 — Frontend: Import Wizard

Branch: `feat/employee-bulk-ops-fe-pr2-import-wizard`

| Task | Description | Commit |
|---|---|---|
| BO14 | `@salary-mgmt/store`: `postEmployeeImport(file: File)` API fn (FormData); `useEmployeeImport()` mutation | `feat(store): add employee import mutation` |
| BO15 | Static CSV template at `apps/web/public/templates/employees-import-template.csv` with correct header row | `chore(web): add employees import CSV template` |
| BO16 | `/employees/bulk` route (`app/(authenticated)/employees/bulk/page.tsx`); add "Import CSV" button on employee list page (HR_MANAGER/ADMIN only); sidebar "Bulk Operations" link (already present) points to this route | `feat(web): add bulk import page route and entry points` |
| BO17 | Step 1 — Upload: drag-and-drop zone + browse; `.csv` file type filter; client-side size check (2 MB); file name + size shown; "Download template" anchor; "Preview & Import" button calls `useEmployeeImport()` | `feat(web): add CSV upload step for import wizard` |
| BO18 | Step 2 — Results: "N employees imported successfully"; failure table (row, fields, errors) when `failed.length > 0`; "Import More" resets to Step 1; "View Employees" navigates to `/employees` | `feat(web): add import results step` |
| BO19 | Unit specs: upload step rejects non-CSV; rejects >2 MB client-side; results step renders failure rows; "Import More" resets state | `test(web): add import wizard unit specs` |

**Acceptance**
- [x] Unit specs GREEN.
- [x] Template file committed with correct headers.
- [x] `pnpm typecheck` passes.

---

### Phase 6 — Tests

Branch: `feat/employee-bulk-ops-fe-pr3-tests`

| Task | Description | Commit |
|---|---|---|
| BO20 | Integration spec (MSW): employee list bulk select → bulk toolbar → confirm → MSW 200 → toast + list refetch | `test(web): add bulk-status integration spec` |
| BO21 | Integration spec (MSW): import page upload → MSW 201 all valid → results show N imported 0 failed; MSW 201 partial → failure rows rendered | `test(web): add import wizard integration specs` |
| BO22 | E2E: employee list select 3 rows → toolbar appears → set Inactive → toast + rows updated; import page valid CSV → results show imported; import page 2-invalid-row CSV → failure table shown; "Download template" downloads file | |

**Acceptance**
- [x] Integration specs GREEN.
- [x] E2E specs written (run against live stack).
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [x] All spec Non-Negotiable Test Cases covered and green.
- [x] HR_VIEWER cannot access bulk actions (toolbar absent, import route 403).
- [x] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `POST /v1/employees/bulk-status` route captured as `/:id` | High | Register bulk-status route before `/:id` in controller; verify with integration test |
| CSV with Windows CRLF line endings fails parse | Med | `csv-parse` handles CRLF natively with `relaxLineBreaks: true` |
| Large CSV (e.g. 500 rows) exhausts request timeout | Low | MVP cap: 2 MB ≈ ~500 rows max; adequate for ACME scale |
| Selection state clears on page change (confusing UX) | Low | Documented in spec; scope is current-page-only for MVP |
