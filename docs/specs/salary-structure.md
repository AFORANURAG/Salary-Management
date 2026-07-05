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

- [x] Effective-dated resolution returns the correct version for any given date.
- [x] History endpoint lists all versions in chronological order.
- [x] Invariant enforced: at most one open (`effectiveTo = null`) version per employee.

## Frontend

Pages and components in `apps/web`. Client data layer via `@salary-mgmt/store`
(TanStack Query + typed API client). UI primitives from `@salary-mgmt/ui`.

### Pages / Routes

| Route | Change |
|---|---|
| `/employees/[id]` | Extend existing detail page: add salary structure section (active version + components table + history) |

No new top-level routes. Salary structure lives on the employee detail page.

### Components

| Component | Description |
|---|---|
| `SalaryStructureCard` | Shows the active structure: `effectiveFrom`, `currency`, and a table of components (code, kind, amount). Loading skeleton and empty state (no structure yet). |
| `SalaryStructureHistory` | Collapsible list of all past versions in chronological order. Each row shows `effectiveFrom`, `effectiveTo`, and component summary. |
| `UpsertSalaryStructureDialog` | Form: `effectiveFrom` (date), `currency` (ISO-4217 select), dynamic component list (add/remove rows with `code`, `kind`, `amountMinor`). Client-side zod validation. Opens from "Set Salary Structure" button on detail page. |

### Data Layer (hooks in `@salary-mgmt/store`)

| Hook | Used by |
|---|---|
| `useSalaryStructure(employeeId: string)` | `SalaryStructureCard` — fetches active structure |
| `useSalaryStructureHistory(employeeId: string)` | `SalaryStructureHistory` — fetches all versions |
| `useUpsertSalaryStructure()` | `UpsertSalaryStructureDialog` — PUT mutation; invalidates both query keys on success |

### Non-Negotiable Frontend Test Cases

**Unit / component (mocked hooks, jsdom)**
- `SalaryStructureCard` renders `effectiveFrom`, `currency`, and one row per component.
- `SalaryStructureCard` renders loading skeleton while `isLoading` is true.
- `SalaryStructureCard` renders empty state when no active structure exists (404 from hook).
- `SalaryStructureHistory` renders each past version with `effectiveFrom` and `effectiveTo`.
- `UpsertSalaryStructureDialog` — submitting a valid form calls `useUpsertSalaryStructure` mutation.
- `UpsertSalaryStructureDialog` — submitting with missing required fields shows validation errors without calling the API.
- `UpsertSalaryStructureDialog` — adding a component row and removing it works correctly.

**Integration (real hooks + MSW, jsdom)**
- Employee detail page renders `SalaryStructureCard` with data fetched via real `useSalaryStructure` hook + MSW `GET /v1/employees/:id/salary-structure`.
- Submitting `UpsertSalaryStructureDialog` hits `PUT /v1/employees/:id/salary-structure` via MSW; card re-fetches and shows updated structure.

**E2E (Playwright, full stack)**
- Employee detail page shows active salary structure components.
- Clicking "Set Salary Structure", submitting valid data, causes the card to update.
- History section shows previously set versions after an update.

### Frontend Success Criteria

- [x] Employee detail page shows the active salary structure or a clear empty state.
- [x] Upsert dialog validates client-side and surfaces 409 conflicts as field errors.
- [x] History collapses cleanly; each version's effective date range is readable.
- [x] All non-negotiable frontend test cases pass (unit + integration + E2E).
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Open Questions

- ~~Are component `code`s free-form per employee, or drawn from a controlled catalog?~~ **Resolved:** free-form `SCREAMING_SNAKE` string. No catalog table for MVP.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| Types, entities, migration, test harness update | `feat/salary-structure-pr1-db-models` |
| RED — unit + integration specs | `feat/salary-structure-pr2-test-harness` |
| GREEN — DTOs, service, controller, module | `feat/salary-structure-pr3-implementation` |

### Frontend

| Phase | Branch |
|---|---|
| Store API fns + hooks + RED component specs | `feat/salary-structure-fe-pr1-hooks-red` |
| GREEN — components + detail page wiring | `feat/salary-structure-fe-pr2-components` |
| Integration + E2E tests | `feat/salary-structure-fe-pr3-tests` |

Plan: [`docs/plans/salary-structure.md`](../plans/salary-structure.md) · Trace: [`traces/salary-structure.md`](../../traces/salary-structure.md)
