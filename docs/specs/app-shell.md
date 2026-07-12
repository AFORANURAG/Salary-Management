# Spec: App Shell (Sidebar, Header, Authenticated Layout)

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/web/components/shell`.
> Depends on [`hr-auth.md`](./hr-auth.md) — requires `useSession` and `SessionProvider`.

## Objective

Replace the bare `RootLayout` with a fully connected app chrome: a persistent
sidebar for navigation, a top header showing user identity and context, and an
`AuthenticatedLayout` wrapper that gates all non-auth routes. The shell
transforms the disconnected collection of pages into a coherent HRMS product
where every feature is one click away and the user always knows where they are.

Every page component stays unchanged — the shell is a layout wrapper only. No
data fetching lives in shell components (user identity comes from `useSession`).

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  AppHeader (h-14, sticky top-0)                         │
│  Logo + App name      [Search?]   Notifications  Avatar │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  AppSidebar  │  <page content>                          │
│  (w-60)      │                                          │
│              │  Breadcrumbs (h-10, sticky below header) │
│  collapsible │  ─────────────────────────────────────── │
│  to icon     │                                          │
│  rail (w-16) │  Page body                               │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

On mobile (`< md` breakpoint): sidebar is a drawer (off-canvas); hamburger in
header opens it; overlay closes it.

## Components

### `AppSidebar`

Sections and items:

```
─── Overview ──────────────────
  Dashboard           (/)
─── Workforce ─────────────────
  Employees           (/employees)
  Bulk Operations     (/employees/bulk)  [HR_MANAGER, ADMIN]
─── Payroll ───────────────────
  Run Payroll         (/payroll)
  History             (/payroll/history)
  Payslips            (link to /employees — context note)
─── Reporting ─────────────────
  Reports             (/reporting)
  Export              (/export)          [HR_MANAGER, ADMIN]
─── Admin ─────────────────────  (ADMIN only section, hidden otherwise)
  Audit Log           (/audit-log)
  User Management     (/users)
```

- Active route: left border accent + background highlight on the item.
- Section headers are non-clickable labels.
- Collapsed (icon rail): shows only icons with tooltip on hover.
- Collapse toggle: chevron button at the bottom of the sidebar.
- State: collapse preference stored in `localStorage` (`hrms_sidebar_collapsed`).
- Admin section is conditionally rendered — not just hidden — when
  `user.role !== 'ADMIN'`.

### `AppHeader`

Left: sidebar toggle (mobile) + logo mark + "ACME HRMS" wordmark.  
Center: current page title (from `usePathname` mapped to a title config).  
Right: `NotificationBell` (static icon, badge count 0 for MVP) + `UserMenu`.

`UserMenu` (dropdown):
- Avatar initials (derived from `user.name`)
- Full name + role badge
- "My Profile" (link → `/profile`, not in scope for MVP — renders a placeholder)
- Separator
- "Sign out" → calls `postLogout()` → invalidates session query → redirect `/auth/login`

### `BreadcrumbBar`

Rendered directly below the header inside the content area. Shows path segments
as linked breadcrumbs. Rules:
- `/` → no breadcrumb (empty bar)
- `/employees` → Employees
- `/employees/[id]` → Employees / {employee.name} (name fetched from cached query)
- `/employees/[id]/payslips/[period]` → Employees / {name} / Payslips / {period}
- `/payroll/[period]` → Payroll / {period}
- `/reporting` → Reports
- `/audit-log` → Admin / Audit Log
- Segments are linked except the last (current page).

### `AuthenticatedLayout`

Wraps all routes under `app/(authenticated)/` using Next.js route groups:

```
app/
  (auth)/
    login/page.tsx
    setup/page.tsx
  (authenticated)/
    layout.tsx          ← AuthenticatedLayout (AppSidebar + AppHeader)
    page.tsx            ← Dashboard
    employees/
    payroll/
    reporting/
    ...
```

`AuthenticatedLayout`:
1. Renders `<SessionProvider>` (already provides `user`)
2. If `isLoading` → full-page skeleton (prevents flash)
3. If `!isAuthenticated` → `redirect('/auth/login')` (shouldn't happen — middleware
   catches it, but defensive)
4. Renders `<AppSidebar> + <AppHeader> + <BreadcrumbBar> + {children}`

## Design Tokens / Visual Style

The shell uses shadcn/ui conventions already established in `@salary-mgmt/ui`:

- Sidebar background: `bg-sidebar` (maps to `hsl(var(--sidebar-background))`) — slightly off-white / near-black in dark
- Header: `bg-background border-b`
- Active nav item: `bg-accent text-accent-foreground`
- Role badge colors: `ADMIN` → `destructive` variant; `HR_MANAGER` → `default`; `HR_VIEWER` → `secondary`
- Avatar: `@salary-mgmt/ui/avatar` component, initials derived from name

No new Tailwind config variables needed for MVP — use existing CSS vars.

## No New API Endpoints

The shell reads entirely from `useSession()` (already specified in `hr-auth`).
Breadcrumb entity names are resolved from existing TanStack Query cache
(e.g. `useEmployee(id)` is already fetched by the detail page before the
breadcrumb renders).

## Key Rules

- Shell components are **client components** (`"use client"`); page components
  remain server components where possible.
- The sidebar and header must not cause a layout shift on first load — use the
  collapse preference from `localStorage` during hydration to avoid a flash.
- Role-gated sidebar items must not be discoverable via keyboard nav when hidden.
- The `Admin` section is **not rendered at all** for non-ADMIN users — not
  `display: none`.

## Non-Negotiable Test Cases

**Unit / component**
- `AppSidebar` renders all items for `ADMIN`; does not render the Admin section for `HR_MANAGER` or `HR_VIEWER`.
- Active route item has the accent class; inactive items do not.
- Collapse toggle changes sidebar width class and persists to `localStorage`.
- `UserMenu` logout option calls `postLogout` and routes to `/auth/login`.
- `BreadcrumbBar` renders correct segments for each route pattern.

**Integration (MSW)**
- `AuthenticatedLayout` with `useSession` returning `isAuthenticated: true` renders children.
- `AuthenticatedLayout` with `useSession` returning `isAuthenticated: false` redirects (tested via navigation mock).

**E2E (Playwright)**
- Authenticated `ADMIN`: all sidebar sections visible; clicking each navigates to the correct route.
- Authenticated `HR_VIEWER`: Admin section absent; clicking Employees navigates correctly.
- Sidebar collapse: toggle collapses to icon rail; page content expands; preference survives reload.
- Mobile viewport: sidebar is closed by default; hamburger opens drawer; overlay click closes it.

## Success Criteria

- [x] All authenticated routes render inside the shell — no page bypasses the layout.
- [x] Admin section invisible to non-ADMIN (DOM-absent, not CSS-hidden).
- [x] Sidebar collapse preference survives full page reload.
- [x] All non-negotiable test cases pass.
- [x] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## Implementation

| Phase | Branch |
|---|---|
| `AppSidebar` component, route config, active state, collapse | `feat/app-shell-pr1-sidebar` |
| `AppHeader`, `UserMenu`, avatar, role badge, logout | `feat/app-shell-pr2-header` |
| `AuthenticatedLayout`, route groups restructure, `BreadcrumbBar` | `feat/app-shell-pr3-layout` |
| Mobile drawer, hamburger, responsive breakpoints | `feat/app-shell-pr4-responsive` |
| Unit + integration + E2E tests for shell | `feat/app-shell-pr5-tests` |

Plan: [`docs/plans/app-shell.md`](../plans/app-shell.md) · Trace: [`traces/app-shell.md`](../../traces/app-shell.md)
