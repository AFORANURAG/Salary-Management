# Spec: Salary Structure

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/salary`.

## Objective

Hold each employee's salary composition — **basic, allowances, deductions** — as **effective-dated, versioned** records so that updating a structure never overwrites historical truth. This is what makes past payroll reconstructable.

## Data Model

`SalaryStructure` (one version per effective period)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `employeeId` | uuid (FK → Employee) | indexed |
| `effectiveFrom` | date | start of validity |
| `effectiveTo` | date \| null | null = currently active; closed when superseded |
| `currency` | string (ISO-4217) | matches employee currency |
| `createdAt` | timestamptz | |

`SalaryComponent` (line items belonging to a structure version)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `structureId` | uuid (FK → SalaryStructure) | indexed |
| `code` | string | `SCREAMING_SNAKE`, e.g. `BASIC`, `HRA`, `PF` |
| `kind` | enum: `EARNING` \| `DEDUCTION` | |
| `amountMinor` | integer | minor units; never float |

## Key Rules

- **One active structure per employee per pay period** (requirements §7). At most one row with `effectiveTo = null` per employee.
- Updating a structure = **close the current version** (`effectiveTo = day before new effectiveFrom`) + **insert a new version**. Never mutate component amounts of an existing version.
- `effectiveFrom` of a new version must be > `effectiveFrom` of the version it supersedes; no overlapping ranges.
- The structure active for a given period is resolved by `effectiveFrom <= periodStart AND (effectiveTo IS NULL OR effectiveTo >= periodStart)`.

## API Surface

```
GET    /employees/:id/salary-structure            → current active structure
GET    /employees/:id/salary-structure/history    → all versions
PUT    /employees/:id/salary-structure            → supersede + create new version
```

## Non-Negotiable Test Cases

- Updating a structure closes the prior version and creates a new one; the prior version's components are byte-for-byte unchanged.
- Resolving the active structure for a historical date returns the version that was effective then, not the latest.
- No two versions for the same employee have overlapping `[effectiveFrom, effectiveTo]` ranges.

## Success Criteria

- [ ] Effective-dated resolution returns the correct version for any given date.
- [ ] History endpoint lists all versions in chronological order.
- [ ] Invariant enforced: at most one open (`effectiveTo = null`) version per employee.

## Open Questions

- Are component `code`s free-form per employee, or drawn from a controlled catalog?
