import { http, HttpResponse } from "msw";
import type { PayrollResult, PayrollRunSummary } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockPayrollSummary: PayrollRunSummary = {
  period: "2026-06",
  processed: 3,
  skipped: [],
  totalGrossMinor: 1_800_000,
  totalNetMinor: 1_620_000,
};

export const mockPayrollResults: PayrollResult[] = [
  {
    id: "pr-0001-0000-0000-0000-000000000001",
    employeeId: "11111111-1111-1111-1111-111111111111",
    period: "2026-06",
    structureId: "ss-0001-0000-0000-0000-000000000001",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "pr-0001-0000-0000-0000-000000000002",
    employeeId: "22222222-2222-2222-2222-222222222222",
    period: "2026-06",
    structureId: "ss-0001-0000-0000-0000-000000000002",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "pr-0001-0000-0000-0000-000000000003",
    employeeId: "33333333-3333-3333-3333-333333333333",
    period: "2026-06",
    structureId: "ss-0001-0000-0000-0000-000000000003",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
];

export const payrollHandlers = [
  http.post(`${API_BASE}/v1/payroll/runs`, async ({ request }) => {
    const body = await request.json() as { period: string };
    if (body.period === "2099-13") {
      return HttpResponse.json({ message: "Invalid period" }, { status: 400 });
    }
    if (body.period === "2026-06") {
      return HttpResponse.json(
        { message: "Payroll already run for period 2026-06" },
        { status: 409 },
      );
    }
    const summary: PayrollRunSummary = {
      period: body.period,
      processed: 3,
      skipped: [],
      totalGrossMinor: 1_800_000,
      totalNetMinor: 1_620_000,
    };
    return HttpResponse.json(summary, { status: 201 });
  }),

  http.get(`${API_BASE}/v1/payroll/runs/:period`, ({ params }) => {
    if (params.period === "1999-01") {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ ...mockPayrollSummary, period: params.period as string });
  }),

  http.get(`${API_BASE}/v1/payroll/runs/:period/results`, ({ request, params }) => {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const results = mockPayrollResults.map((r) => ({ ...r, period: params.period as string }));
    if (employeeId) {
      return HttpResponse.json(results.filter((r) => r.employeeId === employeeId));
    }
    return HttpResponse.json(results);
  }),
];
