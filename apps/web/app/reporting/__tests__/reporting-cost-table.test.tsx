import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import { ReportingCostTable } from "../components/reporting-cost-table";

const mockCostResponse = {
  period: "2026-06",
  groupBy: "department" as const,
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

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, useReportingPayrollCost: vi.fn() };
});

describe("ReportingCostTable", () => {
  it("renders one row per group with correct key, headcount, and net amount", async () => {
    const { useReportingPayrollCost } = await import("@salary-mgmt/store");
    vi.mocked(useReportingPayrollCost).mockReturnValue({
      data: mockCostResponse,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useReportingPayrollCost>);

    render(<ReportingCostTable period="2026-06" groupBy="department" />);

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    // Net amounts should be rendered (formatted)
    expect(screen.getAllByText(/10,800\.00|1080000|10800/i).length).toBeGreaterThan(0);
  });

  it("renders loading skeleton while isLoading is true", async () => {
    const { useReportingPayrollCost } = await import("@salary-mgmt/store");
    vi.mocked(useReportingPayrollCost).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useReportingPayrollCost>);

    const { container } = render(<ReportingCostTable period="2026-06" groupBy="department" />);

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });

  it("renders empty state when no results exist for the period", async () => {
    const { useReportingPayrollCost } = await import("@salary-mgmt/store");
    vi.mocked(useReportingPayrollCost).mockReturnValue({
      data: { period: "2026-06", groupBy: "department" as const, buckets: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useReportingPayrollCost>);

    render(<ReportingCostTable period="2026-06" groupBy="department" />);

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});
