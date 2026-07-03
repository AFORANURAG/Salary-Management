# ADR-0007: Store employee list filter/search state in URL search params

## Status

Accepted

## Date

2026-07-03

## Context

The `/employees` list page has several pieces of interactive state:

- Free-text search (`q`)
- Multi-value filters: `department`, `country`, `status`
- Pagination: `page`, `pageSize`
- Sort: `sort` (field + direction)

These can be managed in either local React state or URL search params. The
choice affects shareability, browser navigation, and server-side rendering.

## Decision

Manage all list filter/search/pagination/sort state in **URL search params**
(`useSearchParams` + `useRouter` from `next/navigation`).

The list page is a `"use client"` component. State changes update the URL via
`router.replace` (no history stack pollution); TanStack Query derives its query
from the parsed URL params.

## Alternatives Considered

### Local React state (`useState`)

- Pros: Simpler — no URL serialisation, no router dependency
- Cons: State is lost on navigation or page refresh; links are not shareable;
  browser-back does not restore previous filter state; harder to test with
  snapshot URLs
- Rejected: shareability and browser-back are non-negotiable for a list page
  used daily by HR

### Zustand store

- Pros: Persistent within the session, accessible from anywhere in the tree
- Cons: Still lost on refresh; overkill for ephemeral filter state; adds
  complexity compared to URL params which are already serialisable
- Rejected: URL params satisfy the requirements without extra infrastructure

### Server Component with `searchParams` prop

- Pros: SSR-friendly, no client JS for initial render
- Cons: Every filter change triggers a full server round-trip; filters like
  debounced search would require a client component wrapper anyway; the page
  is already client-heavy (interactive table, dialogs)
- Rejected: the interactivity requirements make a client component the right
  boundary

## Consequences

- The `/employees` page is a `"use client"` component.
- All filter/search/page/sort values are read from `useSearchParams` and written
  via `router.replace`.
- `EmployeeListQuery` is constructed by parsing the current URL params.
- Deep-linking and browser-back work out of the box.
- Resolves the ask-first item in `docs/plans/employees-fe.md` (Architecture
  Decisions).
