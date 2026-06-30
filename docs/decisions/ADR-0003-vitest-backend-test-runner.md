# ADR-0003: Use Vitest for backend unit and integration tests

## Status

Accepted

## Date

2026-06-30

## Context

The backend (`apps/api`) requires unit tests for pure domain logic (payroll calculator, money helpers) and integration tests via `@nestjs/testing`. The root spec lists:

- FE testing: Vitest + Testing Library
- BE testing: `@nestjs/testing` + Vitest **(or Jest)**

Using the same test runner across frontend and shared packages reduces tooling duplication and keeps CI configuration simpler.

Root spec Open Question #7 asked whether to use Vitest or Jest (NestJS default).

## Decision

Use **Vitest** as the test runner for `apps/api`, `packages/money`, and shared packages. Use `@nestjs/testing` for Nest module integration tests under Vitest.

## Alternatives Considered

### Jest (NestJS default)

- Pros: Official NestJS docs and schematics assume Jest; large ecosystem
- Cons: Second test runner alongside Vitest in `apps/web`; slower cold starts in some monorepo setups
- Rejected: Unified Vitest across the monorepo outweighs default-scaffold convenience

### Jest for API, Vitest for web only

- Pros: Follows Nest CLI defaults exactly
- Cons: Duplicate config (`jest.config`, `vitest.config`), split CI test commands, inconsistent DX
- Rejected: Single runner preferred for MVP maintainability

## Consequences

- `apps/api` uses `vitest.config.ts` and `*.spec.ts` beside source
- Root `pnpm test` runs Vitest via Turborepo across packages and apps
- NestJS e2e tests in `apps/api/test` also run under Vitest where applicable
- Resolves root Open Question #7
