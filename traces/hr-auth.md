# HR Auth — Execution Trace

Spec: `docs/specs/hr-auth.md`
Plan: `docs/plans/hr-auth.md`

---

## Phase 1 — DB Models (branch: `feat/hr-auth-pr1-db-models`)

_Pending commit_

---

## Phase 2 — Test Harness / RED (branch: `feat/hr-auth-pr2-test-harness`)

_Pending commit_

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

_Pending_

---

## Phase 5 — Frontend Types + Hooks (branch: `feat/hr-auth-fe-pr1-types-hooks`)

_Pending_

---

## Phase 6 — Auth Pages (branch: `feat/hr-auth-fe-pr2-pages`)

_Pending_

---

## Phase 7 — Route Protection (branch: `feat/hr-auth-fe-pr3-protection`)

_Pending_

---

## Phase 8 — Frontend Integration Tests (branch: `feat/hr-auth-fe-pr4-integration`)

_Pending_

---

## Phase 9 — E2E Tests (branch: `feat/hr-auth-fe-pr5-e2e`)

_Pending_
