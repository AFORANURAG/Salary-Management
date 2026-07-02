# Implementation Plan: Employees

> Source spec: [`../specs/employees.md`](../specs/employees.md) · Trace log: [`../../traces/employees.md`](../../traces/employees.md)

## Overview

CRUD and discovery for the `Employee` entity — the backbone the rest of the
system references. Must stay responsive at ~10,000 rows via server-side search,
filter, and pagination. First module in the domain chain (employees →
salary-structure → payroll → payslips → reporting); `scaffolding` is complete.

Built **test-first**: the RED suite is written before any CRUD (per AGENTS.md
lifecycle and the [test-driven-development skill](../../.ai/skills/test-driven-development/SKILL.md)).
One logical Conventional Commit per task; trace entries ship atomically with
each task commit.

## Architecture decisions

- Soft delete is a status change (`employmentStatus`), never a hard row removal —
  historical payroll references must survive.
- List response reuses `PaginatedResponse<T>` from `@salary-mgmt/types`.
- List queries hit indexed columns only; deterministic ordering with a secondary
  `id` tiebreak for stable pagination.
- Deferred open questions (do not block this plan): `costCenter` stays nullable;
  `department` stays a free-text string. See Open Questions.

## Ask-first boundaries in this plan

Per AGENTS.md, confirm with the user before executing these:

- **DB schema change** — the `Employee` entity + first migration (ET2).
- **New dependencies** — test-DB tooling and `@faker-js/faker` for the seed
  (ET3 / ET9).

## Task list

### Phase 1 — Foundation (test prerequisites, no CRUD logic)

| Task | Description | Commit |
|---|---|---|
| ET1 | `packages/types`: add `Employee`, `EmploymentStatus`, `EmployeeListQuery`, create/update DTO-shape contracts; reuse `PaginatedResponse` | `feat(types): add employee contracts` |
| ET2 | `apps/api/src/employees/employee.entity.ts` + first TypeORM migration (uuid PK, unique `employeeCode`/`email`, indexes on name/email/department/country/status, `employmentStatus` enum, nullable `costCenter`, timestamps) | `feat(api): add employee entity and migration` |
| ET3 | Integration test harness: `@nestjs/testing` + Vitest against a test Postgres (`apps/api/test`), per-test isolation/truncation, `Employee` fixture factory | `test(api): add employee integration test harness` |

**ET1 acceptance**
- [ ] Types exported from `@salary-mgmt/types` and importable by api + web.
- [ ] `EmployeeListQuery` models `q`, `department`, `country`, `status`, `page`, `pageSize`, `sort`.
- [ ] Verification: `pnpm --filter @salary-mgmt/types build && pnpm typecheck`.

**ET2 acceptance** (ask-first: schema)
- [ ] Entity matches the spec Data Model; money-free (no salary fields here).
- [ ] Migration creates the table + all indexes and unique constraints.
- [ ] Verification: `pnpm --filter api migration:run` against compose db succeeds.

**ET3 acceptance**
- [ ] A trivial "table is empty" integration test boots the Nest app against the
      test DB and passes.
- [ ] Each test starts from a clean table (isolation verified by two independent tests).
- [ ] Verification: `pnpm --filter api test`.

### Checkpoint: Foundation
- [ ] `pnpm typecheck && pnpm lint` clean; migration runs on compose db; harness test green.

### Phase 2 — RED (extensive failing test suite, before CRUD)

The suite is the executable spec. Cover happy paths, every validation/error
branch, and edge cases. Split into focused files (DAMP over DRY).

**ET4 — Unit specs** (small, pure; `*.spec.ts` beside source) — `test(api): add failing employee unit specs`
- [ ] Create/update DTO validation: required fields; email format; `employeeCode`
      format; ISO-3166 `country`; ISO-4217 `currency`; `employmentStatus` enum
      membership; unknown-field rejection (whitelist); `costCenter` nullable.
- [ ] List query parsing: `pageSize` default 25 and cap 100 (over-cap clamps);
      `page` default 1 and `< 1` rejected; `sort` whitelist + `asc|desc`; invalid
      `sort` rejected; repeatable filter params normalized.

