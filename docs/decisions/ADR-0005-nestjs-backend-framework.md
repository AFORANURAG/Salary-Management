# ADR-0005: Use NestJS for the backend framework

## Status

Accepted

## Date

2026-07-02

## Context

The API (`apps/api`) backs a domain-heavy HR payroll system: employee CRUD, effective-dated salary structures, deterministic payroll runs, payslip history, and aggregate reporting over ~10,000 employees. Requirements from [`requirements.md`](../requirements.md) and [`spec.md`](../spec.md):

- TypeScript strict mode with testable domain logic separated from HTTP/ORM wiring
- Clear module boundaries per domain area (`employees`, `salary`, `payroll`, `payslips`, `reporting`)
- Dependency injection so services, repositories, and pure calculators can be unit- and integration-tested in isolation
- First-class PostgreSQL + TypeORM integration with migrations
- Predictable project structure so multiple contributors (and agents) can navigate the codebase without inventing conventions

The requirements document already selected NestJS at a high level; this ADR records **why** in architectural terms.

## Decision

Use **NestJS 10+** as the backend framework for `apps/api`.

## Rationale

### SOLID-friendly design

NestJS maps naturally to SOLID principles for a multi-module payroll system:

| Principle | How NestJS supports it |
|---|---|
| **Single Responsibility** | Each domain lives in its own Nest module (`EmployeesModule`, `PayrollModule`, …) with a focused controller, service, and entity layer |
| **Open/Closed** | New domains add modules without modifying existing ones; cross-cutting concerns (pipes, filters, guards) extend behavior via decorators and providers |
| **Liskov Substitution** | Services depend on interfaces/tokens; test doubles swap in via the DI container |
| **Interface Segregation** | Providers export narrow, injectable contracts rather than monolithic “god services” |
| **Dependency Inversion** | Constructor injection inverts dependencies — controllers depend on service abstractions, services depend on repository interfaces, not concrete wiring |

Payroll logic (pure calculation, effective-dated resolution) stays in testable functions; NestJS handles composition at the edges.

### Out-of-the-box structure

NestJS provides an opinionated, scalable layout without bespoke scaffolding:

- **Modules** — bounded contexts with explicit imports/exports
- **Controllers** — thin HTTP adapters (validation at the boundary, no business rules)
- **Providers / Services** — injectable domain and application services
- **Pipes, filters, interceptors** — centralized validation, error shaping, logging
- **Guards** — ready for future auth/RBAC without restructuring

This matches the spec’s module folders under `apps/api/src/` and keeps framework wiring separate from domain code.

### TypeScript-first ergonomics

- Decorators + metadata for declarative module wiring
- Strong typing for DTOs, entities, and service contracts
- Aligns with the monorepo’s shared `@salary-mgmt/types` contracts

### Testability

- `@nestjs/testing` builds isolated module graphs for integration tests
- Services unit-test without HTTP by mocking injected dependencies
- Works with Vitest ([ADR-0003](./ADR-0003-vitest-backend-test-runner.md)) for a unified test runner across the monorepo

### Ecosystem fit

- Official `@nestjs/typeorm` module for PostgreSQL
- Conventional file naming (`*.module.ts`, `*.service.ts`, `*.controller.ts`, `*.entity.ts`) documented in root spec
- Mature patterns for migrations, seed scripts, and Docker deployment

## Alternatives Considered

### Express (minimal, unopinionated)

- Pros: Lightweight, familiar, maximum flexibility
- Cons: No built-in module/DI structure; every team invents its own layout; harder to keep controllers thin and domain logic testable at scale
- Rejected: Payroll MVP needs five domain modules plus shared plumbing — structure should be given, not reinvented

### Fastify (standalone)

- Pros: High performance, good plugin ecosystem
- Cons: Same structural gap as raw Express; Nest can use Fastify as an adapter but adds complexity without benefit for this MVP’s scale profile
- Rejected: Consistency and structure matter more than raw HTTP throughput for an internal HR tool

### Hono / lightweight handlers only

- Pros: Minimal, modern, fast to prototype
- Cons: No DI, no module system, no NestJS-style integration testing story; poor fit for long-lived domain modules
- Rejected: Underserves testability and multi-module domain growth

### Next.js API routes only (no separate backend)

- Pros: Single deployable, shared types trivially
- Cons: Blurs frontend/backend boundaries; harder to run TypeORM migrations, seeds, and long-running domain jobs; spec explicitly separates `apps/api`
- Rejected: Root spec defines a dedicated NestJS API app

## Consequences

- `apps/api` follows NestJS module conventions; domain specs own filling in each module folder
- DTO validation at controller boundaries via `class-validator` (per root spec)
- Integration tests use `@nestjs/testing` under Vitest
- Future auth/RBAC can layer via guards without restructuring modules
- [`apps/api/AGENTS.md`](../../apps/api/AGENTS.md) documents Nest-specific conventions for agents

## References

- [`requirements.md`](../requirements.md) — original NestJS selection in technology stack
- [`spec.md`](../spec.md) — backend stack, project structure, code style
- [ADR-0003](./ADR-0003-vitest-backend-test-runner.md) — Vitest + `@nestjs/testing`
