# Trace: Employees

> Spec: [`docs/specs/employees.md`](../docs/specs/employees.md) · Plan: [`docs/plans/employees.md`](../docs/plans/employees.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET1 | Shared employee contracts in `packages/types` | `8e1df56` | types build + typecheck pass |
| ET2 | Employee entity + first migration (schema — approved) | `8e1df56` | `migration:run` applied table, enum, 6 indexes, unique constraints |
| ET3 | Integration test harness (Vitest + SWC + `@nestjs/testing`, auto-created `salary_mgmt_test`, per-test truncation) | `d254b9a` | harness smoke test green |

### Phase 2 — RED (failing test suite)

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET4 | Unit specs (DTO validation, list-query parsing) | `d254b9a` | authored RED |
| ET5 | Integration specs (CRUD + list) | `d254b9a` | authored RED |
| ET5b | Scale/perf specs (enabled after ET9) | `d254b9a` | authored, `describe.skip` |

**RED checkpoint:** reached — suite fails for the right reason (routes 404, parser throws, DTOs undecorated).

### Phase 3 — GREEN

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET6 | Create + fetch one | `9abdb78` | create/fetch specs green |
| ET7 | Update + soft delete | `9abdb78` | update/soft-delete specs green |
| ET8 | List (search/filter/paginate/sort) | `9abdb78` | list specs green |

**GREEN checkpoint:** 48 passed / 3 skipped; root `pnpm typecheck && pnpm lint && pnpm test` all green.

### Phase 4 — Data + refactor

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET9 | Faker-based seed: 10k employees across all departments/countries/currencies; idempotent (skips if ≥10k exist) | _this commit_ | `pnpm --filter api seed` inserts 10k rows in chunks of 500 |
| ET10 | Enable ET5b scale spec; fix `persistEmployees` chunked-insert (Postgres param limit); single-test structure to survive global beforeEach truncation; p95 < 300ms verified | _this commit_ | scale spec green; p95 ~2ms locally |

---

## Backend — Phase 5: Department enum

Branch: `feat/employees-pr5-department-enum`

### Phase 5 — Department enum + FE hardening

| Task | Description | Commit | Verification |
|---|---|---|---|
| ET11 | Resolved Open Question: `department` enum (`Engineering\|Sales\|Finance\|HR\|Operations`) in `@salary-mgmt/types`; `@IsIn` on Create/Update DTOs; entity typed `Department`; FE zod schema → `z.enum`, form Input → Select, filters use shared constant; 2 new BE unit tests + 2 integration tests; spec + plan updated | _this commit_ | 52 API tests + 27 web unit/integration tests green; typecheck + lint clean |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Search by partial name/code/email — correct, stable, paginated over 10k | PASS | scale spec (ET10) |
| Combined filters (department + country + status) compose with search | PASS | scale spec (ET10) |
| Soft-delete preserves payroll/payslip references | PASS | crud spec (ET7) |
| List p95 < 300ms locally over 10k on indexed queries | PASS | ~2ms p95 locally |
| Pagination returns correct `total` and stable ordering across pages | PASS | list spec (ET8) |
| CRUD enforces uniqueness on `employeeCode` and `email` | PASS | crud spec (ET6/ET7) |

---

## Frontend — Phase 1: Foundation

Branch: `feat/employees-fe-pr1-foundation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF1 | `Table` + `Select` shadcn/ui components added to `@salary-mgmt/ui` | `f3a33df` | `pnpm --filter @salary-mgmt/ui typecheck` clean |
| EF2 | Employee API functions (`listEmployees`, `getEmployee`, `createEmployee`, `updateEmployee`, `deleteEmployee`) added to `@salary-mgmt/store` | `9792d94` | `pnpm --filter @salary-mgmt/store typecheck` clean |
| EF3 | Vitest + Testing Library config in `apps/web`; trivial render test green | `9792d94` | `pnpm --filter web test` green |

**Checkpoint:** `pnpm typecheck && pnpm lint` clean; trivial web test green.

---

## Frontend — Phase 2: RED

Branch: `feat/employees-fe-pr2-red`

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF4 | Hook specs (`useEmployees`, `useEmployee`, `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee`) — RED | `309d6ab` | All 5 specs fail for right reason (missing hooks) |
| EF5 | Component specs — `EmployeeList`, `EmployeeSearch`, `EmployeeFilters`, `EmployeePagination`, dialogs — RED | `0a512c8` | All 17 specs fail for right reason (missing components) |

**RED checkpoint:** reached — suite fails for the right reason.

---

## Frontend — Phase 3: GREEN (store hooks + list + detail)

Branch: `feat/employees-fe-pr3-list`

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF6 | `useEmployees`, `useEmployee` TanStack Query hooks in `@salary-mgmt/store` | `e89703e` | EF4 hook tests for list/detail green |
| EF7 | `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee` mutation hooks | `e89703e` | EF4 mutation hook tests green |
| EF8 | `EmployeeSearch`, `EmployeeFilters`, `EmployeePagination` components | `0a5a294` | EF5 search/filter/pagination tests green |
| EF9 | `EmployeeList` table component (columns, loading skeleton, empty state, error state) | `0a5a294` | EF5 list tests green |
| EF10 | `/employees` page — URL search params → query → list + search + filters + pagination | `47204d6` | list page renders and interactive |
| EF11 | `/employees/[id]` detail page — fetch one employee, display all fields read-only | `47204d6` | detail page loads employee by id |

**Checkpoint:** all EF4 + EF5 list/search/filter/pagination tests green; `pnpm typecheck && pnpm lint && pnpm test` green.

---

## Frontend — Phase 4: GREEN (create/edit/delete dialogs)

Branch: `feat/employees-fe-pr4-forms`

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF12 | `EmployeeForm` — `react-hook-form` + `zod` schema | `9e0f02b` | form renders and validates |
| EF13 | `CreateEmployeeDialog` — calls `useCreateEmployee`; surfaces 409/400 errors as field messages | `427121d` | EF5 create dialog tests green |
| EF14 | `EditEmployeeDialog` — pre-populated from employee prop; calls `useUpdateEmployee` | `427121d` | EF5 edit dialog tests green |
| EF15 | `DeleteEmployeeDialog` — confirmation; calls `useDeleteEmployee` on confirm | `427121d` | EF5 delete dialog tests green |
| EF16 | Wire dialogs into `/employees` page — Create button, row action menu (Edit, Delete) | `21b788d` | full list page interactive end-to-end |

**Checkpoint:** all EF5 dialog tests green; `/employees` CRUD flows end-to-end; `pnpm typecheck && pnpm lint && pnpm test` green.

---

## Frontend — Phase 5: Integration tests (MSW + real hooks)

Branch: `feat/employees-fe-pr5-integration`

### Phase 5 — Integration tests

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF17 | Install `msw` v2; add server + employee handler fixtures; custom jsdom-patched vitest environment | _this commit_ | server, handlers, environment in place |
| EF18 | Integration: list page renders rows via real `useEmployees` + MSW | _this commit_ | `list-page.integration.test.tsx` green |
| EF19 | Integration: search triggers re-query with `q` param after debounce | _this commit_ | `search.integration.test.tsx` green |
| EF20 | Integration: department filter triggers re-query with `department` param | _this commit_ | `filter.integration.test.tsx` green |
| EF21 | Integration: Create dialog — POST intercepted; list re-fetches on success | _this commit_ | `create-dialog.integration.test.tsx` green |
| EF22 | Integration: Edit dialog — PATCH intercepted; list re-fetches on success | _this commit_ | `edit-dialog.integration.test.tsx` green |
| EF23 | Integration: Delete dialog — DELETE intercepted; list re-fetches on success | _this commit_ | `delete-dialog.integration.test.tsx` green |
| EF24 | Integration: 5xx from MSW causes error state on list page | _this commit_ | `error-state.integration.test.tsx` green |
| — | Fix: wrap `useSearchParams` in `<Suspense>` for Next.js 14 production build | _this commit_ | `docker compose up --build` succeeds |

**Integration checkpoint:** 31 passed (19 test files); `pnpm typecheck && pnpm lint && pnpm --filter web test` all green.

Key learnings from this phase:
- jsdom's `AbortController` replaces the native one, breaking MSW's `fetchProxy` (`instanceof AbortSignal` check). Fix: custom vitest environment that restores native `AbortController`/`AbortSignal` after jsdom setup.
- `isolate: false` causes `vi.mock()` leaks across test files — removed.
- `useSearchParams` must be inside `<Suspense>` for Next.js 14 production static generation; dev mode is lenient, build is not.

---

## Frontend — Phase 6: E2E tests (Playwright, full stack)

Branch: `feat/employees-fe-pr6-e2e`

| Task | Description | Commit | Verification |
|---|---|---|---|
| EF25 | `@playwright/test` installed; `playwright.config.ts` at repo root | `7b173cd` | `npx playwright test` runs from repo root |
| EF26 | E2E: list page loads; rows visible; column headings present | `7b173cd` | green |
| EF27 | E2E: search by partial name filters displayed rows | `7b173cd` | green |
| EF28 | E2E: department filter narrows the list | `7b173cd` | green |
| EF29 | E2E: next-page navigation shows a different result set | `7b173cd` | green |
| EF30 | E2E: create employee via dialog — new row appears in list | `7b173cd` | green |
| EF31 | E2E: edit employee via dialog — updated row visible in list | `7b173cd` | green |
| EF32 | E2E: delete (soft) employee via dialog — row removed from list | `7b173cd` | green |
| — | Fix: 5 E2E failures resolved (locators, timing, data isolation) | `82748f5` | 7/7 E2E passing |

**E2E checkpoint:** 7/7 E2E specs pass against full Docker stack; all non-negotiable frontend test cases pass (unit + integration + E2E).

## Spec closeout — Frontend

| Criterion | Result | Notes |
|---|---|---|
| `/employees` interactive: search, filter, sort, paginate end-to-end | PASS | phases 3–4 |
| All non-negotiable frontend test cases pass (unit + integration + E2E) | PASS | 31 unit/integration + 7 E2E |
| `pnpm typecheck && pnpm lint && pnpm test` green from repo root | PASS | verified across all phases |
| Playwright E2E suite passes against running Docker stack | PASS | 7/7 (EF32, commit `82748f5`) |

## Learnings

- jsdom replaces native `AbortController`; MSW v2 `fetchProxy` checks `instanceof AbortSignal` — fails silently. Fix: custom vitest environment restoring native globals after jsdom setup.
- `useSearchParams` requires a `<Suspense>` boundary in Next.js 14 App Router; dev mode is lenient but production build fails without it.
- `isolate: false` in vitest config causes `vi.mock()` state to leak across test files — keep default isolation.
- E2E tests must create and tear down their own data; shared DB state causes ordering flakiness across test runs.
