import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import { PayslipCard } from "../components/payslip-card";

const mockPayslip = {
  period: "2026-06",
  generatedAt: "2026-07-01T00:00:00.000Z",
  employeeId: "e1",
  employeeCode: "EMP001",
  name: "Alice Smith",
  department: "Engineering" as const,
  country: "US",
  currency: "USD",
  lineItems: [
    { code: "BASIC", kind: "EARNING" as const, amountMinor: 500_000 },
    { code: "HRA", kind: "EARNING" as const, amountMinor: 100_000 },
    { code: "PF", kind: "DEDUCTION" as const, amountMinor: 60_000 },
  ],
  grossMinor: 600_000,
  deductionsMinor: 60_000,
  netMinor: 540_000,
};

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, usePayslip: vi.fn() };
});

describe("PayslipCard", () => {
  it("renders employee identity, line items, and net pay summary", async () => {
    const { usePayslip } = await import("@salary-mgmt/store");
    vi.mocked(usePayslip).mockReturnValue({
      data: mockPayslip,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayslip>);

    render(<PayslipCard employeeId="e1" period="2026-06" />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("EMP001")).toBeInTheDocument();
    expect(screen.getByText("BASIC")).toBeInTheDocument();
    expect(screen.getByText("HRA")).toBeInTheDocument();
    expect(screen.getByText("PF")).toBeInTheDocument();
  });

  it("renders loading skeleton while isLoading is true", async () => {
    const { usePayslip } = await import("@salary-mgmt/store");
    vi.mocked(usePayslip).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof usePayslip>);

    const { container } = render(<PayslipCard employeeId="e1" period="2026-06" />);

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
  });
});
