---
description: Spec-driven development workflow — specs, plans, traces, evaluation, and skill references.
globs:
alwaysApply: true
---

# Spec-Driven Workflow

## Layers

1. **Specs** (`docs/specs/*.md`) — what to build; source of truth.
2. **Plans** (`docs/plans/*.md`) — ordered tasks, checkpoints, commit sequence.
3. **Rules** (`.cursor/rules/*.mdc`) — codified conventions (this file, commit-conventions).
4. **Implementation** — code in `apps/*`, `packages/*`.
5. **Traces** (`traces/*.md`) — what the agent did; observability and spec-intent evaluation.

## Per-task workflow

1. Read the spec and plan task.
2. Implement the smallest complete slice for that task.
3. Verify: `pnpm typecheck && pnpm lint && pnpm test` (as applicable).
4. Commit with Conventional Commits (see `commit-conventions.mdc`).
5. Append a trace entry to `traces/<spec>.md` **in the same commit**, including commit SHA.
6. At checkpoints, evaluate against spec intent — not just tests.

## Skills (resolved paths)

| Purpose | Path |
|---|---|
| Spec authoring | `~/.cursor/skills/spec-driven-development/SKILL.md` |
| Task breakdown | `~/.cursor/skills/planning-and-task-breakdown/SKILL.md` |
| ADRs + READMEs | `.cursor/skills/documentation-and-adrs/SKILL.md` |
| Commits + branching | `~/.cursor/skills/git-workflow-and-versioning/SKILL.md` |
| Tests | `~/.cursor/skills/test-driven-development/SKILL.md` |
| Observability / traces | `~/.cursor/skills/observability-and-instrumentation/SKILL.md` |
| Security / boundaries | `~/.cursor/skills/security-and-hardening/SKILL.md` |

Record which skills/rules were applied in each trace entry.

## Boundaries (from root spec)

- Ask first: DB schema changes, new dependencies, monorepo structure changes, CI changes.
- Never: commit secrets, use floats for money, skip failing tests without approval, implement undeclared features.

## Feedback loop

Patterns, failures, and workarounds from traces → update `.cursor/rules/` so future sessions improve.
