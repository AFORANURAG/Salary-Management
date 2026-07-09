import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { PayrollRunList } from "../components/payroll-run-list";
import type { PayrollRunSummary } from "@salary-mgmt/types";

const runs: PayrollRunSummary[] = [
  {
    period: "2026-06",
    status: "COMPLETED",
    headcount: 5,
    totalGrossMinor: 3_000_000,
    totalDeductionsMinor: 300_000,
    totalNetMinor: 2_700_000,
    currency: "USD",
    ranAt: "2026-06-01T00:00:00.000Z",
    voidedAt: null,
    voidedBy: null,
  },
  {
    period: "2026-05",
    status: "VOIDED",
    headcount: 4,
    totalGrossMinor: 2_400_000,
    totalDeductionsMinor: 240_000,
    totalNetMinor: 2_160_000,
    currency: "USD",
    ranAt: "2026-05-01T00:00:00.000Z",
    voidedAt: "2026-05-15T00:00:00.000Z",
    voidedBy: "admin@acme.com",
  },
];

describe("PayrollRunList", () => {
  it("renders period, status badge, headcount, and total net columns", () => {
    render(<PayrollRunList runs={runs} />);
    expect(screen.getByText("2026-06")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-completed")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2026-05")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-voided")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows empty state when no runs exist", () => {
    render(<PayrollRunList runs={[]} />);
    expect(screen.getByTestId("payroll-run-list-empty")).toBeInTheDocument();
  });

  it("renders status filter pills when onStatusFilter is provided", () => {
    render(<PayrollRunList runs={runs} onStatusFilter={vi.fn()} />);
    expect(screen.getByTestId("filter-all")).toBeInTheDocument();
    expect(screen.getByTestId("filter-completed")).toBeInTheDocument();
    expect(screen.getByTestId("filter-pending")).toBeInTheDocument();
    expect(screen.getByTestId("filter-voided")).toBeInTheDocument();
  });

  it("calls onStatusFilter with correct value when a filter pill is clicked", async () => {
    const user = userEvent.setup();
    const onStatusFilter = vi.fn();
    render(<PayrollRunList runs={runs} onStatusFilter={onStatusFilter} />);

    await user.click(screen.getByTestId("filter-completed"));
    expect(onStatusFilter).toHaveBeenCalledWith("COMPLETED");

    await user.click(screen.getByTestId("filter-all"));
    expect(onStatusFilter).toHaveBeenCalledWith(undefined);
  });

  it("does not render filter pills when onStatusFilter is not provided", () => {
    render(<PayrollRunList runs={runs} />);
    expect(screen.queryByRole("group", { name: /status filter/i })).not.toBeInTheDocument();
  });
});