**ET5 — Integration specs** (medium, real test DB; `apps/api/test/employees/*`) — `test(api): add failing employee crud and list integration specs`
- [ ] Create: success returns persisted shape; 409 duplicate `employeeCode`; 409
      duplicate `email`; 400 invalid body.
- [ ] Fetch one: 200 existing; 404 missing id; 404 (not 500) malformed uuid.
- [ ] Update: partial `PATCH` succeeds; uniqueness re-check 409; 404 missing;
      immutable fields (`id`, `createdAt`) ignored/rejected.
- [ ] Soft delete: sets status; record still fetchable and **preserved**;
      double-delete is a safe no-op; status filter includes/excludes deleted.
- [ ] List search: partial match across `name` / `employeeCode` / `email`;
      case-insensitive; no-match returns empty page with correct `total`.
- [ ] List filters: `department`, `country`, `status` singly; repeated values (OR
      within field); multiple fields compose (AND); filters compose with `q`.
- [ ] List pagination/sort: correct `total` independent of page; stable ordering
      across pages (no dup/skip at boundaries); last partial page; `sort`
      asc/desc; deterministic secondary-`id` tiebreak.
- [ ] Contract: response matches `PaginatedResponse<Employee>`.

**ET5b — Scale/perf specs** (seeded; depends on ET9) — `test(api): add employee scale and performance specs`
- [ ] Over ~10k rows: search returns correct stable paginated results.
- [ ] Combined filters + search compose correctly at scale.
- [ ] List p95 < 300ms locally on indexed queries (may be tagged/optional in CI).
- [ ] Authored now as skipped/todo; enabled after ET9 seed.

### Checkpoint: RED confirmed
- [ ] ET4/ET5 run and **fail for the right reason** (missing impl, not harness errors).
- [ ] Go/no-go gate before writing any CRUD.

### Phase 3 — GREEN (implement to pass, minimal)

| Task | Description | Commit |
|---|---|---|
| ET6 | Module/service/controller + `class-validator` DTOs: `POST /employees`, `GET /employees/:id` | `feat(api): add employee create and fetch` |
| ET7 | `PATCH /employees/:id` (uniqueness re-check), `DELETE /employees/:id` (soft delete) | `feat(api): add employee update and soft delete` |
| ET8 | `GET /employees` search/filter/paginate/sort → `PaginatedResponse<Employee>` on indexed queries | `feat(api): add employee list with search filter pagination` |

- [ ] ET6 turns create/fetch specs green.
- [ ] ET7 turns update/soft-delete specs green.
- [ ] ET8 turns list specs green.
- [ ] Verification per task: `pnpm --filter api typecheck && pnpm --filter api lint && pnpm --filter api test`.

### Phase 4 — Data + REFACTOR

| Task | Description | Commit |
|---|---|---|
| ET9 | Replace no-op seed with faker-based batch insert of ~10k employees across departments/countries/currencies | `feat(api): seed 10k employees` |
| ET10 | With suite green, tidy service/query builder; enable ET5b; verify list p95 < 300ms over 10k; no regressions | `refactor(api): tidy employee module` |

- [ ] ET9 (ask-first: dependency) enables ET5b scale assertions.
- [ ] ET10 only committed if changes are made.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases + Success Criteria pass.
- [ ] List p95 < 300ms locally over 10k seeded rows.
- [ ] Full root verification green; ready for review.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate-key race on create/update | Med | DB unique constraint is source of truth; map violation → 409 |
| Pagination instability (dup/skip at boundaries) | High | Deterministic ORDER BY with secondary `id` tiebreak; boundary tests |
| 10k seed slow / flaky | Med | Chunked batch inserts; seed idempotency; time-box in CI |
| Test-DB isolation flakiness | Med | Truncate between tests; no shared mutable state; single-thread pool |
| List perf regression at scale | Med | Index-only queries; p95 assertion in ET5b |

## Open Questions

- Add `costCenter`? (root Open Question #4) — modeled nullable, deferred.
- Is `department` free-text or its own reference table? — free-text for now, deferred.
