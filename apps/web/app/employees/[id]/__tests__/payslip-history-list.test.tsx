import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../../test/render";
import { PayslipHistoryList } from "../components/payslip-history-list";

const mockHistory = [
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

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, usePayslipHistory: vi.fn() };
});

describe("PayslipHistoryList", () => {
  it("renders one row per history item with period and net amount", async () => {
    const { usePayslipHistory } = await import("@salary-mgmt/store");
    vi.mocked(usePayslipHistory).mockReturnValue({
      data: mockHistory,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayslipHistory>);

    render(<PayslipHistoryList employeeId="e1" />);

    expect(screen.getByText("2026-06")).toBeInTheDocument();
    expect(screen.getByText("2026-05")).toBeInTheDocument();
    expect(screen.getAllByText(/5,400\.00|540000|5400/i).length).toBeGreaterThan(0);
  });

  it("renders loading skeleton while isLoading is true", async () => {
    const { usePayslipHistory } = await import("@salary-mgmt/store");
    vi.mocked(usePayslipHistory).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof usePayslipHistory>);

    const { container } = render(<PayslipHistoryList employeeId="e1" />);

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });

  it("renders empty state when employee has no pay runs", async () => {
    const { usePayslipHistory } = await import("@salary-mgmt/store");
    vi.mocked(usePayslipHistory).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayslipHistory>);

    render(<PayslipHistoryList employeeId="e1" />);

    expect(screen.getByText(/no payslips/i)).toBeInTheDocument();
  });
});
