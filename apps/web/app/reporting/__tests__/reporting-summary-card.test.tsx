import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/render";
import { ReportingSummaryCard } from "../components/reporting-summary-card";

const mockSummaryResponse = {
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

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, useReportingSummary: vi.fn() };
});

describe("ReportingSummaryCard", () => {
  it("renders gross, deductions, and net totals per currency bucket", async () => {
    const { useReportingSummary } = await import("@salary-mgmt/store");
    vi.mocked(useReportingSummary).mockReturnValue({
      data: mockSummaryResponse,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useReportingSummary>);

    render(<ReportingSummaryCard period="2026-06" />);

    expect(screen.getByText("USD")).toBeInTheDocument();
    // Gross, deductions, net should be rendered in some formatted form
    expect(screen.getAllByText(/18,000\.00|1800000|18000/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/16,200\.00|1620000|16200/i).length).toBeGreaterThan(0);
  });

  it("renders loading skeleton while isLoading is true", async () => {
    const { useReportingSummary } = await import("@salary-mgmt/store");
    vi.mocked(useReportingSummary).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useReportingSummary>);

    const { container } = render(<ReportingSummaryCard period="2026-06" />);

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });
});
