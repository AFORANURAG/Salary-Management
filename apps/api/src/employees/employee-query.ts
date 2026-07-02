import { BadRequestException } from "@nestjs/common";
import {
  EMPLOYEE_PAGE_SIZE_DEFAULT,
  EMPLOYEE_PAGE_SIZE_MAX,
  EMPLOYEE_SORT_FIELDS,
  type EmployeeSortField,
  type EmploymentStatus,
  type SortDirection,
} from "@salary-mgmt/types";

export interface NormalizedEmployeeQuery {
  readonly q?: string;
  readonly department: readonly string[];
  readonly country: readonly string[];
  readonly status: readonly EmploymentStatus[];
  readonly page: number;
  readonly pageSize: number;
  readonly sortField: EmployeeSortField;
  readonly sortDirection: SortDirection;
}

/** Raw query params as received from the HTTP layer (all strings / string[]). */
export interface RawEmployeeQuery {
  q?: string;
  department?: string | string[];
  country?: string | string[];
  status?: string | string[];
  page?: string;
  pageSize?: string;
  sort?: string;
}

const VALID_STATUSES: readonly EmploymentStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
];

function toArray(value?: string | string[]): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function parsePositiveInt(value: string | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new BadRequestException(`Invalid ${field}: ${value}`);
  }
  return n;
}

export function parseEmployeeListQuery(
  raw: RawEmployeeQuery,
): NormalizedEmployeeQuery {
  const page = parsePositiveInt(raw.page, "page") ?? 1;

  const requestedPageSize = parsePositiveInt(raw.pageSize, "pageSize") ?? EMPLOYEE_PAGE_SIZE_DEFAULT;
  const pageSize = Math.min(requestedPageSize, EMPLOYEE_PAGE_SIZE_MAX);

  let sortField: EmployeeSortField = "name";
  let sortDirection: SortDirection = "asc";
  if (raw.sort !== undefined) {
    const [field, direction] = raw.sort.split(":");
    if (!EMPLOYEE_SORT_FIELDS.includes(field as EmployeeSortField)) {
      throw new BadRequestException(`Invalid sort field: ${field}`);
    }
    if (direction !== "asc" && direction !== "desc") {
      throw new BadRequestException(`Invalid sort direction: ${direction}`);
    }
    sortField = field as EmployeeSortField;
    sortDirection = direction;
  }

  const status = toArray(raw.status).filter((s): s is EmploymentStatus =>
    VALID_STATUSES.includes(s as EmploymentStatus),
  );

  return {
    q: raw.q?.trim() ? raw.q.trim() : undefined,
    department: toArray(raw.department),
    country: toArray(raw.country),
    status,
    page,
    pageSize,
    sortField,
    sortDirection,
  };
}
