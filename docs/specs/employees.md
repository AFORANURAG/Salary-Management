# Spec: Employees

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/employees` and the employee list UI in `apps/web`.

## Objective

CRUD and discovery for employee records — the backbone entity the rest of the system references. Must stay responsive at ~10,000 rows via server-side search, filter, and pagination.

## Data Model

`Employee`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `employeeCode` | string, unique | human-facing code; indexed |
| `name` | string | indexed for search |
| `email` | string, unique | indexed for search |
| `department` | string (or FK) | filterable; indexed |
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
POST   /v1/employees              → create
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
- All list queries hit indexed columns; no full-table scans at 10k rows.

## Non-Negotiable Test Cases

- Search by partial name/code/email returns correct, stable, paginated results across 10k seeded rows.
- Combined filters (department + country + status) compose correctly with search.
- Soft-deleting an employee preserves their existing payroll/payslip records.

## Success Criteria

- [ ] List endpoint p95 < 300ms locally over 10k seeded rows on indexed queries.
- [ ] Pagination returns correct `total` and stable ordering across pages.
- [ ] CRUD enforces uniqueness on `employeeCode` and `email`.

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

### Frontend Success Criteria

- [ ] `/employees` is interactive: search, filter, sort, and paginate work end-to-end
      against the running API.
- [ ] All non-negotiable frontend test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Open Questions

- Add `costCenter` field? (root Open Question #4) — currently modeled as nullable pending confirmation.
- Is `department` a free-text string or its own reference table?

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

Plan: [`docs/plans/employees.md`](../plans/employees.md) · Frontend plan: [`docs/plans/employees-fe.md`](../plans/employees-fe.md) · Trace: [`traces/employees.md`](../../traces/employees.md)
