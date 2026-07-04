import { http, HttpResponse } from "msw";
import type { SalaryStructure } from "@salary-mgmt/types";

const API_BASE = "http://localhost:3001";

export const mockSalaryStructure: SalaryStructure = {
  id: "ss-0001-0000-0000-0000-000000000001",
  employeeId: "11111111-1111-1111-1111-111111111111",
  effectiveFrom: "2024-01-01",
  effectiveTo: null,
  currency: "USD",
  createdAt: "2024-01-01T00:00:00Z",
  components: [
    { id: "sc-0001", structureId: "ss-0001-0000-0000-0000-000000000001", code: "BASIC", kind: "EARNING", amountMinor: 500_000 },
    { id: "sc-0002", structureId: "ss-0001-0000-0000-0000-000000000001", code: "PF", kind: "DEDUCTION", amountMinor: 60_000 },
  ],
};

export const mockSalaryStructureHistory: SalaryStructure[] = [
  {
    id: "ss-0000-0000-0000-0000-000000000001",
    employeeId: "11111111-1111-1111-1111-111111111111",
    effectiveFrom: "2023-01-01",
    effectiveTo: "2023-12-31",
    currency: "USD",
    createdAt: "2023-01-01T00:00:00Z",
    components: [
      { id: "sc-0000", structureId: "ss-0000-0000-0000-0000-000000000001", code: "BASIC", kind: "EARNING", amountMinor: 400_000 },
    ],
  },
  mockSalaryStructure,
];

export const salaryStructureHandlers = [
  http.get(`${API_BASE}/v1/employees/:employeeId/salary-structure`, ({ params }) => {
    if (params.employeeId === "no-structure") {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(mockSalaryStructure);
  }),

  http.get(`${API_BASE}/v1/employees/:employeeId/salary-structure/history`, () => {
    return HttpResponse.json(mockSalaryStructureHistory);
  }),

  http.put(`${API_BASE}/v1/employees/:employeeId/salary-structure`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const updated: SalaryStructure = {
      ...mockSalaryStructure,
      effectiveFrom: body.effectiveFrom as string,
      currency: body.currency as string,
      components: (body.components as Array<{ code: string; kind: "EARNING" | "DEDUCTION"; amountMinor: number }>).map((c, i) => ({
        id: `sc-new-${i}`,
        structureId: mockSalaryStructure.id,
        code: c.code,
        kind: c.kind,
        amountMinor: c.amountMinor,
      })),
    };
    return HttpResponse.json(updated, { status: 201 });
  }),
];
