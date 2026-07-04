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
