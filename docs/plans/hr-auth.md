# Implementation Plan: HR Authentication & Access Control

> Source spec: [`../specs/hr-auth.md`](../specs/hr-auth.md) · Trace log: [`../../traces/hr-auth.md`](../../traces/hr-auth.md)

## Overview

Invite-only HR user accounts with JWT (HttpOnly cookie), bcrypt passwords,
and role-based access control (`ADMIN` | `HR_MANAGER` | `HR_VIEWER`).
This plan is the prerequisite for every other spec — it must land first.

Built test-first: RED suite before any auth logic. Eight stacked branches
(4 backend, 4 frontend).

## Architecture Decisions

- **Cookie, not Authorization header** — `HttpOnly; SameSite=Strict` cookie
  named `hrms_session`; `cookie-parser` middleware in `main.ts`; avoids XSS
  token theft.
- **Passport + `@nestjs/jwt`** — `JwtStrategy` extends `PassportStrategy`;
  `JwtAuthGuard` extends `AuthGuard('jwt')`.
- **Global guard with `@Public()` escape hatch** — `APP_GUARD` token in
  `AppModule`; routes decorated `@Public()` skip JWT validation.
  Public routes: `/health`, `POST /v1/auth/login`, `POST /v1/auth/setup`.
- **`RolesGuard` also global** — reads `@Roles()` metadata; returns 403
  (not 401) for authenticated users with insufficient role.
- **bcrypt rounds=12** — synchronous only in tests (rounds=1 for speed);
  production always 12.
- **Seed admin** — `pnpm --filter api seed` upserts by email from
  `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env vars.
- **`HrUser` entity separate from `Employee`** — HR ops staff ≠ payroll employees.
- **New shared types** — `HrUser`, `HrUserRole`, `AuthMeResponse`,
  `InviteResponse` added to `@salary-mgmt/types`.

## Ask-First Boundaries

- Any DB schema changes (HrUser migration — HA2).
- New dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`,
  `passport-jwt`, `bcrypt`, `cookie-parser` + dev types.

---

## Task List

### Phase 1 — DB Models & Types

Branch: `feat/hr-auth-pr1-db-models`

| Task | Description | Commit |
|---|---|---|
| HA1 | `packages/types`: add `HrUserRole` enum, `HrUser` interface, `AuthMeResponse`, `InviteResponse`, `SetupRequest`, `LoginRequest` | `feat(types): add hr-auth contracts` |
| HA2 | `HrUserEntity` + TypeORM migration: uuid PK, unique email, role enum, passwordHash nullable, inviteToken unique nullable, inviteExpiresAt, status enum, timestamps; index on email + status | `feat(api): add HrUser entity and migration` |
| HA3 | `HrUsersModule` stub; `HrUserEntity` registered in `TypeOrmModule.forFeature`; `AppModule` imports `HrUsersModule` | `feat(api): wire HrUsersModule stub` |

**Acceptance**
- [ ] Types exported from `@salary-mgmt/types`; `pnpm --filter @salary-mgmt/types build && pnpm typecheck` pass.
- [ ] Migration runs against compose DB: `pnpm --filter api migration:run`.
- [ ] `AppModule` boots with stub module registered.

### Checkpoint: Foundation
- [ ] `pnpm typecheck && pnpm lint` clean.

---

### Phase 2 — RED Test Suite

Branch: `feat/hr-auth-pr2-test-harness`

| Task | Description | Commit |
|---|---|---|
| HA4 | Unit spec `AuthService`: `invite()` creates PENDING_SETUP user with non-null expiring inviteToken; `setup()` valid token activates user; `setup()` expired/used token throws; `login()` correct credentials returns JWT payload; `login()` PENDING_SETUP throws 401; `JwtStrategy.validate()` resolves user or throws 401 | `test(api): add failing hr-auth unit specs (HA4)` |
| HA5 | Integration spec: full invite → setup → login → `/me` → logout flow; cookie set and cleared; HR_MANAGER calling invite → 403; HR_VIEWER calling `POST /v1/employees` → 403; ADMIN inviting twice → two distinct tokens; expired cookie → 401; `/health` without cookie → 200 | `test(api): add failing hr-auth integration specs (HA5)` |

