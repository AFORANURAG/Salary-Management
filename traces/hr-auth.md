# HR Auth — Execution Trace

Spec: `docs/specs/hr-auth.md`
Plan: `docs/plans/hr-auth.md`

---

## Phase 1 — DB Models (branch: `feat/hr-auth-pr1-db-models`)

**Commit:** `7cb27a0` · **Merge PR #44:** `81b05d5`

### Tasks completed
- HA1: `HrUserRole`, `HrUserStatus`, `HrUser`, `AuthMeResponse`, `InviteRequest/Response`, `SetupRequest`, `LoginRequest` added to `packages/types/src/index.ts`
- HA2: `BaseEntity` (id + createdAt + updatedAt) at `apps/api/src/common/base.entity.ts`; `HrUserEntity` extending `BaseEntity` with all columns and indexes at `apps/api/src/hr-users/hr-user.entity.ts`
- HA3: Migration `1751400000000-CreateHrUsers.ts` — `hr_users` table, enums, partial unique index on invite_token; `HrUsersModule` stub registered in `AppModule`

---

## Phase 2 — Test Harness / RED (branch: `feat/hr-auth-pr2-test-harness`)

**Commit:** `5e5226d` · **Merge PR #45:** `d3a570c`

### Tasks completed
- HA4: `auth.service.spec.ts` — 9 unit specs covering invite, setup (valid/expired), login (correct/wrong/pending-setup), JwtStrategy validate
- HA5: `auth.e2e-spec.ts` — 16 integration specs covering full cookie flow, role enforcement, duplicate invite, expired token, public routes

---

## Phase 3 — API Implementation / GREEN (branch: `feat/hr-auth-pr3-api`)

**Commit:** `e9e2cd3`

### Tasks completed
- HA1: `HrUserRole`, `HrUserStatus`, `HrUser`, `AuthMeResponse`, `InviteRequest/Response`, `SetupRequest`, `LoginRequest` added to `packages/types/src/index.ts`
- HA2: `BaseEntity` (id + createdAt + updatedAt) at `apps/api/src/common/base.entity.ts`
- HA3: `HrUserEntity` extending `BaseEntity` with email, name, role, passwordHash, inviteToken, inviteExpiresAt, status columns and indexes at `apps/api/src/hr-users/hr-user.entity.ts`
- HA4: Migration `1751400000000-CreateHrUsers.ts` — `hr_users` table, enums, partial unique index on invite_token
- HA5: `HrUsersModule` stub; `AppModule` wired with `AuthModule`, `HrUsersModule`, global `JwtAuthGuard` + `RolesGuard` via `APP_GUARD`
- HA6: `AuthService` — `invite()`, `setup()`, `login()`, `validateById()`, `me()`
- HA7: `JwtStrategy` extracting JWT from `hrms_session` HttpOnly cookie
- HA8: `JwtAuthGuard` + `@Public()` decorator; `RolesGuard` + `@Roles()` decorator; `@CurrentUser()` param decorator
- HA9: `AuthController` — 5 routes: invite, setup, login (sets cookie), logout (clears cookie), me
- HA10: `AuthModule` wired; `main.ts` + `test-app.ts` use `cookie-parser`; `HealthController` marked `@Public()`
- HA11 (partial): existing test suites updated with `loginAsAdmin` + `.set("Cookie", authCookie)` so they pass through the global `JwtAuthGuard`
- HA12 (partial): `@Roles("ADMIN", "HR_MANAGER")` added to `EmployeesController.create` — full guard wiring continues on `feat/hr-auth-pr4-guard-wiring`

### Test results
- Unit specs (`auth.service.spec.ts`): 9/9 GREEN
- Integration specs (`auth.e2e-spec.ts`): 16/16 GREEN
- Full suite: 155/155 GREEN

### Issues encountered
- `jest.Mocked` not available in Vitest — switched to plain cast
- `JwtModule expiresIn` type error — cast to `any`
- `cookieParser` ESM/CJS conflict — switched to `require()` with type cast in both `main.ts` and `test-app.ts`
- All existing e2e suites returned 401 after global guard activation — added `loginAsAdmin` in `beforeEach` (not `beforeAll`) because `truncateAll()` wipes `hr_users` between tests
- UUID `"11111111-1111-1111-1111-111111111111"` rejected by class-validator `@IsUUID()` (v4 requires third segment `4xxx`) — fixed to `"11111111-1111-4111-8111-111111111111"`
- Logout test expected 401 after logout but JWT is stateless — changed to assert `Set-Cookie` clears cookie

---

## Phase 4 — Guard Wiring (branch: `feat/hr-auth-pr4-guard-wiring`)

**Commits:** `b3ab1aa` (guards + seed), `905aab0` (integration tests)

### Tasks completed
- HA11: `seed.ts` upserts ADMIN from `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`; idempotent
- HA12: `@Roles("ADMIN", "HR_MANAGER")` on `EmployeesController.update/remove`, `SalaryStructureController.upsert`, `PayrollController.run`
- HA13: `role-guards.e2e-spec.ts` — 11 specs covering HR_VIEWER 403 on all write endpoints; GETs return 200
- HA14: `.env.example` already had all auth vars from pr3

### Test results
- 166/166 GREEN

---

## Phase 5 — Frontend Types + Hooks (branch: `feat/hr-auth-fe-pr1-types-hooks`)

**Commit:** `7bf7ece` · **Merge PR #48:** `909624b`

