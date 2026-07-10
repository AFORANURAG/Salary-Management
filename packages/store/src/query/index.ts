export { createQueryClient, getQueryClient, STALE_TIMES, CACHE_TIMES } from "./client";
export { useSession, useLogin, useLogout, type SessionState } from "./session";
export { useEmployees, useEmployee } from "./employees";
export { useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "./employee-mutations";
export { QueryProvider } from "./provider";
export { queryKeys } from "./keys";
export { useOptimisticMutation, type OptimisticMutationOptions } from "./mutations";
export {
  useSalaryStructure,
  useSalaryStructureHistory,
  useUpsertSalaryStructure,
} from "./salary-structure";
export {
  usePayrollRuns,
  usePayrollSummary,
  usePayrollResults,
  useRunPayroll,
  useVoidPayrollRun,
  usePayrollDiff,
} from "./payroll";
export { usePayslipHistory, usePayslip } from "./payslips";
export { useReportingPayrollCost, useReportingSummary } from "./reporting";
export { ApiError } from "../api/client";

// Re-export the most commonly used TanStack Query hooks so consumers
// only need to import from @salary-mgmt/store/query
export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useSuspenseQuery,
  dehydrate,
  HydrationBoundary,
  useQueryClient,
  useIsFetching,
  useIsMutating,
  QueryClient,
  QueryClientProvider,
  QueryObserver,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
  type QueryKey,
  type InfiniteData,
} from "@tanstack/react-query";
