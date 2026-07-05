import { http, HttpResponse } from "msw";
import type { Payslip, PayslipSummary } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockPayslipHistory: PayslipSummary[] = [
  {
    period: "2026-06",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    period: "2026-05",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
];

export const mockPayslip: Payslip = {
  period: "2026-06",
  generatedAt: "2026-07-01T00:00:00.000Z",
  employeeId: "11111111-1111-1111-1111-111111111111",
  employeeCode: "EMP001",
  name: "Alice Smith",
  department: "Engineering",
  country: "US",
  currency: "USD",
  lineItems: [
    { code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
    { code: "HRA", kind: "EARNING", amountMinor: 100_000 },
    { code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
  ],
  grossMinor: 600_000,
  deductionsMinor: 60_000,
  netMinor: 540_000,
};

export const payslipHandlers = [
  http.get(`${API_BASE}/v1/employees/:employeeId/payslips`, () => {
    return HttpResponse.json(mockPayslipHistory);
  }),

  http.get(`${API_BASE}/v1/employees/:employeeId/payslips/:period`, ({ params }) => {
    if (params.period === mockPayslip.period) {
      return HttpResponse.json(mockPayslip);
    }
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),
];
