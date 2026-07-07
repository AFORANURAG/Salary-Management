# Implementation Plans

Task breakdowns derived from specs in [`../specs/`](../specs/). See the [root README](../../README.md) for how plans fit into the overall documentation layout.

## Plans index

| Plan | Spec | Status |
|---|---|---|
| [scaffolding.md](./scaffolding.md) | [specs/scaffolding.md](../specs/scaffolding.md) | Complete |
| [employees.md](./employees.md) | [specs/employees.md](../specs/employees.md) | Planned |

## How to read a plan

1. **Objective** — what the spec requires, in implementable terms.
2. **Task list** — ordered tasks (T1, T2, …) with dependencies.
3. **Checkpoints** — verification gates between task groups.
4. **Commit sequence** — one logical Conventional Commit per task (see [commit-conventions](../../.ai/rules/commit-conventions.md)).

## How to add a plan

1. Create `docs/plans/<spec-name>.md` mirroring the spec filename in `docs/specs/`.
2. Break work into tasks per the [planning-and-task-breakdown skill](../../.ai/skills/planning-and-task-breakdown/SKILL.md) (user-level: `~/.cursor/skills/planning-and-task-breakdown/SKILL.md`).
3. Add a row to the index table above.
4. Create a matching trace file at [`../../traces/<spec-name>.md`](../../traces/scaffolding.md).
5. Commit plan + trace template together: `docs: add plan for <spec-name>`.

See the [root README](../../README.md) for the full documentation map (specs, plans, ADRs, traces).
