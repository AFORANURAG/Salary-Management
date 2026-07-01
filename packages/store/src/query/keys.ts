/**
 * Centralized query key factory for salary-mgmt domains.
 */
export const queryKeys = {
  health: {
    all: () => ["health"] as const,
  },
  employees: {
    all: () => ["employees"] as const,
    lists: () => [...queryKeys.employees.all(), "list"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.employees.lists(), { filters }] as const,
    details: () => [...queryKeys.employees.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
  },
  payroll: {
    all: () => ["payroll"] as const,
    runs: () => [...queryKeys.payroll.all(), "run"] as const,
    run: (id: string) => [...queryKeys.payroll.runs(), id] as const,
  },
  payslips: {
    all: () => ["payslips"] as const,
    detail: (employeeId: string, period?: string) =>
      [...queryKeys.payslips.all(), employeeId, { period }] as const,
  },
  reporting: {
    all: () => ["reporting"] as const,
    aggregates: (filters?: Record<string, unknown>) =>
      [...queryKeys.reporting.all(), "aggregates", { filters }] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
