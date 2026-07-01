# AGENTS.md — `packages/config`

Shared tooling presets for the monorepo — **configuration only**, no application code.

## Exports

| Subpath | Contents |
|---|---|
| `@salary-mgmt/config/typescript/base` | Strict TS baseline |
| `@salary-mgmt/config/typescript/node` | NestJS / Node apps |
| `@salary-mgmt/config/typescript/nextjs` | Next.js apps |
| `@salary-mgmt/config/typescript/react-library` | React library packages (ui, store) |
| `@salary-mgmt/config/eslint/base` | ESLint flat config baseline |
| `@salary-mgmt/config/prettier` | Prettier defaults |
| `@salary-mgmt/config/tailwind` | Tailwind preset (shadcn tokens + animate plugin) |

## Commands

No build step — consumed directly via `extends` / `import` in apps and packages.

```bash
pnpm --filter @salary-mgmt/config typecheck   # noop; participates in turbo pipeline
```

## Conventions

- Changes here affect **every** app and package — keep diffs minimal and intentional.
- Prefer extending `typescript/base.json` over duplicating compiler options.
- Document breaking preset changes in an ADR or root spec update.

## Boundaries

- No runtime dependencies, no business logic, no domain types.
- Do not add app-specific config — belongs in the app's own config file.

## Agent workflow

Ask before changing shared presets. After edits, run root `pnpm typecheck` across the workspace.

Root spec: [`docs/spec.md`](../../docs/spec.md)
