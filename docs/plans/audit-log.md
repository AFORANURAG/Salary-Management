# Implementation Plan: Audit Log

> Source spec: [`../specs/audit-log.md`](../specs/audit-log.md) · Trace log: [`../../traces/audit-log.md`](../../traces/audit-log.md)

## Overview

Immutable append-only record of every mutation in the HRMS. `AuditLogService.record()`
is called from service methods (not an interceptor) so the before/after state is
available. ADMIN-only read endpoints. A per-entity history tab on the employee
detail page connects the log to the rest of the app. Eight stacked branches
(4 backend, 4 frontend). Depends on `hr-auth` for `actorId`.

## Architecture Decisions

- **Standalone `AuditLogModule`** — exports `AuditLogService`; other modules
  import `AuditLogModule` to inject the service. No circular dependencies
  because `AuditLogService` does not import any other domain service.
- **`record()` is fire-and-forget** — callers `await` it but failures are
  caught and swallowed inside `record()`; a log write must never abort a
  business operation.
- **`before`/`after` are jsonb** — TypeORM column type `jsonb`; TypeScript type
  `Record<string, unknown>`. Sensitive fields stripped before persisting
  (`passwordHash`, `inviteToken`).
- **`actorEmail` denormalized** — stored at write time; no JOIN to `HrUser`
  at read time; survives HR user deletion.
- **`actor` is null for system operations** — seed and system-initiated actions
  use `{ id: null, email: 'system' }`.
