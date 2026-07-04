# Implementation Plan: Salary Structure

> Source spec: [`../specs/salary-structure.md`](../specs/salary-structure.md) · Trace log: [`../../traces/salary-structure.md`](../../traces/salary-structure.md)

## Overview

Effective-dated, versioned salary compositions for each employee. A `SalaryStructure`
version holds metadata (effectiveFrom/To, currency) and owns a set of `SalaryComponent`
line items (EARNING/DEDUCTION amounts). Updating a structure closes the current version
and inserts a new one — old component amounts are never mutated. This is the snapshot
anchor that makes payroll deterministic and reconstructable.

Built **test-first**: RED suite authored before any implementation. Three stacked
branches — one per phase.

## Architecture Decisions

- **Free-form component codes** — Resolved Open Question. `code` is a free-text
  `SCREAMING_SNAKE` string (e.g. `BASIC`, `HRA`, `PF`). No catalog table. Adding a
  controlled catalog is deferred; payroll only needs `kind` (EARNING/DEDUCTION) to compute.
- **Immutable versions and components** — Neither `SalaryStructure` nor `SalaryComponent`
  has an `updatedAt`. Versions are closed by writing `effectiveTo`; components are never
  touched after insert.
- **PUT = supersede + create** — If no active version exists, creates the first one
  (no close step). If one exists, sets `effectiveTo = effectiveFrom - 1 day` then inserts
  the new version with its components in a single transaction.
- **Overlap invariant enforced in service** — Before inserting, validate that the new
  `effectiveFrom` > current version's `effectiveFrom`. DB does not enforce this; service
  throws 409 if violated.
- **Nested routes under `/v1/employees/:employeeId/salary-structure`** — uses NestJS
  param passthrough; employeeId validated as UUID in service (404 if employee not found).
- **`SalaryStructureEntity` + `SalaryComponentEntity` added to `TestDataSource`** so
  fixtures can be inserted directly and `truncateAll` covers both tables.

## Ask-First Boundaries

- **DB schema change** — two new entities + migration (SS2). Confirm before executing.

## Task List

### Phase 1 — Foundation

Branch: `feat/salary-structure-pr1-db-models`

| Task | ID | Description | Commit |
|---|---|---|---|
| SS1 | Types | Add `SalaryStructure`, `SalaryComponent`, `ComponentKind`, `UpsertSalaryStructureInput`, `SalaryStructureWithComponents` to `@salary-mgmt/types` | `feat(types): add salary-structure contracts` |
| SS2 | Entity + Migration | `SalaryStructureEntity`, `SalaryComponentEntity`, migration: tables + FK constraints + indexes on `employeeId` and `structureId` | `feat(api): add salary-structure entities and migration` |
| SS3 | Test harness update | Add `SalaryStructureEntity` + `SalaryComponentEntity` to `TestDataSource` entities list; extend `truncateAll` to include both tables; add `buildSalaryStructureInput` fixture factory | `test(api): extend test harness for salary-structure` |

**SS1 acceptance**
- [ ] `SalaryStructure` has `id`, `employeeId`, `effectiveFrom`, `effectiveTo | null`, `currency`, `createdAt`, `components`.
- [ ] `SalaryComponent` has `id`, `structureId`, `code`, `kind: ComponentKind`, `amountMinor`.
- [ ] `UpsertSalaryStructureInput` has `effectiveFrom`, `currency`, `components: ComponentInput[]`.
- [ ] Verification: `pnpm --filter @salary-mgmt/types build && pnpm typecheck`.

**SS2 acceptance** (ask-first: schema)
- [ ] `salary_structures` table: uuid PK, FK→employees, `effective_from` date, `effective_to` date nullable, `currency` varchar(3), `created_at` timestamptz. Index on `employee_id`.
- [ ] `salary_components` table: uuid PK, FK→salary_structures (CASCADE DELETE), `code` varchar(64), `kind` enum `EARNING|DEDUCTION`, `amount_minor` integer (not null). Index on `structure_id`.
- [ ] Migration runs clean on compose db.
- [ ] Verification: `pnpm --filter api migration:run`.

**SS3 acceptance**
- [ ] `TestDataSource.entities` includes both new entities.
- [ ] `truncateAll` truncates `salary_components` then `salary_structures` (order respects FK).
- [ ] Fixture factory `buildSalaryStructureInput` produces a valid `UpsertSalaryStructureInput` with at least one EARNING component.
- [ ] Verification: existing harness test still green: `pnpm --filter api test`.

### Checkpoint: Foundation
- [ ] `pnpm typecheck && pnpm lint` clean; migration runs; existing tests unaffected.

---

### Phase 2 — RED (failing test suite)

Branch: `feat/salary-structure-pr2-test-harness`

All tests in this phase must **fail for the right reason** (missing impl, not harness errors).

**SS4 — Unit specs** (`src/salary/*.spec.ts`) — `test(api): add failing salary-structure unit specs`

- [ ] `effectiveTo` computation: closing a version sets `effectiveTo = effectiveFrom - 1 day`.
- [ ] Overlap guard: new `effectiveFrom` ≤ current `effectiveFrom` throws `ConflictException`.
- [ ] Active-version resolution: `effectiveFrom <= date AND (effectiveTo IS NULL OR effectiveTo >= date)` selects the correct version for a given date.
- [ ] Historical resolution returns the version active at a past date, not the latest.

**SS5 — Integration specs** (`test/salary-structure/*.e2e-spec.ts`) — `test(api): add failing salary-structure integration specs`

