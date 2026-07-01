# AGENTS.md — `packages/ui`

Shared shadcn/ui component library for the web app.

## Purpose

Radix + Tailwind primitives with CSS variable theming. Consumed by `apps/web` and future frontend apps.

## Commands

```bash
pnpm --filter @salary-mgmt/ui typecheck
pnpm --filter @salary-mgmt/ui test
pnpm --filter @salary-mgmt/ui lint
```

## Exports

Subpath exports (e.g. `@salary-mgmt/ui/button`, `@salary-mgmt/ui/lib/utils`, `@salary-mgmt/ui/globals.css`).

## Conventions

- **shadcn copy-into-repo model** — components live here, not in `apps/web`.
- Use `cn()` from `@salary-mgmt/ui/lib/utils` for class merging.
- CSS variables defined in `src/globals.css`; apps import this in their root layout/globals.
- **Tailwind requirement:** consuming apps must include `../../packages/ui/src/**/*.{ts,tsx}` in Tailwind `content`.
- Add new primitives here when multiple routes need them; keep app-specific layout in `apps/web/components/`.

## Boundaries

- No business logic, no API calls, no domain types.
- No finance-os-specific components (chat, hierarchical panels, etc.) unless a spec requires them.
- Peer dependency on React 18+.

## Agent workflow

Add component → export from `src/index.ts` and `package.json` exports → add test → verify web build.

Spec: [`docs/specs/scaffolding.md`](../../docs/specs/scaffolding.md) · ADR: [`docs/decisions/ADR-0004-shared-fe-packages.md`](../../docs/decisions/ADR-0004-shared-fe-packages.md)
