# Implementation Plan: Employees — Frontend

> Source spec: [`../specs/employees.md`](../specs/employees.md) (§ Frontend) · Trace log: [`../../traces/employees.md`](../../traces/employees.md)

## Overview

Employee list, detail, and CRUD dialogs for `apps/web`. Client data via
TanStack Query hooks in `@salary-mgmt/store`; UI primitives in `@salary-mgmt/ui`
(Table + Select need to be added). Four stacked branches — one per phase.

Built **test-first**: RED suite authored before any page/component implementation
(per CLAUDE.md lifecycle).

## Architecture Decisions

- TanStack Query hooks live in `@salary-mgmt/store` — co-located with the API
  client and query keys; `apps/web` imports hooks, not raw `fetch`.
- Table + Select are shadcn/ui primitives added to `@salary-mgmt/ui`; no new
  external dependencies required.
- List page is a Next.js Client Component (`"use client"`) — search/filter state
  lives in URL search params for shareability and browser-back support.
- All form validation is client-side with `react-hook-form` + `zod`; server
  errors (409 conflict, 400 validation) surface as field-level messages.
  See [ADR-0006](../decisions/ADR-0006-react-hook-form-zod-fe-forms.md).
- List filter/search/pagination/sort state lives in URL search params (`useSearchParams`
  + `router.replace`). See [ADR-0007](../decisions/ADR-0007-url-search-params-employee-filters.md).
- No new runtime dependencies beyond what's already installed unless listed
  explicitly in a task and confirmed by the user (per CLAUDE.md ask-first).

## Ask-first boundaries in this plan

- ~~Adding `react-hook-form` and `zod` to `apps/web`~~ **Resolved:** confirmed by user; see [ADR-0006](../decisions/ADR-0006-react-hook-form-zod-fe-forms.md).
- ~~List state in URL search params vs local state~~ **Resolved:** URL search params confirmed; see [ADR-0007](../decisions/ADR-0007-url-search-params-employee-filters.md).
- Any change to `packages/types` contracts.

## Task List

### Phase 1 — Foundation

Branch: `feat/employees-fe-pr1-foundation`

| Task | Description | Commit |
|---|---|---|
| EF1 | Add `Table` and `Select` shadcn/ui components to `@salary-mgmt/ui` | `feat(ui): add Table and Select components` |
| EF2 | Add employee API functions to `@salary-mgmt/store/src/api/employees.ts` (`listEmployees`, `getEmployee`, `createEmployee`, `updateEmployee`, `deleteEmployee`) | `feat(store): add employee API functions` |
| EF3 | Add Vitest + Testing Library config to `apps/web` (vitest.config, test setup, render helper with Providers) | `test(web): add vitest and testing-library config` |

**EF1 acceptance**
- [ ] `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` exported from `@salary-mgmt/ui`.
- [ ] `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` exported from `@salary-mgmt/ui`.
- [ ] Verification: `pnpm --filter @salary-mgmt/ui typecheck`.

**EF2 acceptance**
- [ ] All five API functions typed against `@salary-mgmt/types` contracts; `EmployeeListQuery` serialised to query string correctly.
- [ ] Re-exported from `@salary-mgmt/store` index.
- [ ] Verification: `pnpm --filter @salary-mgmt/store typecheck`.

**EF3 acceptance**
- [ ] A trivial render test (`renders without crashing`) passes.
- [ ] `jsdom` environment, `@testing-library/jest-dom` matchers available.
- [ ] Verification: `pnpm --filter web test`.

### Checkpoint: Foundation
- [ ] `pnpm typecheck && pnpm lint` clean across workspace.
- [ ] Trivial web test green.

---

### Phase 2 — RED (failing test suite, before any page implementation)

Branch: `feat/employees-fe-pr2-red`

All tests in this phase must **fail for the right reason** (missing components /
hooks, not harness errors). Commit as RED; do not implement until Phase 3.

**EF4 — Hook tests** (unit; `packages/store/src/__tests__/employees.test.ts`)
Commit: `test(store): add failing employee hook specs`

- [ ] `useEmployees` — called with a query, issues a `GET /v1/employees?…` request; returns `PaginatedResponse<Employee>`.
- [ ] `useEmployee` — called with an id, issues `GET /v1/employees/:id`; returns `Employee`.
- [ ] `useCreateEmployee` — mutation posts to `POST /v1/employees`, invalidates `employees.lists()` key on success.
- [ ] `useUpdateEmployee` — mutation patches `PATCH /v1/employees/:id`, invalidates `employees.lists()` and `employees.detail(id)` on success.
- [ ] `useDeleteEmployee` — mutation deletes `DELETE /v1/employees/:id`, invalidates `employees.lists()` on success.

**EF5 — Component tests** (medium; `apps/web/app/employees/__tests__/`)
Commit: `test(web): add failing employee component specs`

