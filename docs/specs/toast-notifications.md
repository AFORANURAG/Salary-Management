# Spec: Toast Notifications

> Domain spec under [`../spec.md`](../spec.md). Cross-cutting concern — touches
> `packages/store`, `packages/ui`, `apps/web`.
> Depends on [`app-shell.md`](./app-shell.md) — requires `AuthenticatedLayout`
> to mount the `<Toaster />`.

## Objective

Surface backend errors and mutation outcomes as Sonner toast notifications so
users receive immediate, actionable feedback on every write operation. Currently,
API errors are silently swallowed — a 409 Conflict on "Create Employee" shows
nothing in the UI despite a clear backend message (`"employeeCode or email already
exists"`). This spec fixes that gap globally, without per-mutation boilerplate.

## Scope

- Replace shadcn `@radix-ui/react-toast` / `useToast` with **Sonner** across the
  entire frontend (web app + `packages/ui`).
- Wire a **global query error handler** (`QueryCache`) so every failed GET/query
  also shows a red error toast.
- Wire a **global mutation error handler** (`MutationCache`) so every failed
  mutation shows a red error toast.
- Wire a **global mutation success handler** that reads a `meta.successMessage`
  string from the mutation config to show a green success toast — opt-in, no
  required default.
- Allow per-query/per-mutation override/suppression via `meta` flags.
- Migrate all existing `useToast` call sites to the new primitive.

## Toast Taxonomy

| Situation | Variant | Trigger |
|---|---|---|
| `ApiError` thrown by any query (GET) | `error` (red) | `QueryCache` global `onError` |
| `ApiError` thrown by any mutation | `error` (red) | `MutationCache` global `onError` |
| Mutation completes and `meta.successMessage` is set | `success` (green) | `MutationCache` global `onSuccess` |
| Network timeout / abort | `error` (red) | same global handlers (status 0 or 408) |
| `meta.suppressErrorToast: true` (query or mutation) | silent | skip in respective `onError` |
| Explicit in-component call (e.g. import wizard steps) | any | `toast.*()` direct call |

## API / Contracts

### `meta` on queries and mutations

Extend TanStack Query's `QueryMeta` and `MutationMeta` types (module augmentation
in `packages/store`) to add:

```ts
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      suppressErrorToast?: boolean;
    };
    mutationMeta: {
      successMessage?: string;
      suppressErrorToast?: boolean;
    };
  }
}
```

`suppressErrorToast: true` on a query suppresses the global `QueryCache` error
handler for that specific query. Use it for background polling or non-critical
data where failures should be silent (e.g. notification badge count).

### `toast` utility

Export a thin re-export of `sonner`'s `toast` from `packages/ui` so consumers
never import `sonner` directly:

```ts
// packages/ui/src/toast.ts
export { toast } from "sonner";
export type { ToastT } from "sonner";
```

### `<Toaster />` placement

Mount once in `apps/web/app/(authenticated)/layout.tsx` (the
`AuthenticatedLayout`) and once in `apps/web/app/(auth)/layout.tsx` (the auth
shell, to cover login errors). Position: `bottom-right`. Theme: `system` (respects
OS dark/light mode).

### Global handlers in `createQueryClient`

TanStack Query v5 exposes `QueryCache` and `MutationCache` constructors that
accept `onError` / `onSuccess` callbacks — these are the correct v5 hooks for
global side-effects (not `defaultOptions.queries.onError`, which was removed in
v5).

```ts
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "@salary-mgmt/ui/toast";
import { ApiError } from "../api/client";
import { CORE_ERROR_MESSAGES } from "@salary-mgmt/errors";

function toastMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return CORE_ERROR_MESSAGES.NETWORK_ERROR;
}

export function createQueryClient(overrides?: QueryOverrides): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (query.meta?.suppressErrorToast) return;
        toast.error(toastMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _vars, _ctx, mutation) {
        if (mutation.meta?.suppressErrorToast) return;
        toast.error(toastMessage(error));
      },
      onSuccess(_data, _vars, _ctx, mutation) {
        const msg = mutation.meta?.successMessage;
        if (msg) toast.success(msg);
      },
    }),
    defaultOptions: { /* existing options unchanged */ },
  });
}
```

> Using `QueryCache` / `MutationCache` is the v5-idiomatic pattern. The
> `defaultOptions.mutations.onError` callback was removed in v5.

## Success Messages (per mutation)

Add `meta.successMessage` to each mutation in `packages/store/src/query/`:

