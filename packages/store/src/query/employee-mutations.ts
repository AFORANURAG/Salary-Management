import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@salary-mgmt/types";
import { createEmployee, updateEmployee, deleteEmployee } from "../api/employees";
import { queryKeys } from "./keys";

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) =>
      updateEmployee(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}
