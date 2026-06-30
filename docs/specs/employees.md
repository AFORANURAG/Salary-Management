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

```
POST   /employees                 → create
GET    /employees/:id             → fetch one
PATCH  /employees/:id             → update
DELETE /employees/:id             → soft-delete (set status, preserve history)
GET    /employees                 → list (search + filter + paginate)
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

## Open Questions

- Add `costCenter` field? (root Open Question #4) — currently modeled as nullable pending confirmation.
- Is `department` a free-text string or its own reference table?
