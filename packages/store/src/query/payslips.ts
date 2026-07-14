import { useQuery } from "@tanstack/react-query";
import type { Payslip, PayslipSummary } from "@salary-mgmt/types";
import { getPayslipHistory, getPayslip } from "../api/payslips";
import { queryKeys } from "./keys";

export function usePayslipHistory(employeeId: string) {
  return useQuery<PayslipSummary[]>({
    queryKey: queryKeys.payslips.history(employeeId),
    queryFn: () => getPayslipHistory(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function usePayslip(employeeId: string, period: string) {
  return useQuery<Payslip>({
    queryKey: queryKeys.payslips.detail(employeeId, period),
    queryFn: () => getPayslip(employeeId, period),
    enabled: Boolean(employeeId) && Boolean(period),
    meta: { suppressErrorToast: true },
    retry: (failureCount, error) => {
      if ("status" in error && (error as { status: number }).status === 404) return false;
      return failureCount < 2;
    },
  });
}
