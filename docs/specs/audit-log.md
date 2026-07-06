# Spec: Audit Log

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/audit-log`
> and `apps/web/app/(authenticated)/audit-log/`.
> Depends on [`hr-auth.md`](./hr-auth.md) — `actorId` is an `HrUser.id`;
> endpoint is `ADMIN`-only.

## Objective

Every mutation in the ACME HRMS — creating an employee, changing a salary
structure, running or voiding payroll, inviting or modifying an HR user — is
recorded as an immutable audit entry capturing who did it, when, and what
changed. The audit log is the single source of truth for compliance and
incident investigation.

Writes happen from service-layer method calls (not an interceptor) because
services already have the `before` and `after` state. The log is append-only:
no update or delete on `AuditLogEntry` rows, ever.

## Data Model

### `AuditLogEntry`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `entityType` | enum: `EMPLOYEE` \| `SALARY_STRUCTURE` \| `PAYROLL_RUN` \| `HR_USER` | which domain entity changed |
| `entityId` | string | the UUID of the affected row |
| `action` | enum: `CREATE` \| `UPDATE` \| `DELETE` \| `VOID` \| `LOGIN` \| `INVITE` | what happened |
| `actorId` | uuid, FK → `HrUser.id`, nullable | null for system/seed actions |
| `actorEmail` | string | denormalized — survives HR user deletion |
| `before` | jsonb, nullable | serialized entity state before change; null for CREATE |
| `after` | jsonb | serialized entity state after change |
| `createdAt` | timestamptz | immutable; index for time-range queries |

Index: `(entityType, entityId)` — for "show history of this employee".
Index: `(actorId)` — for "show all actions by this user".
Index: `(createdAt DESC)` — for the default list query.

### What is recorded

| Event | `entityType` | `action` | `before` | `after` |
|---|---|---|---|---|
| `POST /v1/employees` | `EMPLOYEE` | `CREATE` | null | full employee snapshot |
| `PATCH /v1/employees/:id` | `EMPLOYEE` | `UPDATE` | pre-patch snapshot | post-patch snapshot |
| `DELETE /v1/employees/:id` (soft) | `EMPLOYEE` | `DELETE` | pre-delete snapshot | `{ status: "TERMINATED" }` |
| `PUT /v1/employees/:id/salary-structure` | `SALARY_STRUCTURE` | `CREATE` or `UPDATE` | previous structure or null | new structure |
| `POST /v1/payroll/runs` | `PAYROLL_RUN` | `CREATE` | null | run metadata |
| `POST /v1/payroll/runs/:period/void` | `PAYROLL_RUN` | `VOID` | `{ status: "COMPLETED" }` | `{ status: "VOIDED", voidedAt, voidedBy }` |
| `POST /v1/auth/invite` | `HR_USER` | `INVITE` | null | `{ email, role }` (no token) |
| `POST /v1/auth/setup` | `HR_USER` | `UPDATE` | `{ status: "PENDING_SETUP" }` | `{ status: "ACTIVE" }` |
| Employee bulk status change | `EMPLOYEE` | `UPDATE` | `{ status: before }` | `{ status: after }` — one entry per affected employee |
| CSV import (each created employee) | `EMPLOYEE` | `CREATE` | null | full employee snapshot |

**Not** recorded: read operations (`GET`), login attempts, failed requests.

## API Surface

```
GET /v1/audit-log                            → paginated log (ADMIN only)
GET /v1/audit-log/:entityType/:entityId      → history of a specific entity (ADMIN only)
```

### `GET /v1/audit-log`

Query params:
- `page` (default 1), `pageSize` (default 25, max 100)
- `entityType` — filter by entity type
- `actorId` — filter by actor UUID
- `from`, `to` — ISO date range on `createdAt`

Response: `PaginatedResponse<AuditLogEntry>` ordered by `createdAt DESC`.

### `GET /v1/audit-log/:entityType/:entityId`

Returns all entries for a specific entity (e.g. all changes to employee `abc-123`),
ordered `createdAt DESC`. No pagination — this is a bounded history per entity.

Returns `[]` (empty array, not 404) if no entries exist.

## `AuditLogService`

Single method called by other services:

```ts
AuditLogService.record(entry: {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actor: { id: string | null; email: string };
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
}): Promise<void>
```

This is a **fire-and-forget** write — callers `await` it but a failure does
NOT roll back the parent operation. Log writes must not break business logic.
`record()` catches and swallows its own errors (logs to console for
observability, does not throw).

`AuditLogModule` exports `AuditLogService`. Other modules import
`AuditLogModule` to inject `AuditLogService`.

## Frontend: `/audit-log`

Accessible via the Admin sidebar section (ADMIN only).

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Audit Log                                              │
│                                                         │
│  Filters: [Entity Type ▼] [Actor ▼] [From] [To] [Reset]│
├─────────────────────────────────────────────────────────┤
│  Table: Timestamp | Actor | Action | Entity | Entity ID │
│  ─────────────────────────────────────────────────────  │
│  01 Jul 2026 09:12  admin@acme.com  CREATE  EMPLOYEE    │
│    ▶ expand                                             │
└─────────────────────────────────────────────────────────┘
```

