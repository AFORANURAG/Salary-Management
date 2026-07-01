# Definition of Done

The Definition of Done (DoD) is the project-wide bar that **every** task clears before it counts as complete. Unlike per-task acceptance criteria (which answer "did we build the right thing?"), the DoD is the standing quality gate that applies uniformly to all work.

## How DoD Differs from Acceptance Criteria

| | Acceptance Criteria | Definition of Done |
|---|---|---|
| **Scope** | Specific to one task | Applies to every task |
| **Question** | "Did we build the right thing?" | "Did we build it to standard?" |
| **Changes** | Different per task | Stable across the project |
| **Example** | "User can reset password via email link" | "Code is reviewed, tested, and documented" |

A task is only done when it satisfies **both** its acceptance criteria **and** the Definition of Done.

## Default Definition of Done

Adapt this checklist to the project's stack and conventions. Every task must satisfy all applicable items:

### Code
- [ ] Code implements the task's acceptance criteria
- [ ] Code follows existing project patterns and style conventions
- [ ] No commented-out code, debug statements, or stray TODOs left behind
- [ ] No new linter or type errors introduced

### Tests
- [ ] New behavior is covered by automated tests
- [ ] All tests pass locally (unit, integration as applicable)
- [ ] Edge cases and error paths are tested, not just the happy path

### Build & Integration
- [ ] Project builds without errors or warnings
- [ ] Changes integrate cleanly with the main branch (no merge conflicts)
- [ ] The application runs and the affected flow works end-to-end

### Documentation
- [ ] Public APIs, config, and non-obvious decisions are documented
- [ ] README / changelog updated if behavior or setup changed
- [ ] Comments explain *why* for any non-obvious intent (not *what*)

### Review
- [ ] Changes have been self-reviewed (diff read end-to-end)
- [ ] Code has been reviewed by a human or peer agent where required
- [ ] Any review feedback is addressed or explicitly deferred with a note

## Customizing the DoD

Tighten or relax this list based on context:

- **Prototype / spike:** Drop documentation and review gates; keep build + smoke test.
- **Production feature:** Add security review, performance budget, and accessibility checks.
- **Library / public API:** Add semver/version notes, migration guide, and backward-compatibility checks.

Define the project's DoD once, agree on it with the team or user, then hold every task to it.
