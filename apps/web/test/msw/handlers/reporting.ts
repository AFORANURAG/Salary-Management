import { http, HttpResponse } from "msw";
import type { PayrollCostResponse, PayrollSummaryResponse } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockPayrollCost: PayrollCostResponse = {
  period: "2026-06",
  groupBy: "department",
  buckets: [
    {
      currency: "USD",
      groups: [
        {
          key: "Engineering",
          headcount: 2,
          grossMinor: 1_200_000,
          deductionsMinor: 120_000,
          netMinor: 1_080_000,
        },
        {
          key: "Sales",
          headcount: 1,
          grossMinor: 600_000,
          deductionsMinor: 60_000,
          netMinor: 540_000,
        },
      ],
    },
  ],
};

export const mockPayrollSummary: PayrollSummaryResponse = {
  period: "2026-06",
  buckets: [
    {
      currency: "USD",
      headcount: 3,
      grossMinor: 1_800_000,
      deductionsMinor: 180_000,
      netMinor: 1_620_000,
    },
  ],
};

export const reportingHandlers = [
  http.get(`${API_BASE}/v1/reporting/payroll-cost`, () => {
    return HttpResponse.json(mockPayrollCost);
  }),

  http.get(`${API_BASE}/v1/reporting/payroll-summary`, () => {
    return HttpResponse.json(mockPayrollSummary);
  }),
];
