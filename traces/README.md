# Agent Execution Traces

Append-only logs of agent work per spec. Traces are **observability artifacts** (Layer 5) — they live outside `docs/` because they record *what happened during execution*, not authored requirements.

## Index

| Trace | Spec | Plan |
|---|---|---|
| [scaffolding.md](./scaffolding.md) | [specs/scaffolding.md](../docs/specs/scaffolding.md) | [plans/scaffolding.md](../docs/plans/scaffolding.md) |

## Trace entry format

Each task produces one entry, committed **atomically** with the task's git commit.

```markdown
### [Task ID] — [short title]

| Field | Value |
|---|---|
| **Spec** | `docs/specs/<name>.md` |
| **Date** | YYYY-MM-DD |
| **Model** | (best-effort) |
| **Skills / rules** | links to skills and `.cursor/rules/*` applied |
| **Tools / commands** | shell commands, MCP tools, key file edits |
| **Files modified** | list of paths |
| **Verification** | typecheck / lint / test results |
| **Commit** | `<sha>` — `<message>` |
| **Tokens** | (best-effort) |
| **Notes / learnings** | failures, workarounds, spec-intent observations |
```

## Evaluation vs spec intent

Tests check **behaviour**. Traces also record **intent** — whether the work satisfied architectural constraints in the spec (e.g. money as integer minor units, no domain logic in scaffolding). At spec closeout, map Non-Negotiable Test Cases and Success Criteria to results in a checklist at the bottom of the trace file.

## Agent tooling and skills

Referenced by path — content is not duplicated here.

| Purpose | Path |
|---|---|
| Spec authoring | `~/.cursor/skills/spec-driven-development/SKILL.md` |
| Task breakdown | `~/.cursor/skills/planning-and-task-breakdown/SKILL.md` |
| ADRs + READMEs | `.cursor/skills/documentation-and-adrs/SKILL.md` (project) |
| Commits + branching | `~/.cursor/skills/git-workflow-and-versioning/SKILL.md` |
| Tests | `~/.cursor/skills/test-driven-development/SKILL.md` |
| Traces / observability | `~/.cursor/skills/observability-and-instrumentation/SKILL.md` |
| Security / boundaries | `~/.cursor/skills/security-and-hardening/SKILL.md` |

Codified rules: [commit-conventions](../.cursor/rules/commit-conventions.mdc), [spec-driven-workflow](../.cursor/rules/spec-driven-workflow.mdc).

## Feedback loop

What traces observe → `.cursor/rules/` encodes → future sessions benefit. Update rules when patterns, failures, or workarounds recur.
