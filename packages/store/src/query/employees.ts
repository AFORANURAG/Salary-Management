import { useQuery } from "@tanstack/react-query";
import type { Employee, EmployeeListQuery, PaginatedResponse } from "@salary-mgmt/types";
import { listEmployees, getEmployee } from "../api/employees";
import { queryKeys } from "./keys";

export { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "./employee-mutations";

export function useEmployees(query: EmployeeListQuery = {}) {
  return useQuery<PaginatedResponse<Employee>>({
    queryKey: queryKeys.employees.list(query as Record<string, unknown>),
    queryFn: () => listEmployees(query),
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => getEmployee(id),
    enabled: Boolean(id),
  });
}
