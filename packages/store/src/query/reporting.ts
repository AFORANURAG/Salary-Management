import { useQuery } from "@tanstack/react-query";
import type {
  GroupByDimension,
  PayrollCostResponse,
  PayrollSummaryResponse,
} from "@salary-mgmt/types";
import { getReportingPayrollCost, getReportingSummary } from "../api/reporting";
import { queryKeys } from "./keys";

export function useReportingPayrollCost(period: string, groupBy: GroupByDimension) {
  return useQuery<PayrollCostResponse>({
    queryKey: queryKeys.reporting.cost(period, groupBy),
    queryFn: () => getReportingPayrollCost(period, groupBy),
    enabled: Boolean(period) && Boolean(groupBy),
  });
}

export function useReportingSummary(period: string) {
  return useQuery<PayrollSummaryResponse>({
    queryKey: queryKeys.reporting.summary(period),
    queryFn: () => getReportingSummary(period),
    enabled: Boolean(period),
  });
}