- [ ] `EmployeeList` renders column headings: Name, Code, Email, Department, Country, Status, Joining Date.
- [ ] `EmployeeList` renders one row per employee in mock data.
- [ ] `EmployeeList` renders loading skeleton while `isLoading` is true.
- [ ] `EmployeeList` renders empty-state message when `data.total === 0`.
- [ ] `EmployeeList` renders error message when query is in error state.
- [ ] `EmployeeSearch` debounces input — value is not propagated on every keystroke.
- [ ] `EmployeeFilters` — selecting a department filter calls `onFilterChange` with the correct value.
- [ ] `EmployeeFilters` — selecting a status filter calls `onFilterChange` with the correct value.
- [ ] `EmployeePagination` — clicking Next calls `onPageChange(currentPage + 1)`.
- [ ] `EmployeePagination` — clicking Previous calls `onPageChange(currentPage - 1)`.
- [ ] `EmployeePagination` — Previous is disabled on page 1.
- [ ] `EmployeePagination` — Next is disabled on the last page.
- [ ] `CreateEmployeeDialog` — submitting valid form calls `createEmployee` mutation.
- [ ] `CreateEmployeeDialog` — submitting with empty required fields shows validation errors without calling the API.
- [ ] `EditEmployeeDialog` — all fields pre-populated from the passed employee record.
- [ ] `DeleteEmployeeDialog` — clicking Cancel closes the dialog without calling the API.
- [ ] `DeleteEmployeeDialog` — clicking Confirm calls `deleteEmployee` mutation.

### Checkpoint: RED confirmed
- [ ] EF4 + EF5 run and fail for the right reason (no components/hooks yet).
- [ ] Go/no-go gate before any implementation.

---

### Phase 3 — GREEN: store hooks + list + detail pages

Branch: `feat/employees-fe-pr3-list`

| Task | Description | Commit |
|---|---|---|
| EF6 | TanStack Query hooks: `useEmployees`, `useEmployee` in `@salary-mgmt/store` | `feat(store): add employee list and detail hooks` |
| EF7 | Mutation hooks: `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee` in `@salary-mgmt/store` | `feat(store): add employee mutation hooks` |
| EF8 | `EmployeeSearch`, `EmployeeFilters`, `EmployeePagination` components in `apps/web/app/employees/` | `feat(web): add employee search filter pagination components` |
| EF9 | `EmployeeList` table component (columns, loading skeleton, empty state, error state) | `feat(web): add employee list table component` |
| EF10 | `/employees` page — wires URL search params → query → list + search + filters + pagination | `feat(web): add employees list page` |
| EF11 | `/employees/[id]` detail page — fetch one employee, display all fields read-only | `feat(web): add employee detail page` |

**EF6–EF11 acceptance**
- [ ] All EF4 hook tests green.
- [ ] All EF5 component tests for list/search/filters/pagination green.
- [ ] Verification: `pnpm --filter @salary-mgmt/store typecheck && pnpm --filter web typecheck && pnpm --filter web test`.

### Checkpoint: List + detail green
- [ ] List page interactive end-to-end against running API.
- [ ] Detail page loads employee by id.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 4 — GREEN: create/edit/delete dialogs

Branch: `feat/employees-fe-pr4-forms`

| Task | Description | Commit |
|---|---|---|
| EF12 | `EmployeeForm` — shared form component using `react-hook-form` + `zod` schema mirroring `CreateEmployeeInput` ([ADR-0006](../decisions/ADR-0006-react-hook-form-zod-fe-forms.md)) | `feat(web): add employee form component` |
| EF13 | `CreateEmployeeDialog` — wraps `EmployeeForm`; on submit calls `useCreateEmployee`, closes on success, surfaces 409/400 errors as field messages | `feat(web): add create employee dialog` |
| EF14 | `EditEmployeeDialog` — wraps `EmployeeForm` pre-populated from employee prop; on submit calls `useUpdateEmployee` | `feat(web): add edit employee dialog` |
| EF15 | `DeleteEmployeeDialog` — confirmation dialog; on confirm calls `useDeleteEmployee`, closes, list re-fetches | `feat(web): add delete employee dialog` |
| EF16 | Wire dialogs into `/employees` page — Create button, row action menu (Edit, Delete) | `feat(web): wire employee dialogs into list page` |

**EF12–EF16 acceptance**
- [ ] All EF5 dialog tests (create/edit/delete) green.
- [ ] 409 conflict from API surfaces as field-level error on employeeCode / email.
- [ ] Verification: `pnpm --filter web typecheck && pnpm --filter web test`.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Frontend Test Cases pass.
- [ ] `/employees` list page: search, filter, sort, paginate, create, edit, delete all work end-to-end.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| URL search-param state causes hydration mismatch | Med | Use `useSearchParams` only inside `"use client"` boundary; no SSR for the list |
| `react-hook-form` / `zod` not yet installed | Med | Ask-first (EF12); confirm before adding |
| TQ cache invalidation misses after mutation | Med | Invalidate both `lists()` and the specific `detail(id)` key |
| Filter select produces URL arrays — serialisation edge cases | Med | Encode arrays as repeated params (`?status=ACTIVE&status=INACTIVE`); test round-trip |
| Test isolation — `msw` vs real fetch mocking | Med | Use `msw` for hook tests (real fetch, intercepted network); Testing Library for component tests with mocked hooks |

## Open Questions

- ~~Confirm adding `react-hook-form` + `zod` to `apps/web`?~~ **Resolved:** confirmed; [ADR-0006](../decisions/ADR-0006-react-hook-form-zod-fe-forms.md).
- ~~URL search params vs local React state for list filter/search?~~ **Resolved:** URL search params; [ADR-0007](../decisions/ADR-0007-url-search-params-employee-filters.md).
