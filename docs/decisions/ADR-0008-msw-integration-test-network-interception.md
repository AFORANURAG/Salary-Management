# ADR-0008: Use MSW v2 for integration test network interception

## Status

Accepted

## Date

2026-07-03

## Context

Phase 5 of the employees frontend adds integration tests that exercise the full
client-side chain:

```
page component → TanStack Query hook → API function → fetch → network → response
                                                                    ↓
                                              TQ cache → cache invalidation → re-render
```

The unit tests in Phase 2–4 mock at the hook boundary (`vi.mock("@salary-mgmt/store")`).
They verify component rendering given a fabricated hook response, but they do not
verify:

- That `useEmployees` issues a `GET /v1/employees?q=alice` request (correct URL
  and params)
- That `useCreateEmployee` invalidates `employees.lists()` after a successful
  `POST /v1/employees`, causing the list to re-fetch
- That a 5xx from the API propagates through the hook into an error render state

To cover those gaps a test must let the real hooks and API functions run and
intercept at the `fetch` layer instead.

Three options were considered for intercepting `fetch` in jsdom:

1. **`global.fetch` vi mock** — replace `globalThis.fetch` with a `vi.fn()` that
   returns fabricated `Response` objects. Simple for a single endpoint but becomes
   fragile when tests need to assert on URL query params (`?q=alice&department=Engineering`),
   distinguish `GET` vs `POST` to the same base path, or return different responses
   for the initial load vs the re-fetch after mutation. All of that requires
   hand-rolling URL parsing inside test files.

2. **Mock the API module** (`vi.mock("../api/employees")`) — same isolation level
   as unit tests. The hook-to-API wiring and TanStack Query cache invalidation are
   not exercised; does not meet the integration test requirement.

3. **MSW v2 (`msw/node` server)** — intercepts `fetch` at the network layer via
   Node's built-in fetch interceptor (no service worker required in jsdom).
   Handlers are declared as URL patterns with typed request/response helpers.
   Per-test overrides are one `server.use(http.get(...))` call; the server resets
   between tests via `server.resetHandlers()`.

## Decision

Use **MSW v2** (`msw/node`) for integration test network interception in
`apps/web`.

- A shared server is created in `apps/web/test/msw/server.ts`.
- Default handlers live in `apps/web/test/msw/handlers/employees.ts` and cover
  the five employee endpoints with realistic fixture responses.
- The server lifecycle (`beforeAll` / `afterAll` / `afterEach resetHandlers`) is
  wired into `apps/web/vitest.setup.ts`.
- Integration tests live in `apps/web/app/employees/__tests__/integration/` and
  import the server only to override handlers per-test.
- Each integration test creates a fresh `QueryClient` (with `retry: false`) to
  prevent cache bleed between tests.

## Alternatives Considered

### `global.fetch` vi mock

- Pros: No new dependency; built into vitest
- Cons: Requires hand-parsing request URLs and method inside test bodies to route
  responses; verbose and brittle across the 7 integration scenarios
- Rejected: signal-to-noise ratio is poor; URL-pattern matching is MSW's core value

### Mock the API module (same as unit tests)

- Pros: No new dependency; same pattern already used
- Cons: Does not exercise the hook-to-API-to-fetch chain; does not validate cache
  invalidation; not integration testing in any meaningful sense
- Rejected: this option collapses Phase 5 into a duplication of Phase 2–4

### `nock` (HTTP mocking for Node)

- Pros: Mature; no service worker
- Cons: Intercepts Node's `http` module, not the WHATWG `fetch` API used by the
  app; requires the `node-fetch` polyfill or adapter shims in jsdom; MSW v2
  already handles `fetch` natively in Node 18+
- Rejected: extra friction with no advantage over MSW in this stack

## Consequences

- `apps/web/package.json` gains `msw` as a devDependency.
- `apps/web/test/msw/` holds the server and default handlers; these are test
  infrastructure only and are never imported in production code.
- `apps/web/vitest.setup.ts` gains `beforeAll/afterAll/afterEach` server hooks.
- Resolves the ask-first item for `msw` addition in `docs/plans/employees-fe.md`
  (EF17).