- **Per-entity history endpoint** — `GET /v1/audit-log/:entityType/:entityId`
  returns an unbounded array (bounded by entity's lifetime; acceptable).
- **Frontend diff view** — key-by-key comparison in plain JavaScript; no diff
  library; changed keys highlighted with a background color.
- **New `AuditLogEntry` shared type** added to `@salary-mgmt/types`.

## Ask-First Boundaries

- DB schema change: `AuditLogEntry` entity + migration (AL2).
- No new npm dependencies expected.

---

## Task List

### Phase 1 — DB Models & Types

Branch: `feat/audit-log-pr1-db-models`

| Task | Description | Commit |
|---|---|---|
| AL1 | `packages/types`: add `AuditEntityType` enum, `AuditAction` enum, `AuditLogEntry` interface, `AuditLogListQuery` interface | `feat(types): add audit-log contracts` |
| AL2 | `AuditLogEntryEntity` + TypeORM migration: uuid PK, `entityType` enum, `entityId` varchar, `action` enum, `actorId` uuid nullable, `actorEmail` varchar, `before` jsonb nullable, `after` jsonb, `createdAt` timestamptz; indexes on `(entityType, entityId)`, `actorId`, `createdAt DESC` | `feat(api): add AuditLogEntry entity and migration` |
| AL3 | `AuditLogModule` stub: `TypeOrmModule.forFeature([AuditLogEntryEntity])`; stub service + controller; register in `AppModule` | `feat(api): add AuditLogModule stub` |

**Acceptance**
- [ ] Types exported; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [ ] Migration runs: `pnpm --filter api migration:run`.
- [ ] `AppModule` boots with stub module.

---

### Phase 2 — RED

Branch: `feat/audit-log-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| AL4 | Unit spec `AuditLogService.record()`: persists entry with correct fields; `record()` swallows DB errors and does not throw; `before`/`after` for HR_USER strips `passwordHash` and `inviteToken` | `test(api): add failing audit-log record unit specs (AL4)` |
| AL5 | Integration spec `GET /v1/audit-log`: 403 for HR_MANAGER + HR_VIEWER; 200 for ADMIN with paginated result; `entityType` filter returns only matching entries; date range filter works | `test(api): add failing audit-log list integration spec (AL5)` |
| AL6 | Integration spec `GET /v1/audit-log/:entityType/:entityId`: returns ordered history for entity; empty array (not 404) when no entries | `test(api): add failing entity audit history integration spec (AL6)` |

**Acceptance**
- [ ] All specs fail RED — service not implemented.

---

### Phase 3 — API (GREEN)

Branch: `feat/audit-log-pr3-api`

| Task | Description | Commit |
|---|---|---|
| AL7 | `AuditLogService.record()`: strip sensitive fields helper; insert `AuditLogEntryEntity`; catch + swallow errors with `console.error` | `feat(api): implement AuditLogService.record (AL7)` |
| AL8 | `AuditLogListQueryDto`: `page`, `pageSize`, optional `entityType`, `actorId`, `from`, `to` | `feat(api): add AuditLogListQueryDto` |
| AL9 | `AuditLogService.list()` + `AuditLogService.listByEntity()`: QueryBuilder with optional filters; ordered `createdAt DESC` | `feat(api): implement AuditLogService list methods (AL9)` |
| AL10 | `AuditLogController`: `GET /v1/audit-log` (`@Roles(ADMIN)`); `GET /v1/audit-log/:entityType/:entityId` (`@Roles(ADMIN)`) | `feat(api): add AuditLogController endpoints (AL10)` |

**Acceptance**
- [ ] All unit specs from AL4 GREEN.
- [ ] All integration specs from AL5–AL6 GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

### Checkpoint: Service ready for wiring

---

### Phase 4 — Service Wiring

Branch: `feat/audit-log-pr4-service-wiring`

Wire `AuditLogService.record()` calls into every mutating service method.
Each module that needs to record must import `AuditLogModule`.

| Task | Description | Commit |
|---|---|---|
| AL11 | `EmployeesModule` imports `AuditLogModule`; `EmployeesService`: inject `AuditLogService`; call `record()` in `create()` (CREATE), `update()` (UPDATE), `softDelete()` (DELETE) | `feat(api): wire audit-log into EmployeesService` |
| AL12 | `SalaryStructureModule` imports `AuditLogModule`; `SalaryStructureService`: call `record()` on `upsert()` (CREATE or UPDATE based on whether prior record existed) | `feat(api): wire audit-log into SalaryStructureService` |
| AL13 | `PayrollModule` imports `AuditLogModule`; `PayrollService`: call `record()` on `createRun()` (CREATE) + `voidRun()` (VOID — from payroll-ops spec) | `feat(api): wire audit-log into PayrollService` |
| AL14 | `AuthModule` imports `AuditLogModule`; `AuthService`: call `record()` on `invite()` (INVITE — no passwordHash) + `setup()` (UPDATE status) | `feat(api): wire audit-log into AuthService` |
| AL15 | `EmployeesService.bulkUpdateStatus()`: call `record()` per affected employee (from bulk-ops spec; wire here if bulk-ops landed first; else wire in this commit) | `feat(api): wire audit-log for bulk status changes` |
| AL16 | Integration test: `EmployeesService.create()` → audit entry present; `update()` → before/after correct; sensitive fields absent from HR_USER entries | `test(api): verify audit-log wiring in service integration tests` |

**Acceptance**
- [ ] All integration tests from AL16 GREEN.
- [ ] All existing service tests still GREEN (record() is fire-and-forget, doesn't affect logic).
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

### Checkpoint: Backend complete
- [ ] All spec "What is recorded" entries producing log rows.
- [ ] Sensitive fields absent from all log entries (verified in tests).

---

### Phase 5 — Frontend: Hooks

Branch: `feat/audit-log-fe-pr1-hooks`

| Task | Description | Commit |
|---|---|---|
| AL17 | `@salary-mgmt/store`: `getAuditLog(query)` + `useAuditLog(query)` hook — `queryKey: ['audit-log', query]` | `feat(store): add useAuditLog hook` |
| AL18 | `getEntityAuditLog(entityType, entityId)` + `useEntityAuditLog(entityType, entityId)` — `queryKey: ['audit-log', entityType, entityId]` | `feat(store): add useEntityAuditLog hook` |
| AL19 | MSW handlers for `GET /v1/audit-log` + `GET /v1/audit-log/:entityType/:entityId` | `test(web): add audit-log MSW handlers` |

**Acceptance**
- [ ] `pnpm --filter @salary-mgmt/store typecheck` passes.

---

### Phase 6 — Frontend: Audit Log Page

Branch: `feat/audit-log-fe-pr2-page`

| Task | Description | Commit |
|---|---|---|
| AL20 | `/audit-log` page (`app/(authenticated)/audit-log/page.tsx`): filter bar (entity type dropdown, actor input, from/to date inputs, Reset button); paginated `AuditLogTable` | `feat(web): add audit log page with filter bar` |
| AL21 | `AuditLogTable` component: columns Timestamp, Actor, Action, Entity Type, Entity ID (shortened); expandable rows | `feat(web): add AuditLogTable component` |
| AL22 | Row expansion: two-column before/after JSON display; changed keys highlighted (`bg-yellow-50`); before shows "—" for CREATE actions | `feat(web): add before/after diff view in audit log row` |
| AL23 | Entity link in table: `EMPLOYEE` → `/employees/{id}`; `PAYROLL_RUN` → `/payroll/{after.period}`; `SALARY_STRUCTURE` → `/employees/{after.employeeId}`; `HR_USER` → `/users/{id}` (placeholder) | `feat(web): add entity navigation links in audit log` |
| AL24 | Unit specs: table renders timestamp, actor, action; expansion shows before/after; CREATE row has "—" before; entity links navigate correctly | `test(web): add AuditLogTable and row expansion unit specs` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] Page renders without errors.

---

### Phase 7 — Employee Detail Change History Tab

Branch: `feat/audit-log-fe-pr3-entity-tab`

| Task | Description | Commit |
|---|---|---|
| AL25 | Add "Change History" tab to `/employees/[id]` detail page: tab list gains third item; tab content renders `AuditLogTable` scoped to `useEntityAuditLog('EMPLOYEE', id)` | `feat(web): add Change History tab to employee detail page` |
| AL26 | Unit spec: Change History tab renders; calls `useEntityAuditLog` with correct entity type and ID; empty state when no entries | `test(web): add Change History tab unit spec` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] Existing employee detail tabs unaffected.

---

### Phase 8 — Tests

Branch: `feat/audit-log-fe-pr4-tests`

| Task | Description | Commit |
|---|---|---|
| AL27 | Integration spec (MSW): `/audit-log` page renders entries from fixture; entity type filter triggers new request with param; date range filter works | `test(web): add audit-log page integration specs` |
| AL28 | E2E: create employee → visit `/audit-log` → CREATE entry visible; expand row → before is "—", after has employee fields; click entity link → navigates to employee detail; employee detail "Change History" tab shows same CREATE entry; HR_MANAGER session → `/audit-log` shows 403 | |

**Acceptance**
- [ ] Integration specs GREEN.
- [ ] E2E specs GREEN against running stack.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases covered and green.
- [ ] Sensitive fields absent from all log entries (E2E verified).
- [ ] Per-entity history visible on employee detail page.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `record()` called inside a transaction that later rolls back — log entry persists but business op failed | Med | For MVP this is acceptable (log may have orphaned entries); if critical, wrap record() in a separate savepoint — defer to post-MVP |
| Circular dependency: `AuditLogModule` ↔ any domain module | High | `AuditLogService` has no imports from domain modules; circular dependency is impossible by design |
| `before` snapshot taken from the ORM entity before an update, but ORM returns a partial object | Med | Explicitly query the full entity before mutating in `update()` methods; pass full snapshot to `record()` |
| Employee detail "Change History" tab fires `useEntityAuditLog` on mount for all employees — unnecessary requests for HR_VIEWER (who can't see `/audit-log`) | Low | `useEntityAuditLog` is still useful for any role on the detail page; only the standalone `/audit-log` page is ADMIN-gated; leave it accessible for now |
