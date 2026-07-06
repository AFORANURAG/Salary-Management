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

**Commit:** `6f05142`

**Acceptance:** All 86 web tests pass · `pnpm typecheck` green · `pnpm lint` green.

---

## Phase 2 — Header (`feat/app-shell-pr2-header`)

### AS5 — AppHeader component

`apps/web/components/shell/app-header.tsx`. Client component. Logo mark (indigo square grid) + "ACME HRMS" wordmark left; page title derived from `getNavItem(pathname)` center; `NotificationBell` (static, badge count 0 for MVP) + `UserMenu` right.

### AS6 — UserMenu component

`apps/web/components/shell/user-menu.tsx`. Dropdown using shadcn `DropdownMenu`. Avatar initials derived from `user.name` (first two words). Role badge: `ADMIN` → destructive, `HR_MANAGER` → default, `HR_VIEWER` → secondary. "My Profile" → `/profile` (placeholder). "Sign out" → `postLogout()` + `removeQueries` + `router.push('/login')`.

### AS7 — Unit specs

11 tests in `apps/web/components/shell/__tests__/app-header.test.tsx`. Covers: logo wordmark renders; page title matches pathname; notification bell renders; initials derived correctly; role badge variant per role; logout calls `postLogout`, `removeQueries`, and redirects to `/login`.

Also updated `--primary` CSS variable from blue to indigo (`239 84% 67%`) in `packages/ui/src/globals.css` for consistent color grading across the product.

**Commit:** `230f088`

**Acceptance:** All 97 web tests pass · `pnpm typecheck` green.

---

## Phase 3 — Authenticated Layout & Breadcrumbs (`feat/app-shell-pr3-layout`)

### AS8 — BreadcrumbBar component

`apps/web/components/shell/breadcrumb-bar.tsx`. Client component. Splits `usePathname()` into segments, maps each against `NAV_ITEMS` by accumulated href. UUID segments resolved to employee name via `useEmployee` (cache hit — no extra request if detail page loaded first). Falls back to raw segment string if not yet cached. Last segment unlinked; returns `null` on root path.

### AS9 — AuthenticatedLayout wired

`app/(authenticated)/layout.tsx` now renders the full shell: `AppHeader` (sticky top), `AppSidebar` (fixed left), `BreadcrumbBar` (below header), `children` in a scrollable main area. Loading skeleton upgraded to match shell chrome shape.

### AS10 — Unit specs

6 tests in `apps/web/components/shell/__tests__/breadcrumb-bar.test.tsx`. Covers: root returns null; `/employees` single unlinked segment; `/employees/{uuid}` linked parent + resolved name; UUID fallback when not cached; `/payroll/{period}` two-segment; `/audit-log` mapped label.

**Commit:** `936394d`

**Acceptance:** All 103 web tests pass · `pnpm typecheck` green.
