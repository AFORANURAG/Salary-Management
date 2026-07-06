# Implementation Plan: App Shell (Sidebar, Header, Authenticated Layout)

> Source spec: [`../specs/app-shell.md`](../specs/app-shell.md) · Trace log: [`../../traces/app-shell.md`](../../traces/app-shell.md)

## Overview

Persistent UI chrome — sidebar + header + authenticated layout — that connects
all HRMS pages into a coherent product. Depends on `hr-auth` landing first
(`useSession` + `SessionProvider` must exist). No new API endpoints; five
stacked frontend-only branches.

## Architecture Decisions

- **Next.js route group `(authenticated)/layout.tsx`** — `AuthenticatedLayout`
  from `hr-auth` becomes the parent; shell components render inside it.
- **`"use client"` shell components** — sidebar collapse state and `useSession`
  require the client. Page components stay server components.
- **Route config object** — a single `NAV_ITEMS` constant drives both sidebar
  rendering and breadcrumb generation; avoids duplication across components.
- **`localStorage` for collapse preference** — key `hrms_sidebar_collapsed`;
  read during hydration to avoid a visible flash from expanded → collapsed.
- **Admin section DOM-absent for non-ADMIN** — conditional render, not CSS
  `display: none`, so keyboard nav cannot reach hidden items.
- **shadcn/ui `Sheet`** — used for the mobile off-canvas drawer; already
  available from `@salary-mgmt/ui` (need to add `sheet` export if not present).
- **No new dependencies** — `lucide-react` (already installed) provides all
  nav icons; `@salary-mgmt/ui` components for avatar, dropdown, badge.

## Ask-First Boundaries

- Adding new shadcn/ui primitives to `@salary-mgmt/ui` if `Sheet` is not
  already exported (check before AS4).

---

## Task List

### Phase 1 — Sidebar

Branch: `feat/app-shell-pr1-sidebar`

| Task | Description | Commit |
|---|---|---|
| AS1 | Define `NAV_ITEMS` config: array of `{ label, href, icon, roles?, section }` covering all 9 routes from spec | `feat(web): add nav items config` |
| AS2 | `AppSidebar` component (`components/shell/app-sidebar.tsx`): renders section headers + nav items; active route via `usePathname()`; role-filtering from `useSession()`; Admin section DOM-absent for non-ADMIN | `feat(web): add AppSidebar component` |
| AS3 | Collapse logic: `useLocalStorage('hrms_sidebar_collapsed', false)` hook; chevron toggle at sidebar bottom; sidebar switches between `w-60` (expanded) and `w-16` (icon rail); icon rail shows only icons + tooltip (`title` attribute) | `feat(web): add sidebar collapse with localStorage persistence` |
| AS4 | Unit spec: ADMIN sees all 9 items + Admin section; HR_MANAGER missing Admin section (DOM check); HR_VIEWER same; active route item has accent class; inactive items do not; collapse toggle changes width class + persists to localStorage | `test(web): add AppSidebar unit specs` |

**Acceptance**
- [x] Unit specs GREEN.
- [x] `pnpm typecheck` passes.

---

### Phase 2 — Header

Branch: `feat/app-shell-pr2-header`

| Task | Description | Commit |
|---|---|---|
| AS5 | `AppHeader` component (`components/shell/app-header.tsx`): logo mark + "ACME HRMS" wordmark on left; current page title (derived from `NAV_ITEMS` + `usePathname()`) in center; `UserMenu` on right | `feat(web): add AppHeader component` |
| AS6 | `UserMenu` (dropdown): avatar initials from `user.name`; full name + role badge (`ADMIN` → destructive, `HR_MANAGER` → default, `HR_VIEWER` → secondary); "My Profile" link (placeholder `/profile`); separator; "Sign out" → `postLogout()` + invalidate session + `router.push('/auth/login')` | `feat(web): add UserMenu with logout` |
| AS7 | Unit spec: avatar initials from name; role badge variant correct per role; logout calls `postLogout` and routes to `/auth/login` | `test(web): add AppHeader and UserMenu unit specs` |

