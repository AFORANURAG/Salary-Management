import type { SalaryStructure, UpsertSalaryStructureInput } from "@salary-mgmt/types";
import { createApiClient } from "./client";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

const api = createApiClient(API_BASE);

export function getSalaryStructure(employeeId: string): Promise<SalaryStructure> {
  return api.get<SalaryStructure>(`/v1/employees/${employeeId}/salary-structure`);
}

export function getSalaryStructureHistory(employeeId: string): Promise<SalaryStructure[]> {
  return api.get<SalaryStructure[]>(`/v1/employees/${employeeId}/salary-structure/history`);
}

export function upsertSalaryStructure(
  employeeId: string,
  input: UpsertSalaryStructureInput,
): Promise<SalaryStructure> {
  return api.put<SalaryStructure>(`/v1/employees/${employeeId}/salary-structure`, input);
}
