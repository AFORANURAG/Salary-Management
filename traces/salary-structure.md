# Trace: Salary Structure

> Spec: [`docs/specs/salary-structure.md`](../docs/specs/salary-structure.md) · Plan: [`docs/plans/salary-structure.md`](../docs/plans/salary-structure.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS1 | `SalaryStructure`, `SalaryComponent`, `ComponentKind`, `UpsertSalaryStructureInput`, `ComponentInput` added to `@salary-mgmt/types` | c841a89 | types build + typecheck pass |
| SS2 | `SalaryStructureEntity` + `SalaryComponentEntity` + migration (tables, FKs, indexes) | c841a89 | `migration:run` applied both tables, enum, 2 indexes, 2 FKs |
| SS3 | `TestDataSource` entities extended; `truncateAll` covers all 3 tables in FK order; `buildSalaryStructureInput` fixture factory added; global-setup updated with new migration | c841a89 | 53 existing tests still green |

### Phase 2 — RED

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS4 | Unit specs: `closeVersion` (date arithmetic), `resolveActiveVersion` (historical resolution) | 813e2bd | RED — file not found (service not yet written) |
| SS5 | Integration specs: 6× PUT, 4× GET current, 3× GET history (incl. overlap invariant) | 813e2bd | RED — all routes 404 (missing impl) |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS6 | `UpsertSalaryStructureDto` + `ComponentDto` with class-validator (ISO-4217, SCREAMING_SNAKE code, integer ≥ 0, array min 1) | 513ed4f | DTO validation tests pass |
| SS7 | `SalaryStructureService`: `upsert` (transactional supersede), `findCurrent`, `findHistory`; `closeVersion` + `resolveActiveVersion` pure helpers exported for unit tests | 513ed4f | all 10 unit specs green |
| SS8 | `SalaryStructureController` under `employees/:employeeId/salary-structure`; `SalaryModule` wired with TypeORM repos; fix: `@JoinColumn({ name: "structure_id" })` on ManyToOne required for correct column aliasing | 513ed4f | 76/76 tests green |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Effective-dated resolution returns correct version for any date | pass | unit spec `resolveActiveVersion` + integration `GET current` after update |
| History endpoint lists all versions in chronological order | pass | integration spec `GET history` asserts ascending effectiveFrom order |
| At most one open (`effectiveTo = null`) version per employee | pass | integration spec overlap invariant test confirms single open version |
| Prior version components byte-for-byte unchanged after supersede | pass | integration spec asserts prior component rows untouched after PUT |
| No overlapping `[effectiveFrom, effectiveTo]` ranges | pass | overlap guard in service + 409 integration spec + invariant test |

Verification run (2026-07-04): `pnpm typecheck` clean; `pnpm lint` clean; 76/76 API tests pass. Web Playwright-via-Vitest failure is pre-existing on `main` (not a regression).

### Phase 3 — Code review fixes

| Fix | Description | Commit |
|---|---|---|
| R1 | `@IsDateString()` → `@Matches(/^\d{4}-\d{2}-\d{2}$/)`: rejects datetime strings that caused `closeVersion` to crash and overlap guard to be bypassed | _pending_ |
| R2 | Pessimistic write lock on `findOne` for open version inside `upsert` transaction: prevents concurrent PUTs producing two open versions | _pending_ |
| R3 | New migration `1751200000000-AddSalaryStructureOpenVersionIndex`: partial unique index on `(employee_id) WHERE effective_to IS NULL` as DB-level backstop | _pending_ |
| R4 | `assertEmployeeExists` moved inside transaction in `upsert`: eliminates TOCTOU window between existence check and FK-constrained INSERT | _pending_ |
| R5 | `null as unknown as string` → `IsNull()` from typeorm in both `findOne` queries | _pending_ |
| R6 | `COMPONENT_KINDS` in DTO replaced with import of `COMPONENT_KIND_VALUES` from entity: single source of truth | _pending_ |
| R7 | Unused `ConflictException` import and stale RED-phase comment removed from spec file | _pending_ |
| R8 | `upsert` returns `{ structure, created }` discriminant; controller uses `@Res({ passthrough: true })` to send 201 on first create, 200 on supersede | _pending_ |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
