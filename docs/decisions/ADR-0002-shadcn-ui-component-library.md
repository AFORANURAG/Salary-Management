# ADR-0002: Use shadcn/ui for frontend component library

## Status

Accepted

## Date

2026-06-30

## Context

The web app (`apps/web`) needs a component library for employee lists, payslip views, and HR-facing UI. Requirements:

- Works with Next.js App Router and Tailwind CSS (per root spec)
- Accessible, composable primitives suitable for data-heavy internal tools
- Customizable without fighting a heavy design-system lock-in
- Fast to scaffold for MVP

Root spec Open Question #2 asked whether to confirm shadcn/ui over MUI.

## Decision

Use **shadcn/ui** (Radix primitives + Tailwind) as the component library for `apps/web`.

## Alternatives Considered

### Material UI (MUI)

- Pros: Large component catalog, mature data-grid options
- Cons: Heavier bundle, opinionated Material Design aesthetic, more override work for a custom HR tool look
- Rejected: shadcn/ui aligns better with Tailwind-first stack and copy-into-repo ownership model

### Headless UI + custom components only

- Pros: Minimal dependencies
- Cons: More upfront UI work for tables, dialogs, forms needed in MVP screens
- Rejected: shadcn/ui provides ready patterns without full MUI weight

### Chakra UI

- Pros: Good DX, accessible
- Cons: Not Tailwind-native; adds a second styling paradigm alongside Tailwind in the spec
- Rejected: Spec standardizes on Tailwind + shadcn/ui

## Consequences

- `apps/web` initializes shadcn/ui during scaffolding; components live in `apps/web/components/ui/`
- Tailwind preset in `packages/config` can share design tokens where needed
- Resolves root Open Question #2
