# ADR-0001: Use pnpm + Turborepo for monorepo tooling

## Status

Accepted

## Date

2026-06-30

## Context

The Employee Salary Management System is a TypeScript monorepo with two apps (`apps/web`, `apps/api`) and shared packages (`packages/types`, `packages/config`, `packages/money`). We need a package manager and build orchestrator that support:

- Workspace-aware dependency linking between apps and packages
- Cached, parallel task execution (`dev`, `build`, `lint`, `typecheck`, `test`)
- Reproducible installs suitable for CI and Docker
- Alignment with the root spec baseline (pnpm 9, turbo 2, Node 20 LTS)

Root spec Open Question #1 asked whether to confirm pnpm vs npm/yarn.

## Decision

Use **pnpm 9** as the package manager and **Turborepo 2** as the task runner/orchestrator.

## Alternatives Considered

### npm workspaces

- Pros: Zero extra tooling, ships with Node
- Cons: Slower installs at scale, weaker disk deduplication, no first-class task caching pipeline
- Rejected: pnpm + turbo better match the 10k-employee scale and multi-app workflow in the spec

### Yarn (Berry / classic)

- Pros: Mature workspace support
- Cons: Team baseline already assumes pnpm; adds choice friction without clear upside for this stack
- Rejected: Spec and scaffolding plan already assume pnpm

### Nx instead of Turborepo

- Pros: Richer generators and graph tooling
- Cons: Heavier configuration for an MVP scaffold; spec explicitly names Turborepo
- Rejected: Turborepo is sufficient for dev/build/lint/test orchestration at MVP scope

## Consequences

- Root commands in `docs/spec.md` use `pnpm` and `turbo` (`pnpm dev`, `pnpm build`, etc.)
- CI and Dockerfiles install with `pnpm install --frozen-lockfile`
- Shared packages are linked via `pnpm-workspace.yaml` and consumed with `workspace:*` protocol
- Resolves root Open Question #1
