import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BulkStatusRequest, CreateEmployeeInput, UpdateEmployeeInput } from "@salary-mgmt/types";
import { createEmployee, deleteEmployee, postBulkStatusChange, postEmployeeImport, updateEmployee } from "../api/employees";
import { queryKeys } from "./keys";

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: "Employee created" },
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: "Employee updated" },
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
    meta: { successMessage: "Employee deleted" },
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useBulkStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { successMessage: "Status updated" },
    mutationFn: (body: BulkStatusRequest) => postBulkStatusChange(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
  });
}

export function useEmployeeImport() {
  return useMutation({
    meta: { suppressErrorToast: true },
    mutationFn: (file: File) => postEmployeeImport(file),
  });
}
