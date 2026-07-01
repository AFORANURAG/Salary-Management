---
description: Conventional Commits for this monorepo — types, scopes, grouping, and scaffolding order.
globs:
alwaysApply: true
---

# Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commits.

## Format

```
<type>(<scope>): <short description>

<optional body — why, not what>
```

## Types

| Type | Use when |
|---|---|
| `feat` | New functionality (API endpoint, package behaviour, UI slice) |
| `fix` | Bug fix |
| `chore` | Config, tooling, wiring, dependencies (default during scaffolding) |
| `docs` | Documentation, ADRs, plans, traces (when docs-only) |
| `ci` | CI/CD pipeline changes |
| `test` | Tests only (prefer including tests in the `feat`/`fix` commit when co-developed) |
| `refactor` | Behaviour-preserving code change |

## Scopes (match repo layout)

- `(web)` — `apps/web`
- `(api)` — `apps/api`
- `(config)` — `packages/config`
- `(types)` — `packages/types`
- `(money)` — `packages/money`
- `(errors)` — `packages/errors`
- `(store)` — `packages/store`
- `(ui)` — `packages/ui`

Omit scope for repo-wide changes (root turbo, docker-compose, gitignore).

## Grouping rules

1. **One logical unit per commit** — one app, one package, one tooling concern.
2. **Do not micro-commit** — no per-file or per-dependency commits during scaffolding.
3. **Keep each commit working** — verify before commit; repo should install/build where possible.
4. **Trace entries ship with the task commit** — update `traces/<spec>.md` in the same commit as the implementation.
5. **Never commit secrets** — use `.env.example` only.

## Scaffolding commit order

```
root → turbo → packages/config → packages/types → packages/money
  → packages/errors → packages/ui → packages/store
  → apps/api (feat) → apps/api db (chore) → apps/web (feat)
  → docker → ci → docs
```

## Scaffolding type guidance

- `chore` — pnpm workspace, turbo, eslint/tsconfig, TypeORM wiring, docker
- `feat` — money helpers, Nest `/health`, Next.js app shell
- `ci` — GitHub Actions
- `docs` — README, ADRs, env examples

## Message examples

```
chore: initialize pnpm and turborepo monorepo
chore(config): add shared tsconfig, eslint, prettier presets
feat(money): add minor-unit money helpers
feat(api): scaffold nestjs app with health endpoint
feat(web): scaffold next.js app calling api health
ci: add github actions pipeline
```
