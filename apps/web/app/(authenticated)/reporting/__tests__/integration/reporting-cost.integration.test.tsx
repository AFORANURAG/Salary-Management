import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollCost } from "@/test/msw/handlers/reporting";
import ReportingPage from "../../page";

describe("RF7 – reporting cost table: integration", () => {
  it("renders ReportingCostTable with groups fetched via real useReportingPayrollCost + MSW", async () => {
    renderWithFreshClient(<ReportingPage />);

    await waitFor(() =>
      expect(
        screen.getByText(mockPayrollCost.buckets[0]!.groups[0]!.key),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByText(mockPayrollCost.buckets[0]!.groups[1]!.key),
    ).toBeInTheDocument();
  });
});