**Acceptance**
- [x] Unit specs GREEN.
- [x] `pnpm typecheck` passes.

---

### Phase 3 — Authenticated Layout & Breadcrumbs

Branch: `feat/app-shell-pr3-layout`

| Task | Description | Commit |
|---|---|---|
| AS8 | `BreadcrumbBar` component (`components/shell/breadcrumb-bar.tsx`): `usePathname()` → segment array → mapped to labels via `NAV_ITEMS` + entity name from TanStack Query cache (employee name via `useEmployee(id)` if segment is a UUID); last segment unlinked | `feat(web): add BreadcrumbBar component` |
| AS9 | Update `app/(authenticated)/layout.tsx` (created in hr-auth HA24): add `AppSidebar` + `AppHeader` + `BreadcrumbBar`; main content area `flex-1 overflow-y-auto` | `feat(web): wire AppSidebar + AppHeader + BreadcrumbBar into AuthenticatedLayout` |
| AS10 | Unit spec: breadcrumb for `/employees` → ["Employees"]; `/employees/{uuid}` → ["Employees", "{employee.name}"]; `/payroll/{period}` → ["Payroll", "{period}"]; `/audit-log` → ["Admin", "Audit Log"] | `test(web): add BreadcrumbBar unit specs` |

**Acceptance**
- [ ] Unit specs GREEN.
- [ ] All existing page routes still render inside layout.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

---

### Phase 4 — Mobile Responsive

Branch: `feat/app-shell-pr4-responsive`

| Task | Description | Commit |
|---|---|---|
| AS11 | Check if `Sheet` primitive exists in `@salary-mgmt/ui`; add it if not (shadcn/ui sheet) | `feat(ui): add Sheet primitive` |
| AS12 | Mobile layout: sidebar hidden by default at `< md`; `AppHeader` shows hamburger icon (`Menu` from lucide) at `< md`; click opens `Sheet` containing `AppSidebar` in drawer mode; overlay click / nav-item click closes sheet | `feat(web): add mobile sidebar drawer` |
| AS13 | Unit spec: at mobile viewport flag, hamburger renders; sidebar is not in document by default; after hamburger click, sidebar appears in sheet | `test(web): add mobile sidebar drawer unit spec` |

**Acceptance**
- [ ] Mobile drawer opens and closes correctly in jsdom tests.
- [ ] Desktop sidebar unaffected by mobile changes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

---

### Phase 5 — Integration & E2E

Branch: `feat/app-shell-pr5-tests`

| Task | Description | Commit |
|---|---|---|
| AS14 | Integration spec (MSW): `AuthenticatedLayout` with ADMIN session renders AppSidebar with Admin section; with HR_VIEWER session renders without Admin section | `test(web): add AppShell integration specs` |
| AS15 | E2E: ADMIN — all sidebar sections visible; clicking each item navigates to correct route | |
| AS16 | E2E: HR_VIEWER — Admin section absent from sidebar DOM | |
| AS17 | E2E: sidebar collapse toggle — collapses to icon rail; content area expands; preference survives page reload | |
| AS18 | E2E: mobile viewport (375px) — sidebar closed by default; hamburger opens drawer; overlay click closes it | |

**Acceptance**
- [ ] Integration specs GREEN.
- [ ] All 4 E2E specs GREEN against running stack.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases covered and green.
- [ ] Shell visible on all authenticated routes.
- [ ] Admin section DOM-absent for non-ADMIN (verified in E2E).
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `localStorage` read on server causes hydration mismatch | Med | Use `useEffect` to apply collapse state after mount; default to expanded on SSR |
| Breadcrumb entity-name lookup (`useEmployee`) fires an extra request on employee detail | Low | It reuses the already-cached result from the detail page — zero extra network requests if page loaded first |
| Route group restructure (done in hr-auth HA18) may have left stale imports | Med | Run `pnpm typecheck` immediately after AS9; fix any broken paths |
| Sheet component missing from `@salary-mgmt/ui` | Low | Check exports before AS11; add if needed; this is a 1-file change |
