# AGENTS.md — `apps/web`

Next.js frontend (App Router) for the Employee Salary Management System.

## Owns

- `app/` — routes (employees, payroll, payslips as domain specs land)
- `lib/` — API wiring, app-specific client utils
- `components/` — app-level composed components (not shadcn primitives)

Shared UI primitives live in `@salary-mgmt/ui`. Client data layer lives in `@salary-mgmt/store`.

Employee list UI is co-owned with [`docs/specs/employees.md`](../../docs/specs/employees.md). Other screens follow their domain specs.

Root spec: [`docs/spec.md`](../../docs/spec.md) · Scaffolding: [`docs/specs/scaffolding.md`](../../docs/specs/scaffolding.md)

## Stack

Next.js 14+ (App Router) · React 18 · `@salary-mgmt/ui` (shadcn/Radix) · `@salary-mgmt/store` (TanStack Query + Zustand) · Vitest + Testing Library

## Commands

```bash
# From repo root
pnpm --filter web dev          # http://localhost:3000
pnpm --filter web build
pnpm --filter web test
pnpm --filter web typecheck

# API must be reachable for pages that call it
NEXT_PUBLIC_API_URL=http://localhost:3001   # see .env.example
```

## Conventions

- **Server components by default;** `"use client"` only when needed (interactivity, hooks).
- **Shared types:** import from `@salary-mgmt/types` — no duplicated API response shapes.
- **UI primitives:** import from `@salary-mgmt/ui` or subpaths (e.g. `@salary-mgmt/ui/button`).
- **Data fetching:** use `@salary-mgmt/store/query` for TanStack Query; domain hooks live in `@salary-mgmt/store/features/<domain>`.
- **Errors:** use `@salary-mgmt/errors` for user-facing message maps.
- **Config:** use `next.config.mjs` (not `.ts`) on Next.js 14; `output: "standalone"` for Docker; `transpilePackages` includes ui/store/errors.
- **Tailwind:** `content` must include `../../packages/ui/src/**/*.{ts,tsx}`.

## Boundaries

- No auth/RBAC in MVP — single trusted HR operator assumed.
- Do not store money as floats in UI state; display formatted values from minor-unit integers.
- Do not implement screens or flows not covered by a spec or plan task.
- Do not add shadcn components to `apps/web/components/ui/` — add them to `@salary-mgmt/ui`.

## Agent workflow

Read the relevant domain spec → plan task → implement → `pnpm typecheck && pnpm lint && pnpm test` → commit → append trace.

Rules: [`.ai/rules/`](../../.ai/rules/) · Skills: [`docs/README.md`](../../docs/README.md#agent-tooling)
