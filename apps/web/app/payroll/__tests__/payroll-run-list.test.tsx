import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/render";
import { PayrollRunList } from "../components/payroll-run-list";
import type { PayrollRunSummary } from "@salary-mgmt/types";

const runs: PayrollRunSummary[] = [
  { period: "2026-06", processed: 5, skipped: [], totalGrossMinor: 3_000_000, totalNetMinor: 2_700_000 },
  { period: "2026-05", processed: 4, skipped: ["id-1"], totalGrossMinor: 2_400_000, totalNetMinor: 2_160_000 },
];

describe("PayrollRunList", () => {
  it("renders period, processed count, and total net columns", () => {
    render(<PayrollRunList runs={runs} />);
    expect(screen.getByText("2026-06")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2026-05")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows empty state when no runs exist", () => {
    render(<PayrollRunList runs={[]} />);
    expect(screen.getByTestId("payroll-run-list-empty")).toBeInTheDocument();
  });
});
