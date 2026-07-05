# Trace: Reporting (Aggregate Compensation)

> Spec: [`docs/specs/reporting.md`](../docs/specs/reporting.md) · Plan: [`docs/plans/reporting.md`](../docs/plans/reporting.md)

Append-only agent execution log. One row per task; ship the entry in the same
commit as the task implementation (include the commit SHA).

---

### Phase 1 — Foundation

Branch: `feat/reporting-pr1-foundation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP1 | | | |
| RP2 | | | |
| RP3 | | | |

### Phase 2 — RED

Branch: `feat/reporting-pr2-test-harness`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP4 | | | |
| RP5 | | | |
| RP6 | | | |
| RP7 | | | |

### Phase 3 — GREEN

Branch: `feat/reporting-pr3-implementation`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RP8 | | | |
| RP9 | | | |
| RP10 | | | |
| RP11 | | | |

### Phase 4 — Frontend: Store hooks + RED specs

Branch: `feat/reporting-fe-pr1-hooks-red`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF1 | | | |
| RF2 | | | |

### Phase 5 — Frontend: Components + page wiring + integration tests

Branch: `feat/reporting-fe-pr2-components`

| Task | Description | Commit | Verification |
|---|---|---|---|
| RF3 | | | |
| RF4 | | | |
| RF5 | | | |
| RF6 | | | |

---

## Spec closeout checklist

| Criterion | Result | Notes |
|---|---|---|
| Grouped totals equal sum of underlying `PayrollResult` rows | | |
| Mixed-currency data reported per currency, not summed across currencies | | |
| Grouping by department / country / costCenter returns correct keys and headcounts | | |
| Reporting page shows grouped cost breakdown with period + groupBy controls | | |
| Summary card shows org-wide totals per currency | | |
| All non-negotiable frontend test cases pass (unit + integration) | | |
| `pnpm typecheck && pnpm lint && pnpm test` green from repo root | | |

## Learnings
