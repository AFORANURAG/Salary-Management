import type {
  PaginatedResponse,
  PayrollDiffResponse,
  PayrollResult,
  PayrollRunListQuery,
  PayrollRunSummary,
} from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function runPayroll(period: string): Promise<PayrollRunSummary> {
  return api.post<PayrollRunSummary>("/v1/payroll/runs", { period });
}

export function getPayrollRuns(
  query?: PayrollRunListQuery,
): Promise<PaginatedResponse<PayrollRunSummary>> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.pageSize) params.set("pageSize", String(query.pageSize));
  if (query?.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status];
    statuses.forEach((s) => params.append("status", s));
  }
  const qs = params.toString() ? `?${params.toString()}` : "";
  return api.get<PaginatedResponse<PayrollRunSummary>>(`/v1/payroll/runs${qs}`);
}

export function getPayrollSummary(period: string): Promise<PayrollRunSummary> {
  return api.get<PayrollRunSummary>(`/v1/payroll/runs/${period}`);
}

export function getPayrollResults(
  period: string,
  employeeId?: string,
): Promise<PayrollResult[]> {
  const qs = employeeId ? `?employeeId=${employeeId}` : "";
  return api.get<PayrollResult[]>(`/v1/payroll/runs/${period}/results${qs}`);
}

export function postVoidPayrollRun(period: string): Promise<PayrollRunSummary> {
  return api.post<PayrollRunSummary>(`/v1/payroll/runs/${period}/void`, {});
}

export function getPayrollDiff(
  basePeriod: string,
  compareTo: string,
): Promise<PayrollDiffResponse> {
  return api.get<PayrollDiffResponse>(
    `/v1/payroll/runs/${basePeriod}/diff?compareTo=${encodeURIComponent(compareTo)}`,
  );
}
