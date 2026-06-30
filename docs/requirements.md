# Employee Salary Management System — Requirements Document

## 1. Goal
Replace ACME's spreadsheet-based salary management with a web-based system that lets an **HR Manager** confidently manage salary data for ~10,000 employees and answer questions about how the organization pays its people — accurately, quickly, and at scale.

The system should make it easy to answer practical compensation questions such as:
- What is our monthly payroll cost by department/country/cost center?
- What is the salary breakdown (basic, allowances, deductions, net) for a specific employee?
- What did we pay a specific employee over past pay periods?
- Can we quickly find and review employee salary records with search and filters?

## 2. User Persona
**HR Manager** (primary and only MVP persona)  
Responsible for maintaining employee and salary records, running payroll, generating payslips, and reviewing salary history/reporting.  
Assumes a trusted internal operator model (not employee self-service).

## 3. Success Criteria
- Manage 10,000 employees with responsive server-side search, filter, and pagination.
- Run payroll for a pay period and generate deterministic per-employee results.
- Generate payslips and preserve salary history so past payroll can be reconstructed.
- Provide core operational visibility into compensation (employee-level and aggregate views).
- Deliver maintainable, tested software with seeded data and deployable setup.

## 4. In-Scope Features

| Area | Description |
|---|---|
| **Employee Management** | CRUD for employee records: name, employee code, email, department, designation, country, currency, joining date, employment status. |
| **Salary Structure Management** | Per-employee salary structure with **basic salary, allowances, and deductions**. Effective-dated/versioned structures so updates do not overwrite historical truth. |
| **Payroll Generation** | Monthly payroll generation for selected pay period. Compute gross, deductions, and net pay from active structure. Idempotent per `(employee, period)`. |
| **Payslip Generation & Salary History** | Payslip view per employee per pay period with line-item breakdown and persistent historical record. |
| **Search, Filtering, Pagination** | Server-side search (name/code/email), filter (department/country/status), pagination optimized for 10k+ records. |
| **Scalable Architecture** | Indexed relational schema, paginated APIs, normalized salary components, clear frontend/backend separation. |

## 5. Technology Stack (and Why)

- **Monorepo: Turborepo**  
  Selected to keep frontend and backend in one repo while enabling shared types/contracts, clear package boundaries, and fast cached builds. This improves coordination and iteration speed.

- **Frontend: Next.js + Component Library (shadcn/ui or MUI)**  
  Next.js provides a production-ready React framework with routing and scalable app structure.  
  A component library accelerates UI development, enforces consistency, and reduces custom UI overhead.

- **Backend: NestJS**  
  Chosen for strong modular architecture, dependency injection, TypeScript-first ergonomics, and excellent testability—well-suited for domain-heavy business logic like payroll.

- **Database: PostgreSQL (Relational)**  
  Payroll data is strongly relational and consistency-critical. PostgreSQL provides ACID guarantees, robust indexing, and reliable aggregation/query capabilities.

- **ORM: TypeORM**  
  Integrates naturally with NestJS, supports entity-driven modeling and migrations, and keeps schema/data-access manageable for iterative development.

- **Containerization: Docker**  
  Ensures consistent local/dev/CI/deployment environments and reproducible setup for reviewers.

- **Testing: Vitest + Testing Library (Frontend), `@nestjs/testing` (Backend)**  
  Enables fast, deterministic, maintainable tests focused on critical behavior and regression safety.

## 6. Out of Scope (Deliberately Excluded)

- **Tax filings / statutory compliance reports** — jurisdiction-heavy domain (country-specific laws and filing formats) beyond MVP scope.
- **Variable CTC components (bonuses, incentives)** — needs complex policy, eligibility, and prorated calculations.
- **Statutory compliance engine** — no automated PF/ESIC/PT/gratuity/TDS computation.
- **Country-specific tax rule engine** — no dynamic tax regime calculations.
- **Payment gateway / bank disbursement integration** — system computes payroll; it does not execute salary transfers.
- **Leave, attendance, shift, overtime management** — payroll does not depend on attendance-time systems in MVP.
- **Authentication, authorization, and RBAC** — single trusted HR operator assumption for MVP.
- **Audit logging (full immutable audit trail)** — no system-wide maker-checker grade auditing beyond versioned salary records.
- **Notifications** — no email/SMS/push payroll alerts.
- **Employee Self-Service (ESS)** — no employee portal for payslips/forms/claims.
- **Advanced analytics dashboards** — no BI-grade reporting/visualizations.
- **PDF export of payslips** — in-app payslip view supported; PDF export treated as stretch enhancement.

## 7. Key Assumptions
- Payroll is processed on a monthly cycle.
- One active salary structure per employee per pay period.
- Currency amounts are stored in minor units (integers) to avoid floating-point errors.
- Data is managed internally by trusted HR operations users.
- Core objective is correctness and traceability of payroll records, not full compliance automation.

## 8. Non-Functional Considerations
- **Performance:** indexed query paths, server-side pagination/filtering, efficient batch payroll processing for 10k employees.
- **Correctness:** deterministic payroll calculations, idempotent payroll runs, historical reconstruction via effective-dated structures.
- **Scalability:** architecture and schema designed to grow from MVP without major rewrites.
- **Maintainability:** modular code organization, shared typed contracts, readable domain logic, meaningful test coverage on core flows.
- **Reliability:** predictable deployment/runtime via containerization and repeatable seed/test setup.