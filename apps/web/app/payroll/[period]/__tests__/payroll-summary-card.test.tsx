import { describe, it, expect } from "vitest";
import { render, screen } from "../../../../test/render";
import { PayrollSummaryCard } from "../components/payroll-summary-card";
import type { PayrollRunSummary } from "@salary-mgmt/types";

const summary: PayrollRunSummary = {
  period: "2026-06",
  processed: 10,
  skipped: ["id-1", "id-2"],
  totalGrossMinor: 6_000_000,
  totalNetMinor: 5_400_000,
};

describe("PayrollSummaryCard", () => {
  it("renders processed, skipped, gross, and net totals", () => {
    render(<PayrollSummaryCard summary={summary} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/processed/i)).toBeInTheDocument();
    expect(screen.getByText(/skipped/i)).toBeInTheDocument();
    expect(screen.getByText(/total gross/i)).toBeInTheDocument();
    expect(screen.getByText(/total net/i)).toBeInTheDocument();
  });

  it("renders loading skeletons while isLoading is true", () => {
    const { container } = render(<PayrollSummaryCard isLoading />);
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });
});
