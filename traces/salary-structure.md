# Trace: Salary Structure

> Spec: [`docs/specs/salary-structure.md`](../docs/specs/salary-structure.md) · Plan: [`docs/plans/salary-structure.md`](../docs/plans/salary-structure.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS1 | `SalaryStructure`, `SalaryComponent`, `ComponentKind`, `UpsertSalaryStructureInput`, `ComponentInput` added to `@salary-mgmt/types` | _this commit_ | types build + typecheck pass |
| SS2 | `SalaryStructureEntity` + `SalaryComponentEntity` + migration (tables, FKs, indexes) | _this commit_ | `migration:run` applied both tables, enum, 2 indexes, 2 FKs |
| SS3 | `TestDataSource` entities extended; `truncateAll` covers all 3 tables in FK order; `buildSalaryStructureInput` fixture factory added; global-setup updated with new migration | _this commit_ | 53 existing tests still green |

### Phase 2 — RED

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS4 | Unit specs (effectiveTo calc, overlap guard, date resolution) | _pending_ | |
| SS5 | Integration specs (PUT, GET current, GET history, invariant) | _pending_ | |

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| SS6 | DTOs | _pending_ | |
| SS7 | Service | _pending_ | |
| SS8 | Controller + Module | _pending_ | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Effective-dated resolution returns correct version for any date | _pending_ | |
| History endpoint lists all versions in chronological order | _pending_ | |
| At most one open (`effectiveTo = null`) version per employee | _pending_ | |
| Prior version components byte-for-byte unchanged after supersede | _pending_ | |
| No overlapping `[effectiveFrom, effectiveTo]` ranges | _pending_ | |

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
