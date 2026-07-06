# Spec: HR Authentication & Access Control

> Domain spec under [`../spec.md`](../spec.md). Owns `apps/api/src/auth`,
> `apps/api/src/hr-users`, and the auth pages in `apps/web`.

## Objective

Secure the entire ACME HRMS behind invite-only HR user accounts. An `ADMIN`
creates accounts; the invited user sets their own password via a one-time token
URL. All API routes (except `/health`, `/v1/auth/login`, `/v1/auth/setup`)
require a valid JWT delivered as an `HttpOnly` cookie. Role-based access
(`ADMIN` | `HR_MANAGER` | `HR_VIEWER`) gates write operations and admin-only
features across every other module.

This is the **gateway spec** — `app-shell`, `dashboard`, `audit-log` all
depend on it. No other feature ships to production before auth is wired.

## Data Model

### `HrUser`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `email` | string, unique | login identity; indexed |
| `name` | string | display name shown in header |
| `role` | enum: `ADMIN` \| `HR_MANAGER` \| `HR_VIEWER` | controls access matrix |
| `passwordHash` | string, nullable | bcrypt rounds=12; null until invite accepted |
| `inviteToken` | string (uuid), unique, nullable | one-time; nulled on first use |
| `inviteExpiresAt` | timestamptz, nullable | 72 h from invite creation |
| `status` | enum: `PENDING_SETUP` \| `ACTIVE` | flipped to ACTIVE on password set |
| `createdAt` / `updatedAt` | timestamptz | |

A **seed admin** is created by `pnpm --filter api seed` using env vars
`SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`. Re-runs are idempotent (upsert by
email). No other seed user exists — admin creates everyone else via the invite
flow.

## API Surface

All routes under `/v1` prefix.

```
POST /v1/auth/invite    → create PENDING_SETUP HrUser; return { inviteToken, inviteUrl } (ADMIN only)
POST /v1/auth/setup     → validate token, set password, activate account, set JWT cookie
POST /v1/auth/login     → email + password → set JWT cookie
POST /v1/auth/logout    → clear JWT cookie (200 even without cookie)
GET  /v1/auth/me        → return current user: { id, email, name, role }
```

`GET /v1/auth/me` is the single source of truth for the frontend session — the
web app calls it on mount to hydrate the session context.

### JWT Cookie

| Property | Value |
|---|---|
| Cookie name | `hrms_session` |
| HttpOnly | true |
| SameSite | Strict |
| Secure | true when `NODE_ENV=production` |
| Payload | `{ sub: userId, email, role }` |
| Expiry | 8 h; no refresh token for MVP |

Cookie is read by `cookie-parser` middleware registered in `main.ts`.

### Guards & Decorators

- `JwtAuthGuard` — global guard registered in `AppModule`; excludes
  `/v1/auth/login`, `/v1/auth/setup`, `/health` via a public metadata marker
  (`@Public()` decorator).
- `RolesGuard` — applied globally after `JwtAuthGuard`; no-ops on routes
  without `@Roles()`.
- `@Roles(...roles: Role[])` — sets required minimum role on a controller or
  handler.
- `@CurrentUser()` — param decorator that extracts `HrUser` from
  `request.user`.

## Role Matrix

| Resource | ADMIN | HR_MANAGER | HR_VIEWER |
|---|---|---|---|
| `POST /v1/auth/invite` | ✓ | ✗ | ✗ |
| Employee CRUD (POST/PATCH/DELETE) | ✓ | ✓ | ✗ |
| Employee GET | ✓ | ✓ | ✓ |
| Salary structure write | ✓ | ✓ | ✗ |
| Salary structure read | ✓ | ✓ | ✓ |
| `POST /v1/payroll/runs` | ✓ | ✓ | ✗ |
| `POST /v1/payroll/runs/:period/void` | ✓ | ✗ | ✗ |
| Payroll / payslips read | ✓ | ✓ | ✓ |
| Reporting read | ✓ | ✓ | ✓ |
| `GET /v1/dashboard/summary` | ✓ | ✓ | ✓ |
| `GET /v1/audit-log` | ✓ | ✗ | ✗ |
| Employee bulk ops (import / bulk-status) | ✓ | ✓ | ✗ |
| Data export (any) | ✓ | ✓ | ✓ |

## Key Rules

- Passwords: bcrypt rounds=12; never returned in any response; never logged.
- Invite tokens: UUID v4; single-use (nulled immediately on `POST /v1/auth/setup`); expire 72 h after creation.
- `POST /v1/auth/invite` returns `{ inviteToken, inviteUrl }` — admin copies and shares manually. No email delivery in MVP.
- `inviteUrl` format: `${FRONTEND_URL}/auth/setup?token={inviteToken}`.
- `POST /v1/auth/login` with a `PENDING_SETUP` account → 401 (generic "Invalid credentials").
- Failed login always returns 401 with a generic message — no user-enumeration leakage.
- Expired invite token → 410 Gone.
- All guard failures are 401 (unauthenticated) or 403 (authenticated but insufficient role) — never 404.

## Non-Negotiable Test Cases