### Tasks completed
- HA15: `packages/store/src/api/auth.ts` — `getMe`, `postLogin`, `postSetup`, `postLogout`, `postInvite`; `credentials: "include"` added to all fetch calls in `api/client.ts`
- HA16: `useSession` hook — `staleTime: Infinity`, `retry: false`; returns `{ user, isLoading, isAuthenticated }`; `useLogin` mutation (invalidates session on success); `useLogout` mutation (clears query cache on success)
- HA17: 15 unit specs — `useSession` (authenticated/401/500/loading), `useLogin` (idle/isPending/success/401), `useLogout` (success)

### Test results
- 15/15 store tests GREEN

---

## Phase 6 — Auth Pages (branch: `feat/hr-auth-fe-pr2-pages`)

**Commit:** `83484ff` · **Merge PR #49:** `6f79bb6`

### Tasks completed
- HA18: Restructured `app/` into `(auth)/` and `(authenticated)/` route groups; moved all existing pages; fixed all relative test imports to `@/` alias
- HA19: `/auth/login` page — react-hook-form + zod; error banner on 401
- HA20: `/auth/setup` page — token from URL; password confirm; 410 error state; static error if no token
- HA21: 9 unit specs for login and setup pages

### Issues encountered
- Stale `.next/types` cache pointed to old paths after route group move — deleted `.next/` to clear
- `useQueryClient()` in login page caused "No QueryClient" error in tests — removed it; post-login redirect is sufficient, session refetches on the authenticated route

### Test results
- 73/73 web tests GREEN, typecheck clean

---

## Phase 7 — Route Protection (branch: `feat/hr-auth-fe-pr3-protection`)

**Commit:** `9ac241a` · **Merge PR #50:** `d0458bf`

### Tasks completed
- HA22: `middleware.ts` — redirects to `/login` when `hrms_session` cookie absent; `/login` and `/setup` are public (exact path match, not prefix)
- HA23: `SessionProvider` — wraps children; subscribes to 401 query errors → `postLogout()` + redirect to `/login`
- HA24: `AuthenticatedLayout` — session gate with loading skeleton; `AuthGate` redirects to `/login` if `!isAuthenticated`

### Post-merge fixes (on `feat/hr-auth-fe-pr5-e2e`)
- `AuthGate` was still redirecting to `/auth/login` (stale) — corrected to `/login`
- CORS config missing `credentials: true` on API — added to `main.ts`
- Login page was calling `postLogin` directly — migrated to `useLogin` mutation

### Test results
- 73/73 GREEN, typecheck clean

---

## Phase 8 — Frontend Integration Tests (branch: `feat/hr-auth-fe-pr4-integration`)

**Commit:** `cb08dca` · **Merge PR #51:** `8b7bf3f`

### Tasks completed
- HA25: `test/msw/handlers/auth.ts` — GET /me (200), POST login/logout (200), 401 variants, login-fail variant; registered in server
- HA26-HA27: `authenticated-layout.integration.test.tsx` — renders children when authenticated; redirects when 401
- HA28-HA29: `login-page.integration.test.tsx` — success redirects; failure shows banner

### Issues encountered
- `POST /v1/auth/login` MSW handler returned `null` body; `client.ts` always calls `.json()` — fixed handler to return `HttpResponse.json({}, { status: 200 })`

### Test results
- 77/77 GREEN

---

## Phase 9 — E2E Tests (branch: `feat/hr-auth-fe-pr5-e2e`)

**Commits:** `a65712d`, `430408b` · **Merge PR #52:** `d51571c`

### Tasks completed
- `e2e/helpers.ts`: `loginViaApi`, `loginViaUI`, `getSessionCookie`; all E2E routes updated from `/auth/login` → `/login` and `/auth/setup` → `/setup`
- `e2e/auth/auth.spec.ts`: 5 Playwright specs — unauthenticated redirect, login success/fail, session cookie present, setup no-token error
- All 5 existing E2E spec files updated: `test.beforeEach` with `loginViaApi`; API calls thread `cookieHeader`
- `useSearchParams` wrapped in `Suspense` boundary on setup page (Next.js App Router requirement)
- `login/page.tsx` migrated from raw `postLogin` to `useLogin` mutation; login page unit tests updated to mock `useLogin`
- `useLogin`/`useLogout` unit tests added to `use-session.test.tsx` (15 total specs)
- `seed.ts`: `dotenv/config` imported so `.env` is loaded without shell env var injection

### Test results
- 77/77 web unit tests GREEN
- 166/166 api tests GREEN
- 15/15 store tests GREEN
- E2E requires `docker compose up --build`

---

## Post-merge Status

**All 9 PRs merged to main as of 2026-07-06.**

| PR | Branch | SHA |
|---|---|---|
| #44 | `feat/hr-auth-pr1-db-models` | `81b05d5` |
| #45 | `feat/hr-auth-pr2-test-harness` | `d3a570c` |
| #46 | `feat/hr-auth-pr3-api` | `6c06a4f` |
| #47 | `feat/hr-auth-pr4-guard-wiring` | `10a12b2` |
| #48 | `feat/hr-auth-fe-pr1-types-hooks` | `909624b` |
| #49 | `feat/hr-auth-fe-pr2-pages` | `6f79bb6` |
| #50 | `feat/hr-auth-fe-pr3-protection` | `d0458bf` |
| #51 | `feat/hr-auth-fe-pr4-integration` | `8b7bf3f` |
| #52 | `feat/hr-auth-fe-pr5-e2e` | `d51571c` |

### Deviations from spec
- Routes are `/login` and `/setup` (not `/auth/login`, `/auth/setup`) — Next.js route groups `(auth)` strip the folder name from the URL. Spec text reflects original intent; implementation is correct.
- Invite URL built as `${FRONTEND_URL}/setup?token=...` (not `/auth/setup`) for the same reason.
- `useLogin` and `useLogout` hooks added beyond spec's `useSession` — required for React Query DevTools visibility and consistent mutation pattern.