| Mutation | Message |
|---|---|
| `useCreateEmployee` | `"Employee created"` |
| `useUpdateEmployee` | `"Employee updated"` |
| `useDeleteEmployee` | `"Employee deleted"` |
| `useBulkStatusChange` | `"Status updated"` |
| `useEmployeeImport` | (suppress — wizard handles its own feedback) |
| Payroll mutations | `"Payroll run started"` / `"Payroll voided"` |
| Salary structure mutations | `"Salary structure saved"` |
| Auth mutations (login/logout) | (suppress — redirects handle feedback) |

## Migration of Existing Call Sites

Files currently using `useToast` / `toast`:

| File | Action |
|---|---|
| `apps/web/app/(authenticated)/employees/components/bulk-action-toolbar.tsx` | Remove `useToast`; rely on global handler (mutation already in store) |
| `apps/web/app/(authenticated)/payroll/components/void-confirm-modal.tsx` | Remove `useToast`; add `meta.successMessage` to the void mutation in store |
| Any other `useToast` import found during implementation | Migrate to `toast.*()` from `@salary-mgmt/ui/toast` |

Remove `@salary-mgmt/ui/toast`, `@salary-mgmt/ui/toaster`, and
`@salary-mgmt/ui/use-toast` exports from `packages/ui/package.json` after
migration. Keep the underlying shadcn files only if they are still needed
elsewhere; otherwise delete them.

## Non-Negotiable Test Cases

**Unit**
- `MutationCache.onError` fires `toast.error` with `ApiError.message` for any
  mutation that throws.
- `MutationCache.onError` is silent when `mutation.meta.suppressErrorToast: true`.
- `MutationCache.onSuccess` fires `toast.success` with `meta.successMessage` when set.
- `MutationCache.onSuccess` is silent when `meta.successMessage` is absent.
- `QueryCache.onError` fires `toast.error` with `ApiError.message` for any query
  that throws.
- `QueryCache.onError` is silent when `query.meta.suppressErrorToast: true`.

**Component (existing tests must still pass)**
- `bulk-action-toolbar` tests: remove `useToast` mock; assert the mutation
  error/success behaviour via the store hook directly.
- `payroll-ops.integration` tests: update toast assertions to use `sonner` mock
  where applicable.

**E2E (Playwright — existing suite must stay green)**
- Creating an employee with a duplicate code/email: red error toast appears with
  text matching the API error message.
- Successfully creating an employee: green toast `"Employee created"` appears.
- Loading a page with a failed query (e.g. simulate 500 on `/v1/employees`): red
  error toast appears.
- Network-timeout simulation: red toast with the timeout message appears.

## Visual Specification

- **Error toast**: red background (`destructive` semantic) or Sonner's built-in
  `toast.error` styling (dark/light auto).
- **Success toast**: green background, Sonner's `toast.success`.
- **Info / loading** (future use): `toast.loading` → `toast.dismiss` pattern.
- Duration: 4 s for success, 6 s for error (Sonner defaults are acceptable;
  use `duration` prop on `<Toaster>` if needed).
- Position: `bottom-right`.
- Max visible: 3 (Sonner default).

## Dependencies

- Add `sonner` to `apps/web` (and optionally `packages/ui` as a peer).
- Remove `@radix-ui/react-toast` from `packages/ui` after migration (it will be
  an unused dep).

## Non-Scope

- Toast action buttons / undo — out of scope for this spec.
- Per-field validation toasts — these are form-level, not API-level.
- Deduplication of simultaneous identical query errors (e.g. 5 queries failing at
  once showing 5 toasts) — acceptable for MVP; can be addressed with a toast ID
  keyed on the error message in a future pass.

## Success Criteria

- [ ] Every query failure shows a red toast with the backend error message.
- [ ] Every mutation failure shows a red toast with the backend error message.
- [ ] Mutations with `meta.successMessage` show a green toast on success.
- [ ] No `useToast` / `@radix-ui/react-toast` references remain in `apps/web`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.
- [ ] All non-negotiable test cases pass.
- [ ] E2E: duplicate employee creation shows error toast (observed in browser).
- [ ] E2E: failed page load query shows error toast (observed in browser).

## Implementation

| Phase | Branch |
|---|---|
| Install Sonner, add `<Toaster />`, export `toast` from `@salary-mgmt/ui`, wire global QueryClient handlers, add `meta` to all store mutations, migrate existing call sites | `feat/toast-notifications-pr1` |

Plan: [`docs/plans/toast-notifications.md`](../plans/toast-notifications.md) · Trace: [`traces/toast-notifications.md`](../../traces/toast-notifications.md)