**Unit**
- `AuthService.invite()` creates a `PENDING_SETUP` user with a non-null `inviteToken` expiring ~72 h from now.
- `AuthService.setup()` with a valid token activates the user, sets `passwordHash`, nulls the token.
- `AuthService.setup()` with an expired or used token throws the correct exception.
- `AuthService.login()` with correct credentials returns the JWT payload; wrong password throws 401.
- `AuthService.login()` with a `PENDING_SETUP` account throws 401.
- `JwtStrategy.validate()` resolves `HrUser` from JWT payload; unknown `sub` throws 401.

**Integration**
- Full invite → setup → login → `/me` → logout flow: cookie set and cleared correctly.
- `HR_MANAGER` calling `POST /v1/auth/invite` → 403.
- `HR_VIEWER` calling `POST /v1/employees` → 403.
- `ADMIN` calling `POST /v1/auth/invite` twice → two distinct tokens; each works once.
- Request with expired cookie → 401.
- Request to `/health` without cookie → 200 (public route).

**E2E (Playwright)**
- Login page: correct credentials → redirected to `/`; wrong password → error shown.
- Setup page: valid token → form shown, password set, redirect to login.
- Setup page: missing/invalid token → error state rendered.
- Unauthenticated visit to `/employees` → redirect to `/auth/login`.
- `HR_VIEWER` session: sidebar does not show admin-only items.
- Logout → redirect to `/auth/login`; back-button does not restore session.

## Success Criteria

- [ ] All existing API endpoints return 401 without a valid cookie.
- [ ] Invite → setup → login → me → logout works end-to-end.
- [ ] Role matrix enforced; 403 returned (not 401) for authenticated but
      insufficient role.
- [ ] Seed admin boots without an existing ADMIN record; idempotent on re-runs.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

## New Dependencies

Ask before installing:

| Package | Location | Purpose |
|---|---|---|
| `@nestjs/jwt` | api | JWT sign/verify |
| `@nestjs/passport` | api | Passport integration |
| `passport` | api | Strategy runner |
| `passport-jwt` | api | Cookie-based JWT strategy |
| `bcrypt` | api | Password hashing |
| `cookie-parser` | api | Parse HttpOnly cookie in Express |
| `@types/passport-jwt` | api devDep | Types |
| `@types/bcrypt` | api devDep | Types |
| `@types/cookie-parser` | api devDep | Types |

## Frontend

Pages and components in `apps/web`. Data layer via `@salary-mgmt/store`.

### Pages

| Route | Description |
|---|---|
| `/auth/login` | Email + password; `POST /v1/auth/login`; redirect to `/` on success |
| `/auth/setup` | Reads `?token=` from URL; name + password + confirm; `POST /v1/auth/setup`; redirect to `/auth/login` on success |

Both pages use `react-hook-form` + `zod` (already installed).

### Session Layer (in `@salary-mgmt/store`)

- `getMe()` API fn — `GET /v1/auth/me`
- `postLogin(email, password)` API fn
- `postSetup(token, name, password)` API fn
- `postLogout()` API fn
- `useSession()` hook — TanStack Query, `queryKey: ['session']`, `staleTime: Infinity`, `retry: false`; returns `{ user, isLoading, isAuthenticated }`

### Route Protection

- Next.js `middleware.ts` at repo root — reads cookie name `hrms_session`; if absent, redirects to `/auth/login` for all routes except `/auth/*`.
- `SessionProvider` client component — wraps `AuthenticatedLayout`; provides `user` + `role` via React context; redirects on 401 from any query.

### Frontend Non-Negotiable Test Cases

**Unit / component**
- Login form: valid submit calls `postLogin` and invalidates session query; wrong password shows error banner; submit button disabled during in-flight request.
- Setup form: mismatched passwords shows validation error without calling API; missing token in URL shows static error state.
- `useSession` returns `isAuthenticated: false` when `/me` returns 401.

**Integration (MSW)**
- `/auth/login` page: MSW returns 200 → `useSession` query invalidated → redirect fires.
- `/auth/login` page: MSW returns 401 → error message renders.

**E2E (Playwright)**
- See Non-Negotiable Test Cases above.

## Implementation

### Backend

| Phase | Branch |
|---|---|
| `HrUser` entity, migration, `@salary-mgmt/types` contracts | `feat/hr-auth-pr1-db-models` |
| RED — unit + integration test suite | `feat/hr-auth-pr2-test-harness` |
| Invite, setup, login, logout, `/me` (GREEN) | `feat/hr-auth-pr3-api` |
| `JwtAuthGuard` global, `@Roles` on all existing routes | `feat/hr-auth-pr4-guard-wiring` |

### Frontend

| Phase | Branch |
|---|---|
| `@salary-mgmt/types` auth types + store API fns + `useSession` hook + unit tests | `feat/hr-auth-fe-pr1-types-hooks` |
| `/auth/login` + `/auth/setup` pages + unit tests | `feat/hr-auth-fe-pr2-pages` |
| `SessionProvider`, Next.js middleware, route protection | `feat/hr-auth-fe-pr3-protection` |
| Integration tests (MSW): `AuthenticatedLayout`, login flow | `feat/hr-auth-fe-pr4-integration` |
| E2E (Playwright): login, setup, logout, role-gating | `feat/hr-auth-fe-pr5-e2e` |

Plan: [`docs/plans/hr-auth.md`](../plans/hr-auth.md) · Trace: [`traces/hr-auth.md`](../../traces/hr-auth.md)
