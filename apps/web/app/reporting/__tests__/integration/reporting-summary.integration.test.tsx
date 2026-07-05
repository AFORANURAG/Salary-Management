import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollSummary } from "@/test/msw/handlers/reporting";
import ReportingPage from "../../page";

describe("RF8 – reporting summary card: integration", () => {
  it("renders ReportingSummaryCard with totals fetched via real useReportingSummary + MSW", async () => {
    renderWithFreshClient(<ReportingPage />);

    await waitFor(() =>
      expect(
        screen.getAllByText(mockPayrollSummary.buckets[0]!.currency).length,
      ).toBeGreaterThan(0),
    );
  });
});
