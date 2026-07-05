import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayslip } from "@/test/msw/handlers/payslips";
import PayslipDetailPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({
    id: "11111111-1111-1111-1111-111111111111",
    period: "2026-06",
  }),
}));

describe("PS18 – payslip detail: page integration", () => {
  it("renders PayslipCard with data fetched via real hook + MSW", async () => {
    renderWithFreshClient(<PayslipDetailPage />);

    await waitFor(() =>
      expect(screen.getByText(mockPayslip.name)).toBeInTheDocument()
    );

    expect(screen.getByText(mockPayslip.employeeCode)).toBeInTheDocument();
    expect(screen.getByText("BASIC")).toBeInTheDocument();
    expect(screen.getByText("PF")).toBeInTheDocument();
  });
});
