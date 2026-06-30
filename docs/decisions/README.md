# Architecture Decision Records (ADRs)

Significant technical decisions for the Employee Salary Management System. Each ADR captures context, the decision, alternatives considered, and consequences.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](./ADR-0001-pnpm-turborepo-monorepo.md) | pnpm + Turborepo monorepo tooling | Accepted | 2026-06-30 |
| [ADR-0002](./ADR-0002-shadcn-ui-component-library.md) | shadcn/ui component library | Accepted | 2026-06-30 |
| [ADR-0003](./ADR-0003-vitest-backend-test-runner.md) | Vitest backend test runner | Accepted | 2026-06-30 |

## Lifecycle

```
PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)
```

- Do **not** delete old ADRs — they preserve historical context.
- When a decision changes, add a new ADR that references and supersedes the old one.
- Link ADRs from specs and PRs when a decision affects implementation.

## Adding a new ADR

1. Copy the template from [documentation-and-adrs skill](../../.cursor/skills/documentation-and-adrs/SKILL.md).
2. Number sequentially: `ADR-NNNN-short-title.md`.
3. Add a row to the index table above.
4. Commit with `docs: add ADR-NNNN <short title>`.
