import type { Payslip, PayslipSummary } from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function getPayslipHistory(employeeId: string): Promise<PayslipSummary[]> {
  return api.get<PayslipSummary[]>(`/v1/employees/${employeeId}/payslips`);
}

export function getPayslip(employeeId: string, period: string): Promise<Payslip> {
  return api.get<Payslip>(`/v1/employees/${employeeId}/payslips/${period}`);
}
