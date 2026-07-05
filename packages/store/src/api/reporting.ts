import type {
  GroupByDimension,
  PayrollCostResponse,
  PayrollSummaryResponse,
} from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function getReportingPayrollCost(
  period: string,
  groupBy: GroupByDimension,
): Promise<PayrollCostResponse> {
  return api.get<PayrollCostResponse>(
    `/v1/reporting/payroll-cost?period=${encodeURIComponent(period)}&groupBy=${encodeURIComponent(groupBy)}`,
  );
}

export function getReportingSummary(period: string): Promise<PayrollSummaryResponse> {
  return api.get<PayrollSummaryResponse>(
    `/v1/reporting/payroll-summary?period=${encodeURIComponent(period)}`,
  );
}
