import type {
  BulkStatusRequest,
  BulkStatusResponse,
  Employee,
  EmployeeListQuery,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ImportResponse,
  PaginatedResponse,
} from "@salary-mgmt/types";
import { ApiError } from "./client";
import { createApiClient } from "./client";

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
  : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

function buildEmployeeQuery(query: EmployeeListQuery): string {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  if (query.sort) params.set("sort", query.sort);

  for (const dep of query.department ?? []) params.append("department", dep);
  for (const c of query.country ?? []) params.append("country", c);
  for (const s of query.status ?? []) params.append("status", s);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listEmployees(query: EmployeeListQuery = {}): Promise<PaginatedResponse<Employee>> {
  return api.get<PaginatedResponse<Employee>>(`/v1/employees${buildEmployeeQuery(query)}`);
}

export function getEmployee(id: string): Promise<Employee> {
  return api.get<Employee>(`/v1/employees/${id}`);
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  return api.post<Employee>("/v1/employees", input);
}

export function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
  return api.patch<Employee>(`/v1/employees/${id}`, input);
}

export function deleteEmployee(id: string): Promise<Employee> {
  return api.delete<Employee>(`/v1/employees/${id}`);
}

export function postBulkStatusChange(body: BulkStatusRequest): Promise<BulkStatusResponse> {
  return api.post<BulkStatusResponse>("/v1/employees/bulk-status", body);
}

export async function postEmployeeImport(file: File): Promise<ImportResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/v1/employees/import`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { /* ignore */ }
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as Record<string, unknown>).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<ImportResponse>;
}
