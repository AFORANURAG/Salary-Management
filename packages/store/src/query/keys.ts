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
    run: (period: string) => [...queryKeys.payroll.runs(), period] as const,
    summary: (period: string) =>
      [...queryKeys.payroll.run(period), "summary"] as const,
    results: (period: string, employeeId?: string) =>
      [...queryKeys.payroll.run(period), "results", { employeeId }] as const,
  },
  payslips: {
    all: () => ["payslips"] as const,
    history: (employeeId: string) =>
      [...queryKeys.payslips.all(), employeeId, "history"] as const,
    detail: (employeeId: string, period?: string) =>
      [...queryKeys.payslips.all(), employeeId, { period }] as const,
  },
  reporting: {
    all: () => ["reporting"] as const,
    cost: (period: string, groupBy: string) =>
      [...queryKeys.reporting.all(), "cost", period, groupBy] as const,
    summary: (period: string) =>
      [...queryKeys.reporting.all(), "summary", period] as const,
  },
  salaryStructure: {
    all: () => ["salaryStructure"] as const,
    current: (employeeId: string) =>
      [...queryKeys.salaryStructure.all(), employeeId, "current"] as const,
    history: (employeeId: string) =>
      [...queryKeys.salaryStructure.all(), employeeId, "history"] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