- [ ] `PUT` first structure (no prior version): 201; `effectiveTo` is null; components persisted correctly.
- [ ] `PUT` second structure: prior version's `effectiveTo` set to `newEffectiveFrom - 1 day`; prior components byte-for-byte unchanged; new version has its own components.
- [ ] `PUT` with `effectiveFrom` ≤ current `effectiveFrom` returns 409.
- [ ] `PUT` for non-existent `employeeId` returns 404.
- [ ] `GET current` for employee with active structure returns the open version with components.
- [ ] `GET current` for employee with no structure returns 404.
- [ ] `GET current` returns correct version after an update (new version, not old).
- [ ] `GET history` returns all versions in `effectiveFrom` ascending order.
- [ ] `GET history` returns empty array for employee with no structures.
- [ ] No two versions for the same employee have overlapping `[effectiveFrom, effectiveTo]` ranges (invariant test).

### Checkpoint: RED confirmed
- [ ] SS4/SS5 fail for the right reason (routes 404, service not found).
- [ ] Go/no-go gate before any implementation.

---

### Phase 3 — GREEN (implement to pass)

Branch: `feat/salary-structure-pr3-implementation`

| Task | ID | Description | Commit |
|---|---|---|---|
| SS6 | DTOs | `UpsertSalaryStructureDto` + `ComponentDto` with `class-validator`; ISO-4217 currency; `amountMinor` integer ≥ 0; `kind` enum; `code` SCREAMING_SNAKE pattern | `feat(api): add salary-structure DTOs` |
| SS7 | Service | `SalaryStructureService`: `upsert`, `findCurrent`, `findHistory`; transactional supersede logic; overlap guard; employee existence check | `feat(api): add salary-structure service` |
| SS8 | Controller + Module | `SalaryStructureController` under `/employees/:employeeId/salary-structure`; wire into `SalaryModule`; register entities in module | `feat(api): add salary-structure controller and module` |

**SS6–SS8 acceptance**
- [ ] All SS4 unit specs green.
- [ ] All SS5 integration specs green.
- [ ] `amountMinor` is always integer; no float arithmetic anywhere.
- [ ] Supersede + insert runs in a single TypeORM transaction (no partial state on failure).
- [ ] Verification: `pnpm --filter api typecheck && pnpm --filter api lint && pnpm --filter api test`.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases pass.
- [ ] All Success Criteria met.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [ ] Ready for review.

---

---

## Frontend Phases

### Phase 4 — Store hooks + RED component specs

Branch: `feat/salary-structure-fe-pr1-hooks-red`

| Task | ID | Description | Commit |
|---|---|---|---|
| SF1 | API fns | Add `getSalaryStructure`, `getSalaryStructureHistory`, `upsertSalaryStructure` to `@salary-mgmt/store/src/api/salary-structure.ts` | `feat(store): add salary-structure API functions` |
| SF2 | Hooks | `useSalaryStructure`, `useSalaryStructureHistory`, `useUpsertSalaryStructure` in `@salary-mgmt/store` | `feat(store): add salary-structure hooks` |
| SF3 | RED specs | Failing component tests for `SalaryStructureCard`, `SalaryStructureHistory`, `UpsertSalaryStructureDialog` | `test(web): add failing salary-structure component specs` |

### Phase 5 — GREEN: components + detail page wiring

Branch: `feat/salary-structure-fe-pr2-components`

| Task | ID | Description | Commit |
|---|---|---|---|
| SF4 | `SalaryStructureCard` | Active structure display: effectiveFrom, currency, components table, loading skeleton, empty state | `feat(web): add SalaryStructureCard component` |
| SF5 | `SalaryStructureHistory` | Collapsible version history list | `feat(web): add SalaryStructureHistory component` |
| SF6 | `UpsertSalaryStructureDialog` | Form with dynamic component rows; zod validation; 409 surfaced as field error | `feat(web): add UpsertSalaryStructureDialog` |
| SF7 | Wire into detail page | Add structure section + "Set Salary Structure" button to `/employees/[id]` | `feat(web): wire salary structure into employee detail page` |

### Phase 6 — Integration + E2E tests

Branch: `feat/salary-structure-fe-pr3-tests`

| Task | ID | Description | Commit |
|---|---|---|---|
| SF8 | MSW handlers | Add `GET /v1/employees/:id/salary-structure` and `PUT` handlers to MSW fixture set | `test(web): add MSW handlers for salary-structure` |
| SF9 | Integration tests | Detail page renders card via real hook + MSW; upsert dialog PUT triggers re-fetch | `test(web): add salary-structure integration tests` |
| SF10 | E2E tests | Detail page shows structure; upsert flow updates card; history shows previous versions | `test(e2e): add salary-structure E2E tests` |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Partial supersede (close old, fail on insert new) | High | Single TypeORM transaction; rollback on any error |
| Overlap not caught — two open versions | High | Overlap guard in service before insert; integration test asserts invariant |
| `truncateAll` order violates FK (components refs structures) | Med | Truncate `salary_components` before `salary_structures` |
| `effectiveTo = effectiveFrom - 1 day` crosses month/year boundary | Low | Use date arithmetic (no custom logic); covered by unit test |
| Employee not found — 500 instead of 404 | Med | Explicit employee existence check before any structure operation |

## Open Questions

- ~~Are component `code`s free-form or drawn from a controlled catalog?~~ **Resolved:** free-form `SCREAMING_SNAKE` string. No catalog for MVP.
