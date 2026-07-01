# Performance Review Checklist

Detailed companion to the Performance axis of `SKILL.md`. Apply these when a change touches data access, loops over collections, rendering, or hot paths. Measure before optimizing — quantify findings ("this adds ~50ms per item") rather than guessing.

## Data Access

- [ ] No N+1 query patterns — related data is batched, joined, or eager-loaded.
- [ ] List/collection endpoints are paginated (limit + cursor/offset); no unbounded result sets.
- [ ] Queries hit indexes for their filter/sort columns; no accidental full-table scans on large tables.
- [ ] Only needed columns/fields are selected — not `SELECT *` where the row is wide.
- [ ] Writes that touch many rows are batched rather than issued one-per-item in a loop.
- [ ] Repeated identical reads within a request are cached/memoized rather than re-fetched.

## Loops & Algorithms

- [ ] No nested loops over large collections that could be a map/set lookup (O(n²) → O(n)).
- [ ] No unbounded loops driven by external input (potential DoS).
- [ ] Work is done once and reused, not recomputed inside a loop.
- [ ] Large collections are streamed/paginated rather than fully materialized in memory.

## Concurrency & I/O

- [ ] Independent async operations run concurrently (e.g., `Promise.all`) rather than serially awaited.
- [ ] Blocking/synchronous operations (fs, crypto, large JSON parse) aren't on a hot request path.
- [ ] External calls have timeouts and sensible retry/backoff — no unbounded hangs.
- [ ] Connection pools (DB, HTTP) are reused, not created per request.

## Memory & Allocation

- [ ] No large objects/buffers allocated in hot paths or per-item in a big loop.
- [ ] No unintentional retention (closures capturing large scopes, caches without eviction, growing arrays).
- [ ] Streaming is used for large payloads/files instead of buffering entirely in memory.

## Frontend / UI (if applicable)

- [ ] No unnecessary re-renders — expensive components are memoized; stable props/keys are used.
- [ ] Expensive computations are memoized (`useMemo`) and callbacks stabilized (`useCallback`) where it matters.
- [ ] Long lists are virtualized.
- [ ] Bundle impact of new dependencies is checked; heavy imports are code-split/lazy-loaded.
- [ ] Images/assets are appropriately sized and lazy-loaded.

## Caching

- [ ] Cacheable responses set appropriate cache headers / use a cache layer.
- [ ] Cache keys are correct (no cross-user leakage) and invalidation is handled.

## Verdict

- [ ] No unaddressed performance regression on a hot path.
- [ ] Any known trade-off is documented (e.g., "acceptable for current scale; revisit at N× load").
- [ ] Claims are backed by measurement (benchmark, profile, or complexity reasoning), not speculation.
