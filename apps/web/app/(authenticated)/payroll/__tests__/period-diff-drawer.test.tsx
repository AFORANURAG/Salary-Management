import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/render";
import { PeriodDiffDrawer } from "../components/period-diff-drawer";
import type { PayrollDiffResponse } from "@salary-mgmt/types";

const mockDiff: PayrollDiffResponse = {
  basePeriod: "2026-06",
  comparePeriod: "2026-05",
  newHires: [
    {
      employeeCode: "EMP-004",
      name: "Dana Lee",
      department: "Engineering",
      netMinor: 500_000,
      currency: "USD",
    },
  ],
  terminations: [],
  salaryChanges: [
    {
      employeeCode: "EMP-001",
      name: "Alice Smith",
      department: "Engineering",
      baseNetMinor: 600_000,
      compareNetMinor: 540_000,
      deltaMinor: 60_000,
      currency: "USD",
    },
  ],
  totals: {
    baseTotalNetMinor: 1_620_000,
    compareTotalNetMinor: 1_080_000,
    deltaTotalMinor: 540_000,
    currency: "USD",
  },
};

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return {
    ...actual,
    usePayrollDiff: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  };
});

describe("PeriodDiffDrawer", () => {
  it("renders loading skeleton when isLoading", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );
    // Skeleton divs should be present; look for the sheet content
    expect(document.querySelector('[data-testid="diff-totals"]')).toBeNull();
  });

  it("renders totals tile with correct delta", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: mockDiff,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("diff-totals")).toBeInTheDocument();
    });
    // Delta is +$5,400.00 (540_000 cents)
    expect(screen.getByTestId("diff-totals")).toHaveTextContent("+");
  });

  it("renders salary changes table with employee row", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: mockDiff,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
    expect(screen.getByText("Salary Changes")).toBeInTheDocument();
  });

  it("renders new hires section", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: mockDiff,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Dana Lee")).toBeInTheDocument();
    });
    expect(screen.getByText("New Hires")).toBeInTheDocument();
  });

  it("shows empty state when no diff data", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: {
        ...mockDiff,
        newHires: [],
        terminations: [],
        salaryChanges: [],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/no salary changes/i).length).toBeGreaterThan(0);
    });
  });

  it("shows error alert on failure", async () => {
    const { usePayrollDiff } = await import("@salary-mgmt/store");
    vi.mocked(usePayrollDiff).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof usePayrollDiff>);

    render(
      <PeriodDiffDrawer basePeriod="2026-06" open onOpenChange={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
