import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayslipHistory } from "@/test/msw/handlers/payslips";
import EmployeeDetailPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: "11111111-1111-1111-1111-111111111111" }),
}));

describe("PS17 – payslip history: employee detail page integration", () => {
  it("renders PayslipHistoryList with periods fetched via real hook + MSW", async () => {
    renderWithFreshClient(<EmployeeDetailPage />);

    await waitFor(() =>
      expect(screen.getByText(mockPayslipHistory[0]!.period)).toBeInTheDocument()
    );

    expect(screen.getByText(mockPayslipHistory[1]!.period)).toBeInTheDocument();
  });
});
