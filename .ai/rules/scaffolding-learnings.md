---
description: Learnings from scaffolding execution — apply during domain spec work.
globs:
alwaysApply: true
---

# Scaffolding Learnings

Distilled from [`traces/scaffolding.md`](../../traces/scaffolding.md) closeout.

## Local development

- Start Postgres before the API: `docker compose up -d db` then `pnpm dev`.
- API TypeORM connects on boot; `/health` is unavailable without a running database.

## Next.js

- Use `next.config.mjs` (not `.ts`) on Next.js 14 for build compatibility.
- Enable `output: "standalone"` for Docker deployment.

## Vitest

- Use `poolOptions.threads.singleThread: true` in package vitest configs if tinypool teardown errors occur in CI/sandbox.

## Monorepo

- Import `@salary-mgmt/types` from built workspace packages — do not tsconfig-path to `src/` in apps (breaks `rootDir` checks).
- React FE packages (`errors`, `store`, `ui`) export TypeScript source; Next.js transpiles via `transpilePackages` — do not tsconfig-path into their `src/`.
- `@salary-mgmt/config` packages need noop turbo scripts (`build`, `lint`, `typecheck`, `test`) to participate in the pipeline.
- Tailwind preset in `@salary-mgmt/config/tailwind` includes shadcn CSS variable tokens; apps must scan `packages/ui/src/**` in Tailwind `content`.

## Shared FE packages

- `@salary-mgmt/ui` owns shadcn primitives — not `apps/web/components/ui/`.
- `@salary-mgmt/store` infrastructure vs domain: scaffolding owns `query/`, `api/`, `stores/create-store.ts`, `hooks/`; domain specs add `features/<domain>/`.
- UI component tests require `jsdom` in `@salary-mgmt/ui` devDependencies.
- Store package needs `@types/node` for `process.env` in QueryProvider and Zustand devtools.

## Commits

- One logical milestone per commit; trace entry in the same commit as implementation.
- Scaffolding order: root → turbo → packages → apps → docker → ci → docs.
