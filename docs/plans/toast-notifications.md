# Plan: Toast Notifications

Spec: [`docs/specs/toast-notifications.md`](../specs/toast-notifications.md)

## Phase 1 — Sonner wiring, global handlers, migration

Branch: `feat/toast-notifications-pr1`

### Tasks

**Dependencies**
- [ ] Add `sonner` to `apps/web/package.json`
- [ ] Optionally add `sonner` as a dependency of `packages/ui` (if the re-export lives there)

**`packages/ui` changes**
- [ ] Add `./toast` export in `packages/ui/package.json` → `./src/toast.ts`
- [ ] Create `packages/ui/src/toast.ts`: re-export `toast` and `ToastT` from `sonner`
- [ ] Add `<Toaster />` re-export (`./toaster-sonner`) if needed, or document that consumers import `Toaster` directly from `sonner`

**`packages/store` changes**
- [ ] Add `QueryMeta` + `MutationMeta` module augmentation to `packages/store/src/query/client.ts` (or a new `packages/store/src/meta.ts` re-exported from index)
- [ ] Wire `QueryCache` with `onError` in `createQueryClient` — reads `query.meta?.suppressErrorToast`, calls `toast.error(toastMessage(error))`
- [ ] Wire `MutationCache` with `onError` in `createQueryClient` — reads `mutation.meta?.suppressErrorToast`, calls `toast.error(toastMessage(error))`
- [ ] Wire `MutationCache` with `onSuccess` in `createQueryClient` — reads `mutation.meta?.successMessage`, calls `toast.success(msg)` if set
- [ ] Add `meta.successMessage` to `useCreateEmployee`
- [ ] Add `meta.successMessage` to `useUpdateEmployee`
- [ ] Add `meta.successMessage` to `useDeleteEmployee`
- [ ] Add `meta.successMessage` to `useBulkStatusChange`
- [ ] Add `meta.suppressErrorToast: true` to `useEmployeeImport` (wizard manages its own feedback)
- [ ] Add `meta.successMessage` / `suppressErrorToast` to payroll mutations
- [ ] Add `meta.successMessage` / `suppressErrorToast` to salary-structure mutations
- [ ] Add `meta.suppressErrorToast: true` to auth mutations (login/logout)

**`apps/web` changes**
- [ ] Mount `<Toaster position="bottom-right" theme="system" />` in `apps/web/app/(authenticated)/layout.tsx`
- [ ] Mount `<Toaster position="bottom-right" theme="system" />` in `apps/web/app/(auth)/layout.tsx`
- [ ] Migrate `bulk-action-toolbar.tsx`: remove `useToast`; rely on global handler
- [ ] Migrate `void-confirm-modal.tsx`: remove `useToast`; rely on global handler (move success message to store mutation `meta`)
- [ ] Remove `@salary-mgmt/ui/toast`, `@salary-mgmt/ui/toaster`, `@salary-mgmt/ui/use-toast` exports from `packages/ui/package.json` (and delete the underlying shadcn files if unused)
- [ ] Remove `@radix-ui/react-toast` from `packages/ui/package.json` after confirming no remaining usage

**Tests**
- [ ] Unit: `MutationCache.onError` calls `toast.error` with `ApiError.message`
- [ ] Unit: `MutationCache.onError` is suppressed when `meta.suppressErrorToast: true`
- [ ] Unit: `MutationCache.onSuccess` calls `toast.success` when `meta.successMessage` is set
- [ ] Unit: `MutationCache.onSuccess` is silent when `meta.successMessage` is absent
- [ ] Unit: `QueryCache.onError` calls `toast.error` with `ApiError.message`
- [ ] Unit: `QueryCache.onError` is suppressed when `query.meta.suppressErrorToast: true`
- [ ] Update `bulk-action-toolbar.test.tsx`: remove `useToast` mock
- [ ] Update `payroll-ops.integration.test.tsx`: update toast assertions for sonner

**Verification**
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Manual E2E: create employee with duplicate code → red error toast shown
- [ ] Manual E2E: create employee successfully → green `"Employee created"` toast shown
- [ ] Manual E2E: simulate failed query (employees list 500) → red error toast shown

### Acceptance Criteria

- [ ] Every query failure surfaces a red toast with the backend error message.
- [ ] Every mutation failure surfaces a red toast with the backend error message.
- [ ] Mutations with `meta.successMessage` show a green toast on success.
- [ ] No `useToast` / `@radix-ui/react-toast` references remain in `apps/web` or `packages/ui`.
- [ ] All tests green.
