// ---------------------------------------------------------------------------
// HR Auth
// ---------------------------------------------------------------------------

export type HrUserRole = "ADMIN" | "HR_MANAGER" | "HR_VIEWER";
export type HrUserStatus = "PENDING_SETUP" | "ACTIVE";

export interface HrUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: HrUserRole;
  readonly status: HrUserStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthMeResponse {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: HrUserRole;
}

export interface InviteRequest {
  readonly email: string;
  readonly name: string;
  readonly role: HrUserRole;
}

export interface InviteResponse {
  readonly inviteToken: string;
  readonly inviteUrl: string;
}

export interface SetupRequest {
  readonly token: string;
  readonly name: string;
  readonly password: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

// ---------------------------------------------------------------------------
// Shared Base
// ---------------------------------------------------------------------------

export interface HealthResponse {
  readonly status: "ok";
  readonly timestamp: string;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Finance",
  "HR",
  "Operations",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export interface Employee {
  readonly id: string;
  readonly employeeCode: string;
  readonly name: string;
  readonly email: string;
  readonly department: Department;
  readonly designation: string;
  readonly country: string;
  readonly currency: string;
  readonly joiningDate: string;
  readonly employmentStatus: EmploymentStatus;
  readonly costCenter: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateEmployeeInput {
  readonly employeeCode: string;
  readonly name: string;
  readonly email: string;
  readonly department: Department;
  readonly designation: string;
  readonly country: string;
  readonly currency: string;
  readonly joiningDate: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly costCenter?: string | null;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "employeeCode",
  "email",
  "department",
  "country",
  "joiningDate",
  "employmentStatus",
] as const;

export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export type SortDirection = "asc" | "desc";

export interface EmployeeListQuery {
  readonly q?: string;
  readonly department?: readonly Department[];
  readonly country?: readonly string[];
  readonly status?: readonly EmploymentStatus[];
  readonly page?: number;
  readonly pageSize?: number;
  readonly sort?: `${EmployeeSortField}:${SortDirection}`;
}

export const EMPLOYEE_PAGE_SIZE_DEFAULT = 25;
export const EMPLOYEE_PAGE_SIZE_MAX = 100;

// ---------------------------------------------------------------------------
// Salary Structure
// ---------------------------------------------------------------------------

export type ComponentKind = "EARNING" | "DEDUCTION";

export interface SalaryComponent {
  readonly id: string;
  readonly structureId: string;
  readonly code: string;
  readonly kind: ComponentKind;
  readonly amountMinor: number;
}

export interface SalaryStructure {
  readonly id: string;
  readonly employeeId: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly currency: string;
  readonly createdAt: string;
  readonly components: readonly SalaryComponent[];
}

export interface ComponentInput {
  readonly code: string;
  readonly kind: ComponentKind;
  readonly amountMinor: number;
}

export interface UpsertSalaryStructureInput {
  readonly effectiveFrom: string;
  readonly currency: string;
  readonly components: readonly ComponentInput[];
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export interface PayrollResult {
  readonly id: string;
  readonly employeeId: string;
  readonly period: string;
  readonly structureId: string;
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
  readonly currency: string;
  readonly generatedAt: string;
}

export interface PayrollRunSummary {
  readonly period: string;
  readonly processed: number;
  readonly skipped: readonly string[];
  readonly totalGrossMinor: number;
  readonly totalNetMinor: number;
}

export interface PayrollResultQuery {
  readonly employeeId?: string;
}

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

export interface PayslipLineItem {
  readonly code: string;
  readonly kind: ComponentKind;
  readonly amountMinor: number;
}

export interface PayslipSummary {
  readonly period: string;
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
  readonly currency: string;
  readonly generatedAt: string;
}

export interface Payslip {
  readonly period: string;
  readonly generatedAt: string;
  readonly employeeId: string;
  readonly employeeCode: string;
  readonly name: string;
  readonly department: Department;
  readonly country: string;
  readonly currency: string;
  readonly lineItems: readonly PayslipLineItem[];
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type GroupByDimension = "department" | "country" | "costCenter";

export interface PayrollCostGroup {
  readonly key: string;
  readonly headcount: number;
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
}

export interface PayrollCostBucket {
  readonly currency: string;
  readonly groups: readonly PayrollCostGroup[];
}

export interface PayrollCostResponse {
  readonly period: string;
  readonly groupBy: GroupByDimension;
  readonly buckets: readonly PayrollCostBucket[];
}

export interface PayrollSummaryBucket {
  readonly currency: string;
  readonly grossMinor: number;
  readonly deductionsMinor: number;
  readonly netMinor: number;
  readonly headcount: number;
}

export interface PayrollSummaryResponse {
  readonly period: string;
  readonly buckets: readonly PayrollSummaryBucket[];
}