**Acceptance**
- [ ] All unit and integration specs fail RED (routes 404, service not implemented) — not harness errors.

---

### Phase 3 — API Implementation (GREEN)

Branch: `feat/hr-auth-pr3-api`

| Task | Description | Commit |
|---|---|---|
| HA6 | Install deps: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `cookie-parser` + dev types; register `cookie-parser` in `main.ts` | `feat(api): install and wire auth dependencies` |
| HA7 | `AuthService`: `invite()`, `setup()`, `login()`, `logout()`, `me()` — bcrypt rounds=12; invite token UUID v4; expiry 72 h | `feat(api): implement AuthService (HA7)` |
| HA8 | `JwtStrategy` (cookie extractor), `JwtAuthGuard`, `@Public()` decorator, `RolesGuard`, `@Roles()` decorator, `@CurrentUser()` param decorator | `feat(api): add JWT strategy, guards, decorators (HA8)` |
| HA9 | `AuthController`: `POST /v1/auth/invite`, `POST /v1/auth/setup`, `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me` | `feat(api): add AuthController routes (HA9)` |
| HA10 | `AuthModule` wired; `JwtAuthGuard` + `RolesGuard` registered as `APP_GUARD` in `AppModule` | `feat(api): register global guards in AppModule (HA10)` |
| HA11 | Update seed: upsert ADMIN from `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`; idempotent | `chore(api): seed admin HrUser` |

**Acceptance**
- [ ] All unit specs from HA4 GREEN.
- [ ] All integration specs from HA5 GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Backend complete
- [ ] All non-negotiable backend test cases pass.
- [ ] Seed admin boots; can log in via curl / Postman.

---

### Phase 4 — Guard Wiring on Existing Routes

Branch: `feat/hr-auth-pr4-guard-wiring`

