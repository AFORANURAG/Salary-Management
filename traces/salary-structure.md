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
| R1 | `@IsDateString()` → `@Matches(/^\d{4}-\d{2}-\d{2}$/)`: rejects datetime strings that caused `closeVersion` to crash and overlap guard to be bypassed | f1b37fd |
| R2 | Pessimistic write lock on `findOne` for open version inside `upsert` transaction: prevents concurrent PUTs producing two open versions | f1b37fd |
| R3 | New migration `1751200000000-AddSalaryStructureOpenVersionIndex`: partial unique index on `(employee_id) WHERE effective_to IS NULL` as DB-level backstop | f1b37fd |
| R4 | `assertEmployeeExists` moved inside transaction in `upsert`: eliminates TOCTOU window between existence check and FK-constrained INSERT | f1b37fd |
| R5 | `null as unknown as string` → `IsNull()` from typeorm in both `findOne` queries | f1b37fd |
| R6 | `COMPONENT_KINDS` in DTO replaced with import of `COMPONENT_KIND_VALUES` from entity: single source of truth | f1b37fd |
| R7 | Unused `ConflictException` import and stale RED-phase comment removed from spec file | f1b37fd |
| R8 | `upsert` returns `{ structure, created }` discriminant; controller uses `@Res({ passthrough: true })` to send 201 on first create, 200 on supersede | f1b37fd |

### Phase 4 — Frontend: store hooks + RED specs

| Task | Description | Commit | Verification |
|---|---|---|---|
| SF1 | `getSalaryStructure`, `getSalaryStructureHistory`, `upsertSalaryStructure` API fns in `@salary-mgmt/store/src/api/salary-structure.ts` | 7bff673 | store typecheck clean |
| SF2 | `useSalaryStructure`, `useSalaryStructureHistory`, `useUpsertSalaryStructure` hooks; `salaryStructure` key family added to `queryKeys`; exported from store index | 7bff673 | store typecheck clean |
| SF3 | RED specs: `salary-structure-card.test.tsx` (3 specs), `salary-structure-history.test.tsx` (1 spec), `upsert-salary-structure-dialog.test.tsx` (3 specs) — all fail with missing component import | 7bff673 | RED confirmed — 3 files fail for right reason |

### Phase 5 — Frontend: components + page wiring

| Task | Description | Commit | Verification |
|---|---|---|---|
| SF4 | `SalaryStructureCard` — loading skeleton (`data-slot="skeleton"`), empty state, data table with Badge+formatMinor | 1486027 | 34/34 web tests green |
| SF5 | `SalaryStructureHistory` — collapsible version list (default expanded); effectiveFrom / effectiveTo / components per version | 1486027 | 34/34 web tests green |
| SF6 | `UpsertSalaryStructureDialog` — react-hook-form + zod + zodResolver; useFieldArray for dynamic component rows; 409 → field error; `valueAsNumber: true` on amount input | 1486027 | 34/34 web tests green |
| SF7 | `apps/web/app/employees/[id]/page.tsx` wired with salary structure section; `@salary-mgmt/money` added to web deps + transpilePackages | 1486027 | typecheck clean |

### Phase 6 — Frontend: integration + E2E tests

| Task | Description | Commit | Verification |
|---|---|---|---|
| SF8 | MSW handlers `GET /salary-structure`, `GET /salary-structure/history`, `PUT /salary-structure` in `test/msw/handlers/salary-structure.ts`; wired into server | TBD | 36/36 web tests green |
| SF9 | Integration tests: detail page renders card via real hook + MSW; upsert dialog PUTs and card re-fetches | TBD | 36/36 web tests green |
| SF10 | E2E tests (Playwright): SF10a detail page shows structure, SF10b upsert updates card, SF10c history shows prior versions | TBD | requires full stack |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
