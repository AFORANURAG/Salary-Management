# Spec: Employees

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/employees` and the employee list UI in `apps/web`.

## Objective

CRUD and discovery for employee records — the backbone entity the rest of the system references. Must stay responsive at ~10,000 rows via server-side search, filter, and pagination.

## Data Model

`Employee`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `employeeCode` | string, unique | human-facing code; auto-generated as `EMP-XXXXXX` (sequential, zero-padded to 6 digits) if not supplied by the client; client may provide one explicitly on CSV import; indexed |
| `name` | string | indexed for search |
| `email` | string, unique | indexed for search |
| `department` | enum: `Engineering` \| `Sales` \| `Finance` \| `HR` \| `Operations` | filterable; indexed; validated at API layer |
| `designation` | string | |
| `country` | string (ISO-3166) | filterable; indexed |
| `currency` | string (ISO-4217) | per-employee; drives minor-unit scale |
| `joiningDate` | date | |
| `employmentStatus` | enum: `ACTIVE` \| `INACTIVE` \| `TERMINATED` | filterable; indexed |
| `costCenter` | string \| null | **pending** — see root Open Question #4 |
| `createdAt` / `updatedAt` | timestamptz | |

Salary structures are **not** embedded here — they live in [`salary-structure.md`](./salary-structure.md) and reference `employeeId`.

## API Surface

All routes are served under the `/v1` API prefix (e.g. `/v1/employees`); `/health` is excluded from versioning.

```
POST   /v1/employees              → create (`employeeCode` optional — server generates `EMP-XXXXXX` if absent)
GET    /v1/employees/:id          → fetch one
PATCH  /v1/employees/:id          → update
DELETE /v1/employees/:id          → soft-delete (set status, preserve history)
GET    /v1/employees              → list (search + filter + paginate)
```

`GET /employees` query params:
- `q` — free-text across name / employeeCode / email
- `department`, `country`, `status` — exact-match filters (repeatable)
- `page`, `pageSize` — pagination (default `pageSize=25`, cap `100`)
- `sort` — e.g. `name:asc`, `joiningDate:desc`

Response: `{ data: Employee[], page, pageSize, total }`.

## Key Rules

- Delete is a **soft delete** (status change), never a hard row removal — historical payroll references must survive.
- `employeeCode` and `email` are unique; creation/update returns 409 on conflict.
- `employeeCode` is optional on `POST /v1/employees`: if omitted, the server generates the next `EMP-XXXXXX` by querying `MAX` of existing codes matching the pattern. The Create Employee dialog hides the field entirely; the Edit and CSV Import forms keep it visible.
- All list queries hit indexed columns; no full-table scans at 10k rows.

## Non-Negotiable Test Cases

- Search by partial name/code/email returns correct, stable, paginated results across 10k seeded rows.
- Combined filters (department + country + status) compose correctly with search.
- Soft-deleting an employee preserves their existing payroll/payslip records.
- Creating an employee without `employeeCode` generates a sequential `EMP-XXXXXX` code; the generated code is unique and monotonically increasing.
- The Create Employee dialog does not render the Employee Code field; the server always generates it.

## Success Criteria

- [x] List endpoint p95 < 300ms locally over 10k seeded rows on indexed queries.
- [x] Pagination returns correct `total` and stable ordering across pages.
- [x] CRUD enforces uniqueness on `employeeCode` and `email`.

## Frontend

Pages and components in `apps/web`. Client data layer via `@salary-mgmt/store`
(TanStack Query + typed API client). UI primitives from `@salary-mgmt/ui`.

### Pages

| Route | Description |
|---|---|
| `/employees` | List view — search, filter by department/country/status, sort, paginate |
| `/employees/[id]` | Detail view — read-only employee record |

### Dialogs (rendered over the list page)

- **Create employee** — full form, all required fields, validated before submit
- **Edit employee** — same form pre-populated, partial update via `PATCH`
- **Delete (soft)** — confirmation dialog; sets status to `TERMINATED`

### UI components required

| Component | Package | Notes |
|---|---|---|
| `Table` | `@salary-mgmt/ui` | Sortable column headers; row click navigates to detail |
| `Select` | `@salary-mgmt/ui` | Multi-value selects for filter dropdowns |

### Data layer (hooks in `@salary-mgmt/store`)

| Hook | Used by |
|---|---|
| `useEmployees(query: EmployeeListQuery)` | List page |
| `useEmployee(id: string)` | Detail page |
| `useCreateEmployee()` | Create dialog |
| `useUpdateEmployee()` | Edit dialog |
| `useDeleteEmployee()` | Delete dialog |

### Non-Negotiable Frontend Test Cases

**Unit / component (mocked hooks, jsdom)**
- Employee list renders correct column headings and row data for a page of results.
- Search input is debounced; typing a partial name/code/email updates the list.
- Department, country, and status filters each narrow the list independently and
  compose correctly with each other and with the search text.
- Pagination controls advance and retreat pages; `total` count stays stable across
  page changes.
- Loading skeleton renders while data is fetching.
- Empty state renders when no results match the query.
- Error state renders with a message when the API call fails.
- Create dialog: submitting a valid form calls the API and invalidates the list cache.
- Create dialog: submitting an invalid form shows field-level errors without calling the API.
- Edit dialog: pre-populates all fields from the current employee record.
- Delete confirmation: cancel leaves the record intact; confirm triggers the soft delete.

**Integration (real hooks + MSW network interception, jsdom)** — See [ADR-0008](../decisions/ADR-0008-msw-integration-test-network-interception.md)
- `/employees` list page renders rows fetched through the real `useEmployees` hook
  with MSW intercepting `GET /v1/employees`.
- Typing into the search input triggers a new request with the correct `q` param
  (debounced; real hook + MSW).
- Selecting a department filter triggers a new request with the correct `department`
  param (real hook + MSW).
- Opening the Create dialog, submitting a valid form, and confirming the POST to
  `POST /v1/employees` causes the list to re-fetch (cache invalidation verified).
- Opening the Edit dialog, submitting a valid form, and confirming the PATCH to
  `PATCH /v1/employees/:id` causes the list and detail cache to re-fetch.
- Opening the Delete dialog, clicking Confirm, and seeing the DELETE hit
  `DELETE /v1/employees/:id` causes the list to re-fetch.
- API error response (5xx from MSW) causes the error state to render on the list.

**E2E (Playwright, full stack)**
- `/employees` list page loads and displays employees returned by the running API.
- Searching by partial name filters the list within the debounce window.
- Selecting a department filter narrows the list.
- Navigating to the next page shows a different set of rows.
- Creating an employee via the dialog causes the new record to appear in the list.
- Editing an employee via the dialog updates the displayed row.
- Deleting an employee via the dialog removes the row from the list.

### Frontend Success Criteria

- [x] `/employees` is interactive: search, filter, sort, and paginate work end-to-end
      against the running API.
- [x] All non-negotiable frontend test cases pass (unit + integration + E2E).
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [x] Playwright E2E suite passes against the running Docker stack.

## Seed Data

10,000 employees seeded idempotently (skips if count ≥ 10k):

- All `country=IN`, `currency=INR`.
- Departments: Engineering, Sales, Finance, HR, Operations — proportional distribution.
- Designations matched to department (e.g. Software Engineer → Engineering).
- Org-pyramid weighting across 6 levels: `[35, 25, 20, 12, 6, 2]%` — IC-heavy, realistic.
- Joining dates spread across 2023–2026 to produce varied payroll new-hire deltas.
- Employee codes in `EMP-000001` … `EMP-010000` format.

## Open Questions

- Add `costCenter` field? (root Open Question #4) — currently modeled as nullable pending confirmation.
- ~~Is `department` a free-text string or its own reference table?~~ **Resolved:** controlled enum (`Engineering | Sales | Finance | HR | Operations`), validated at the API layer in the DTO. No reference table — adding departments requires a types + DTO change.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| Entity, migration, shared type contracts | `feat/employees-pr1-db-models` |
| Test harness + RED suite | `feat/employees-pr2-test-harness` |
| CRUD + list implementation (GREEN) | `feat/employees-pr3-implementation` |
| v1 prefix, CLAUDE.md, spec/test URL updates | `feat/employees-pr4-versioning` |

### Frontend

| Phase | Branch |
|---|---|
| UI primitives (Table, Select) + store API fns + web testing infra | `feat/employees-fe-pr1-foundation` |
| RED — all failing component + hook tests | `feat/employees-fe-pr2-red` |
| GREEN — store hooks + list page + detail page | `feat/employees-fe-pr3-list` |
| GREEN — create/edit/delete dialogs | `feat/employees-fe-pr4-forms` |
| Integration tests — MSW + real hooks (jsdom) | `feat/employees-fe-pr5-integration` |
| E2E tests — Playwright against running stack | `feat/employees-fe-pr6-e2e` |
| Employee code auto-generation (backend + form hide) | `fix/employee-code-autogenerate` |
| Seed 10k IN/INR employees with realistic data | `chore/seed-data-india-payroll` |

Plan: [`docs/plans/employees.md`](../plans/employees.md) · Frontend plan: [`docs/plans/employees-fe.md`](../plans/employees-fe.md) · Trace: [`traces/employees.md`](../../traces/employees.md)
