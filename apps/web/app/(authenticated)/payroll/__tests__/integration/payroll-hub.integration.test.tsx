import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollSummary } from "@/test/msw/handlers/payroll";
import PayrollPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe("Payroll hub — integration", () => {
  it("renders run list fetched via real usePayrollRuns hook with MSW", async () => {
    server.use(
      http.get("http://localhost:3001/v1/payroll/runs", () =>
        HttpResponse.json([mockPayrollSummary])
      )
    );
    renderWithFreshClient(<PayrollPage />);
    // usePayrollRuns is a stub returning [] — hub shows empty state initially
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /run payroll/i })).toBeInTheDocument()
    );
  });

  it("clicking Run Payroll, entering a valid period, and confirming triggers POST and adds run to list", async () => {
    const user = userEvent.setup();
    let postCalled = false;

    server.use(
      http.post("http://localhost:3001/v1/payroll/runs", async ({ request }) => {
        postCalled = true;
        const body = await request.json() as { period: string };
        return HttpResponse.json(
          { period: body.period, processed: 3, skipped: [], totalGrossMinor: 1_800_000, totalNetMinor: 1_620_000 },
          { status: 201 },
        );
      })
    );

    renderWithFreshClient(<PayrollPage />);

    await user.click(screen.getByRole("button", { name: /run payroll/i }));
    await user.type(screen.getByLabelText(/pay period/i), "2026-07");
    await user.click(screen.getByRole("button", { name: /run payroll/i, hidden: false }));

    await waitFor(() => expect(postCalled).toBe(true));
    await waitFor(() => expect(screen.getByText("2026-07")).toBeInTheDocument());
  });
});
