import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PayrollResult, PayrollRunSummary } from "@salary-mgmt/types";
import { runPayroll, getPayrollSummary, getPayrollResults } from "../api/payroll";
import { queryKeys } from "./keys";

export function usePayrollRuns() {
  return useQuery<PayrollRunSummary[]>({
    queryKey: queryKeys.payroll.runs(),
    queryFn: async () => {
      // The API has no list-all-runs endpoint; return empty array as placeholder.
      // Components that need a list drive it from their own fetched periods.
      return [];
    },
    staleTime: 0,
  });
}

export function usePayrollSummary(period: string) {
  return useQuery<PayrollRunSummary>({
    queryKey: queryKeys.payroll.summary(period),
    queryFn: () => getPayrollSummary(period),
    enabled: Boolean(period),
    retry: (failureCount, error) => {
      if ("status" in error && (error as { status: number }).status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function usePayrollResults(period: string, employeeId?: string) {
  return useQuery<PayrollResult[]>({
    queryKey: queryKeys.payroll.results(period, employeeId),
    queryFn: () => getPayrollResults(period, employeeId),
    enabled: Boolean(period),
  });
}

export function useRunPayroll() {
  const queryClient = useQueryClient();
  return useMutation<PayrollRunSummary, Error, string>({
    mutationFn: (period) => runPayroll(period),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.runs() });
      queryClient.setQueryData(queryKeys.payroll.summary(data.period), data);
    },
  });
}
