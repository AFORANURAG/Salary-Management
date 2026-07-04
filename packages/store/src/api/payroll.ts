import type { PayrollResult, PayrollRunSummary } from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function runPayroll(period: string): Promise<PayrollRunSummary> {
  return api.post<PayrollRunSummary>("/v1/payroll/runs", { period });
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
