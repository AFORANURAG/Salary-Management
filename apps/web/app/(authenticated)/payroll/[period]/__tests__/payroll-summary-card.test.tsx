import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { PayrollSummaryCard } from "../components/payroll-summary-card";
import type { PayrollRunSummary } from "@salary-mgmt/types";

const summary: PayrollRunSummary = {
  period: "2026-06",
  status: "COMPLETED",
  headcount: 10,
  totalGrossMinor: 6_000_000,
  totalDeductionsMinor: 600_000,
  totalNetMinor: 5_400_000,
  currency: "USD",
  ranAt: "2026-06-01T00:00:00.000Z",
  voidedAt: null,
  voidedBy: null,
};

describe("PayrollSummaryCard", () => {
  it("renders status, headcount, gross, and net totals", () => {
    render(<PayrollSummaryCard summary={summary} />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/headcount/i)).toBeInTheDocument();
    expect(screen.getByText(/total gross/i)).toBeInTheDocument();
    expect(screen.getByText(/total net/i)).toBeInTheDocument();
  });

  it("renders loading skeletons while isLoading is true", () => {
    const { container } = render(<PayrollSummaryCard isLoading />);
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });
});
