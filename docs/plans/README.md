# Implementation Plans

Task breakdowns derived from specs in [`../specs/`](../specs/). Each plan defines ordered tasks, acceptance criteria, checkpoints, and the intended commit sequence for one spec.

## Plans index

| Plan | Spec | Status |
|---|---|---|
| [scaffolding.md](./scaffolding.md) | [specs/scaffolding.md](../specs/scaffolding.md) | Complete |

## How to read a plan

1. **Objective** — what the spec requires, in implementable terms.
2. **Task list** — ordered tasks (T1, T2, …) with dependencies.
3. **Checkpoints** — verification gates between task groups.
4. **Commit sequence** — one logical Conventional Commit per task (see [commit-conventions](../../.cursor/rules/commit-conventions.mdc)).

## How to add a plan

1. Create `docs/plans/<spec-name>.md` mirroring the spec filename in `docs/specs/`.
2. Break work into tasks per the [planning-and-task-breakdown skill](../../.cursor/skills/planning-and-task-breakdown/SKILL.md) (user-level: `~/.cursor/skills/planning-and-task-breakdown/SKILL.md`).
3. Add a row to the index table above.
4. Create a matching trace file at [`../../traces/<spec-name>.md`](../../traces/scaffolding.md).
5. Commit plan + trace template together: `docs: add plan for <spec-name>`.

## Relationship to other docs

| Artifact | Location | Purpose |
|---|---|---|
| Spec | `docs/specs/*.md` | **What** to build (requirements, rules, success criteria) |
| Plan | `docs/plans/*.md` | **How** to build it (tasks, order, commits) |
| Trace | `traces/*.md` | **What happened** during agent execution |
| ADR | `docs/decisions/ADR-*.md` | **Why** a technical choice was made |
