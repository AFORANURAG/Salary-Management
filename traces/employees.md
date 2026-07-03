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
| ET9 | Seed ~10k employees (dependency — ask-first) | _pending_ | |
| ET10 | Refactor + enable ET5b + perf check | _pending_ | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Search by partial name/code/email — correct, stable, paginated over 10k | _pending_ | |
| Combined filters (department + country + status) compose with search | _pending_ | |
| Soft-delete preserves payroll/payslip references | _pending_ | |
| List p95 < 300ms locally over 10k on indexed queries | _pending_ | |
| Pagination returns correct `total` and stable ordering across pages | _pending_ | |
| CRUD enforces uniqueness on `employeeCode` and `email` | _pending_ | |

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

## Learnings

_To be distilled into `.ai/rules/` after the module closes out._
