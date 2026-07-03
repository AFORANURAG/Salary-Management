# ADR-0006: Use react-hook-form + zod for frontend form validation

## Status

Accepted

## Date

2026-07-03

## Context

The employees frontend requires create and edit dialogs with multi-field forms
that need:

- Field-level validation before submission (required fields, email format, ISO
  codes, enum membership)
- Server-error mapping onto specific fields (409 conflict on `employeeCode` /
  `email`)
- Minimal re-renders during user input (important for a form with ~10 fields)
- A schema that can be shared or aligned with the existing `@salary-mgmt/types`
  contracts without duplicating them in class-validator style

The stack already uses TypeScript strict mode and Zod is idiomatic for
parse-and-validate patterns in the TS ecosystem.

## Decision

Add **`react-hook-form`** (v7) and **`zod`** to `apps/web`.

- `react-hook-form` owns form state, dirty tracking, and submission handling.
- `zod` schemas define the validation rules; `@hookform/resolvers/zod` bridges
  the two.
- Schemas mirror `CreateEmployeeInput` / `UpdateEmployeeInput` from
  `@salary-mgmt/types` rather than replacing them — zod validates on the client,
  class-validator enforces on the server.

## Alternatives Considered

### Formik + yup

- Pros: Mature, widely used
- Cons: Higher re-render count than react-hook-form; yup offers no advantage over
  zod given the existing TypeScript-first codebase; adds two deps instead of one
  pattern already present in the ecosystem
- Rejected

### Native HTML validation + custom state

- Pros: Zero dependencies
- Cons: No field-level error management, no server-error mapping onto fields,
  significant boilerplate at 10+ fields
- Rejected: insufficient for the dialogs required by the spec

### Server-side only (no client validation)

- Pros: Single source of truth on the server
- Cons: Round-trip latency on every keystroke; spec requires field errors before
  submission; poor UX
- Rejected

## Consequences

- `apps/web/package.json` gains `react-hook-form`, `@hookform/resolvers`, `zod`.
- Employee form validation schemas live in
  `apps/web/app/employees/schemas/employee.schema.ts`.
- Server 409 / 400 responses from the API are mapped to `react-hook-form`
  `setError` calls after mutation failure.
- Resolves the ask-first item in `docs/plans/employees-fe.md` (EF12).
