# Implementation Plan: Scaffolding

> Source spec: [`../specs/scaffolding.md`](../specs/scaffolding.md) · Trace log: [`../../traces/scaffolding.md`](../../traces/scaffolding.md)

## Overview

Stand up an empty-but-runnable monorepo matching the root spec: pnpm + Turborepo, NestJS API, Next.js web, shared packages, Docker, CI, and base tooling. One logical Conventional Commit per task; trace entries ship atomically with each task commit.

## Architecture decisions (locked)

- [ADR-0001](../decisions/ADR-0001-pnpm-turborepo-monorepo.md) — pnpm + Turborepo
- [ADR-0002](../decisions/ADR-0002-shadcn-ui-component-library.md) — shadcn/ui
- [ADR-0003](../decisions/ADR-0003-vitest-backend-test-runner.md) — Vitest for backend

## Task list

### Phase 0 — Decisions

- [x] ADR-0001: pnpm + Turborepo
- [x] ADR-0002: shadcn/ui
- [x] ADR-0003: Vitest backend test runner

### Phase 1 — Workflow infrastructure

- [x] `docs/plans/`, `docs/decisions/`, `traces/`, `.cursor/rules/`
- [x] READMEs + commit/spec-driven rules
- [x] This plan + trace template

### Phase 2 — Scaffolding (dependency order)

| Task | Description | Commit |
|---|---|---|
| T1 | Repo root: `pnpm-workspace.yaml`, root `package.json`, `.gitignore`, `.nvmrc`, `.npmrc` | `chore: initialize pnpm and turborepo monorepo` |
| T2 | `turbo.json` pipeline + root scripts | `chore: configure turbo pipeline and root scripts` |
| T3 | `packages/config` — tsconfig, eslint, prettier, tailwind presets | `chore(config): add shared tsconfig, eslint, prettier presets` |
| T4 | `packages/types` stub | `chore(types): add shared FE/BE contract types package` |
| T5 | `packages/money` — minor-unit helpers + Vitest | `feat(money): add minor-unit money helpers` |
| T6 | `apps/api` NestJS + `/health` + empty module folders | `feat(api): scaffold nestjs app with health endpoint` |
| T7 | TypeORM datasource, migrations, seed entrypoint | `chore(api): wire typeorm datasource, migrations, seed entrypoint` |
| T8 | `apps/web` Next.js + Tailwind + shadcn, home calls `/health` | `feat(web): scaffold next.js app calling api health` |
| T9 | Dockerfiles + `docker-compose.yml` | `chore: add docker-compose and service dockerfiles` |
| T10 | GitHub Actions pipeline | `ci: add github actions pipeline` |
| T11 | Root `README.md` + `.env.example` | `docs: add root readme and env examples` |

## Checkpoints

- **After T2:** `pnpm install` succeeds; `pnpm dev` / `pnpm build` run.
- **After T5:** packages typecheck; `money` tests pass.
- **After T8:** web home reaches api `/health` locally.
- **After T11:** `docker compose up --build` healthy; `pnpm typecheck && pnpm lint && pnpm test` pass.

## Spec closeout

Evaluate against [scaffolding spec](../specs/scaffolding.md) Non-Negotiable Test Cases and Success Criteria; append final trace checklist; distill learnings into `.cursor/rules/`.
