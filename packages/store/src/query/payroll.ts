import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PaginatedResponse,
  PayrollDiffResponse,
  PayrollResult,
  PayrollRunListQuery,
  PayrollRunSummary,
} from "@salary-mgmt/types";
import {
  runPayroll,
  getPayrollRuns,
  getPayrollSummary,
  getPayrollResults,
  postVoidPayrollRun,
  getPayrollDiff,
} from "../api/payroll";
import { queryKeys } from "./keys";

export function usePayrollRuns(query?: PayrollRunListQuery) {
  return useQuery<PaginatedResponse<PayrollRunSummary>>({
    queryKey: queryKeys.payroll.runs(query as Record<string, unknown>),
    queryFn: () => getPayrollRuns(query),
  });
}

export function usePayrollSummary(period: string) {
  return useQuery<PayrollRunSummary>({
    queryKey: queryKeys.payroll.summary(period),
    queryFn: () => getPayrollSummary(period),
    enabled: Boolean(period),
    meta: { suppressErrorToast: true },
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
    meta: { successMessage: "Payroll run started" },
    mutationFn: (period) => runPayroll(period),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.runs() });
      queryClient.setQueryData(queryKeys.payroll.summary(data.period), data);
    },
  });
}

export function useVoidPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation<PayrollRunSummary, Error, string>({
    meta: { suppressErrorToast: true },
    mutationFn: (period) => postVoidPayrollRun(period),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.runs() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.run(data.period) });
    },
  });
}

export function usePayrollDiff(basePeriod: string, compareTo: string) {
  return useQuery<PayrollDiffResponse>({
    queryKey: queryKeys.payroll.diff(basePeriod, compareTo),
    queryFn: () => getPayrollDiff(basePeriod, compareTo),
    enabled: Boolean(basePeriod) && Boolean(compareTo),
  });
}
