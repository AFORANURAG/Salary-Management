import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SalaryStructure, UpsertSalaryStructureInput } from "@salary-mgmt/types";
import {
  getSalaryStructure,
  getSalaryStructureHistory,
  upsertSalaryStructure,
} from "../api/salary-structure";
import { queryKeys } from "./keys";

export function useSalaryStructure(employeeId: string) {
  return useQuery<SalaryStructure>({
    queryKey: queryKeys.salaryStructure.current(employeeId),
    queryFn: () => getSalaryStructure(employeeId),
    enabled: Boolean(employeeId),
    meta: { suppressErrorToast: true },
    retry: (failureCount, error) => {
      // Don't retry 404 — employee has no active structure
      if ("status" in error && (error as { status: number }).status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useSalaryStructureHistory(employeeId: string) {
  return useQuery<SalaryStructure[]>({
    queryKey: queryKeys.salaryStructure.history(employeeId),
    queryFn: () => getSalaryStructureHistory(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useUpsertSalaryStructure(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<SalaryStructure, Error, UpsertSalaryStructureInput>({
    meta: { successMessage: "Salary structure saved" },
    mutationFn: (input) => upsertSalaryStructure(employeeId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.salaryStructure.current(employeeId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.salaryStructure.history(employeeId),
      });
    },
  });
}
