import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../../test/render";
import { PayrollResultsTable } from "../components/payroll-results-table";
import type { PayrollResult } from "@salary-mgmt/types";

const mockResults: PayrollResult[] = [
  {
    id: "r1",
    employeeId: "11111111-1111-1111-1111-111111111111",
    period: "2026-06",
    structureId: "s1",
    grossMinor: 600_000,
    deductionsMinor: 60_000,
    netMinor: 540_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "r2",
    employeeId: "22222222-2222-2222-2222-222222222222",
    period: "2026-06",
    structureId: "s2",
    grossMinor: 400_000,
    deductionsMinor: 40_000,
    netMinor: 360_000,
    currency: "USD",
    generatedAt: "2026-06-01T00:00:00.000Z",
  },
];

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    usePayrollResults: vi.fn(),
  };
});

describe("PayrollResultsTable", () => {
  it("renders one row per result with correct amounts", async () => {
    const { usePayrollResults } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollResults).mockReturnValue({
      data: mockResults,
      isLoading: false,
    } as unknown as ReturnType<typeof usePayrollResults>);

    render(<PayrollResultsTable period="2026-06" />);

    expect(screen.getByText("11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByText("22222222-2222-2222-2222-222222222222")).toBeInTheDocument();
  });

  it("renders empty state when results is an empty array", async () => {
    const { usePayrollResults } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollResults).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof usePayrollResults>);

    render(<PayrollResultsTable period="2026-06" />);
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });
});