### Row Expansion

Each row expands inline to show a **before/after diff view**:
- Two-column JSON display: "Before" (left) / "After" (right).
- Changed keys highlighted (background color diff).
- Uses a simple key-by-key comparison — no external diff library for MVP.
- `before` is shown as "—" for `CREATE` actions.

### Entity Link

The `Entity` column shows entity type + a shortened ID. Clicking it navigates
to the relevant resource:
- `EMPLOYEE` → `/employees/{entityId}`
- `PAYROLL_RUN` → `/payroll/{period}` (period derived from `after.period`)
- `HR_USER` → `/users/{entityId}` (placeholder — renders "User Management" page
  in a future spec)
- `SALARY_STRUCTURE` → `/employees/{after.employeeId}` (employee detail)

### Per-Entity History (embedded, not a standalone page)

On the employee detail page `/employees/[id]`, a new "Change History" tab
calls `GET /v1/audit-log/EMPLOYEE/:id` and renders the same expandable table,
scoped to that employee. This makes the audit log feel connected to the rest of
the app rather than being an isolated admin screen.

## Data Layer (`@salary-mgmt/store`)

- `getAuditLog(query)` API fn + `useAuditLog(query)` hook — `queryKey: ['audit-log', query]`
- `getEntityAuditLog(entityType, entityId)` API fn + `useEntityAuditLog(entityType, entityId)` hook
- `AuditLogEntry`, `AuditEntityType`, `AuditAction` added to `@salary-mgmt/types`

## Key Rules

- `AuditLogEntry` rows are **never updated or deleted** — append-only. No
  `PATCH` or `DELETE` endpoint exists.
- `record()` failures are swallowed — they must not abort the parent
  transaction.
- `before` / `after` snapshots must not include sensitive fields: strip
  `passwordHash`, `inviteToken` before persisting.
- `actorEmail` is denormalized at write time — queries do not join to `HrUser`.
- `actor` is null (system) for seed-created records; use email `"system"`.

## Non-Negotiable Test Cases

**Unit**
- `AuditLogService.record()` persists an entry with correct fields.
- `record()` swallows database errors and does not throw.
- `before`/`after` for an HR_USER entry does not contain `passwordHash` or `inviteToken`.

**Integration**
- `EmployeesService.create()` results in an `EMPLOYEE/CREATE` audit entry.
- `EmployeesService.update()` results in an `EMPLOYEE/UPDATE` entry with correct before/after.
- `GET /v1/audit-log` 403 for `HR_MANAGER` and `HR_VIEWER`.
- `GET /v1/audit-log` with `entityType=EMPLOYEE` filter returns only employee entries.
- `GET /v1/audit-log/:entityType/:entityId` returns ordered history for that entity.

**E2E (Playwright)**
- Create an employee → navigate to `/audit-log` → a CREATE entry for that employee is visible.
- Expand entry row → before is "—"; after shows the employee fields.
- Click entity link → navigates to the employee detail page.
- Employee detail page → "Change History" tab shows the same CREATE entry.
- `HR_MANAGER` session → `/audit-log` redirects or shows 403.

## Success Criteria

- [ ] Every mutation listed in the "What is recorded" table produces a log entry.
- [ ] `record()` failure never breaks the parent operation.
- [ ] Sensitive fields (`passwordHash`, `inviteToken`) absent from all log entries.
- [ ] Per-entity history tab on employee detail page shows correct entries.
- [ ] All non-negotiable test cases pass.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `AuditLogEntry` entity, migration, `AuditEntityType`/`AuditAction` types | `feat/audit-log-pr1-db-models` |
| RED — unit + integration tests for `record()` and list/entity endpoints | `feat/audit-log-pr2-test-harness` |
| `AuditLogService`, `AuditLogController`, `AuditLogModule` (GREEN) | `feat/audit-log-pr3-api` |
| Wire `record()` calls into employees, salary-structure, payroll, auth services | `feat/audit-log-pr4-service-wiring` |

### Frontend

| Phase | Branch |
|---|---|
| `useAuditLog` + `useEntityAuditLog` hooks; `AuditLogEntry` type | `feat/audit-log-fe-pr1-hooks` |
| `/audit-log` page: filter bar, table, row expansion, entity links | `feat/audit-log-fe-pr2-page` |
| "Change History" tab on employee detail page | `feat/audit-log-fe-pr3-entity-tab` |
| Unit + integration + E2E tests | `feat/audit-log-fe-pr4-tests` |

Plan: [`docs/plans/audit-log.md`](../plans/audit-log.md) · Trace: [`traces/audit-log.md`](../../traces/audit-log.md)
