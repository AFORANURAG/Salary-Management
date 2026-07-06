import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollSummary, mockPayrollResults } from "@/test/msw/handlers/payroll";
import PayrollDetailPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ period: "2026-06" }),
}));

describe("Payroll detail — integration", () => {
  it("renders summary card and results table via real hooks + MSW", async () => {
    renderWithFreshClient(<PayrollDetailPage />);

    await waitFor(() =>
      expect(screen.getByText(String(mockPayrollSummary.processed))).toBeInTheDocument()
    );

    const firstResult = mockPayrollResults[0];
    if (!firstResult) throw new Error("mockPayrollResults is empty");
    await waitFor(() =>
      expect(screen.getByText(firstResult.employeeId)).toBeInTheDocument()
    );
  });

  it("filtering by employeeId sends the correct query param to the API", async () => {
    const user = userEvent.setup();
    let capturedEmployeeId: string | null = null;

    server.use(
      http.get("http://localhost:3001/v1/payroll/runs/:period/results", ({ request }) => {
        const url = new URL(request.url);
        capturedEmployeeId = url.searchParams.get("employeeId");
        const filtered = mockPayrollResults.filter(
          (r) => !capturedEmployeeId || r.employeeId === capturedEmployeeId
        );
        return HttpResponse.json(filtered);
      })
    );

    renderWithFreshClient(<PayrollDetailPage />);

    await waitFor(() =>
      expect(screen.getByLabelText(/filter by employee id/i)).toBeInTheDocument()
    );

    const firstResult = mockPayrollResults[0];
    if (!firstResult) throw new Error("mockPayrollResults is empty");
    const targetId = firstResult.employeeId;
    await user.type(screen.getByLabelText(/filter by employee id/i), targetId);

    await waitFor(() => expect(capturedEmployeeId).toBe(targetId));
  });
});