| Task | Description | Commit |
|---|---|---|
| HA12 | Add `@Roles(Role.HR_MANAGER, Role.ADMIN)` to all write endpoints across `EmployeesController`, `SalaryStructureController`, `PayrollController` | `feat(api): apply role guards to existing write endpoints` |
| HA13 | Add integration test assertions: each write endpoint returns 403 for `HR_VIEWER`; GET endpoints still return 200 | `test(api): verify role guards on existing endpoints` |
| HA14 | Update `.env.example` with `JWT_SECRET`, `JWT_EXPIRY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `FRONTEND_URL` | `chore(api): document auth env vars in .env.example` |

**Acceptance**
- [ ] All existing tests still pass (guards don't break GET routes).
- [ ] Write routes return 403 for HR_VIEWER.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.

### Checkpoint: Backend fully secured
- [ ] All API routes protected; role matrix from spec enforced.

---

### Phase 5 — Frontend: Types, Store Hooks

Branch: `feat/hr-auth-fe-pr1-types-hooks`

| Task | Description | Commit |
|---|---|---|
| HA15 | `@salary-mgmt/store`: add `getMe()`, `postLogin()`, `postSetup()`, `postLogout()` API fns | `feat(store): add auth API functions` |
| HA16 | `useSession()` hook: `queryKey: ['session']`, `staleTime: Infinity`, `retry: false`; returns `{ user, isLoading, isAuthenticated }` | `feat(store): add useSession hook` |
| HA17 | Unit spec: `useSession` returns `isAuthenticated: false` when `/me` returns 401; `isAuthenticated: true` with valid user | `test(store): add useSession unit specs` |

**Acceptance**
- [ ] `pnpm --filter @salary-mgmt/store typecheck` passes.
- [ ] `useSession` unit specs GREEN.

---

### Phase 6 — Frontend: Auth Pages

Branch: `feat/hr-auth-fe-pr2-pages`

| Task | Description | Commit |
|---|---|---|
| HA18 | Restructure `apps/web/app` into route groups: `(auth)/` and `(authenticated)/`; move existing pages under `(authenticated)/` | `refactor(web): restructure app router into auth and authenticated route groups` |
| HA19 | `/auth/login` page: `react-hook-form` + `zod` schema (email, password); calls `postLogin()`; on success invalidates session query; error banner on 401 | `feat(web): add login page` |
| HA20 | `/auth/setup` page: reads `?token=` from URL; static error if token missing; name + password + confirm fields; calls `postSetup()`; redirect to `/auth/login` on success; 410 error state | `feat(web): add account setup page` |
| HA21 | Unit specs: login form submit calls `postLogin`; wrong password shows error; setup mismatched passwords shows validation error; setup missing token shows static error | `test(web): add login and setup page unit specs` |

**Acceptance**
- [ ] Login and setup pages render correctly.
- [ ] Unit specs GREEN.
- [ ] `pnpm typecheck` passes after route group restructure.

---

### Phase 7 — Frontend: Route Protection

Branch: `feat/hr-auth-fe-pr3-protection`

| Task | Description | Commit |
|---|---|---|
| HA22 | `apps/web/middleware.ts`: check for `hrms_session` cookie; redirect `/auth/login` for all non-`/auth/*` routes if absent | `feat(web): add Next.js middleware for route protection` |
| HA23 | `SessionProvider` client component: wraps `AuthenticatedLayout`; provides `user` + `role` via React context; on any 401 query error, calls `postLogout()` + redirects | `feat(web): add SessionProvider and session context` |
| HA24 | `AuthenticatedLayout` (`app/(authenticated)/layout.tsx`): renders `SessionProvider`; full-page skeleton while `isLoading`; redirect if `!isAuthenticated` | `feat(web): add AuthenticatedLayout with session gate` |

**Acceptance**
- [ ] Unauthenticated visit to any authenticated route redirects to `/auth/login`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 8 — Frontend: Integration Tests (MSW)

Branch: `feat/hr-auth-fe-pr4-integration`

| Task | Description | Commit |
|---|---|---|
| HA25 | MSW handlers for `GET /v1/auth/me` (200 with user + 401 variants) in `apps/web/test/msw/handlers/auth.ts`; register in server | `test(web): add auth MSW handlers` |
| HA26 | Integration spec: `AuthenticatedLayout` with `useSession` returning authenticated user renders children | `test(web): add AuthenticatedLayout authenticated integration spec` |
| HA27 | Integration spec: `AuthenticatedLayout` with `useSession` returning 401 redirects to `/auth/login` | `test(web): add AuthenticatedLayout unauthenticated integration spec` |
| HA28 | Integration spec: login page MSW 200 → session query invalidated → redirect fires | `test(web): add login page success integration spec` |
| HA29 | Integration spec: login page MSW 401 → error banner renders, no redirect | `test(web): add login page failure integration spec` |

**Acceptance**
- [ ] All 4 integration specs GREEN.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

---

### Phase 9 — Frontend: E2E (Playwright)

Branch: `feat/hr-auth-fe-pr5-e2e`

| Task | Description | Commit |
|---|---|---|
| HA30 | E2E: login page correct credentials → redirect to `/`; wrong password → error shown | |
| HA31 | E2E: setup page valid token → form shown; password set → redirect to login | |
| HA32 | E2E: setup page missing/invalid token → error state rendered | |
| HA33 | E2E: unauthenticated visit to `/employees` → redirect to `/auth/login` | |
| HA34 | E2E: `HR_VIEWER` session → admin sidebar items absent; `HR_MANAGER` → admin section hidden | |
| HA35 | E2E: logout → redirect to `/auth/login`; back-button does not restore session | |

**Acceptance**
- [ ] All 6 E2E specs GREEN against `docker compose up --build`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green from repo root.

### Checkpoint: Complete
- [ ] All spec Non-Negotiable Test Cases covered and green.
- [ ] Invite → setup → login → logout flows working end-to-end.
- [ ] Ready for review.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cookie `SameSite=Strict` breaks cross-origin dev (api :3001, web :3000) | High | Use `SameSite=Lax` in development (`NODE_ENV !== 'production'`); document in `.env.example` |
| Route group restructure breaks existing E2E tests | Med | Run existing Playwright suite immediately after HA18; fix any path breakage before proceeding |
| `JwtAuthGuard` global guard breaks existing integration tests that have no auth | High | Apply `@Public()` to all existing integration test controllers; audit each test module |
| bcrypt rounds=12 slow in CI | Low | Test helper uses rounds=1 via env var `BCRYPT_ROUNDS_TEST=1` |
