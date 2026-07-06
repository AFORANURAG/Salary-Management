# Trace: App Shell

> Spec: [`docs/specs/app-shell.md`](../docs/specs/app-shell.md) · Plan: [`docs/plans/app-shell.md`](../docs/plans/app-shell.md)

## Phase 1 — Sidebar (`feat/app-shell-pr1-sidebar`)

### AS1 — NAV_ITEMS config

Defined `NAV_ITEMS` and `NAV_SECTIONS` in `apps/web/components/shell/nav-items.ts`. Covers all 9 routes from the spec with section grouping, role filtering, and a `getNavItem` lookup helper.

### AS2 — AppSidebar component

`apps/web/components/shell/app-sidebar.tsx`. Client component. Uses `usePathname` for active state, `useSessionContext` for role-filtered rendering, `useLocalStorage('hrms_sidebar_collapsed', false)` for collapse state. Admin section is conditionally rendered (not hidden) for non-ADMIN roles.

### AS3 — Collapse logic

Sidebar toggles between `w-60` (expanded) and `w-16` (icon rail) via `useLocalStorage`. Collapsed rail shows icons only with `title` tooltip. Chevron toggle button at sidebar bottom.

### AS4 — Unit specs

7 tests in `apps/web/components/shell/__tests__/app-sidebar.test.tsx`. Covers: ADMIN sees all 9 items; HR_MANAGER missing Admin section (DOM-absent); HR_VIEWER missing Admin + role-restricted items; active route accent class; collapsed state hides labels; toggle calls setCollapsed.

### Fixes bundled in this branch

- `apps/web/components/session-provider.tsx`: corrected logout redirect from `/auth/login` to `/login` (route group `(auth)` strips prefix).
- `apps/web/app/(auth)/__tests__/login-page.test.tsx`: refactored mock setup to use module-level state variables; added tests for 500 error banner and pending button state.
- `apps/web/app/(authenticated)/__tests__/integration/authenticated-layout.integration.test.tsx`: updated redirect assertion to `/login`.

**Commit:** <!-- SHA filled after commit -->

**Acceptance:** All 86 web tests pass · `pnpm typecheck` green · `pnpm lint` green.
