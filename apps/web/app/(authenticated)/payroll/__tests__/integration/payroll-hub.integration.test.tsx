import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollRunsList } from "@/test/msw/handlers/payroll";
import type { PaginatedResponse, PayrollRunSummary } from "@salary-mgmt/types";
import PayrollPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe("Payroll hub — integration", () => {
  it("renders run list fetched via real usePayrollRuns hook with MSW", async () => {
    renderWithFreshClient(<PayrollPage />);
    await waitFor(() =>
      expect(screen.getByText("2026-06")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("status-badge-completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run payroll/i })).toBeInTheDocument();
  });

  it("status filter pill passes status param and re-fetches filtered list", async () => {
    const user = userEvent.setup();
    let filteredFetchCalled = false;

    server.use(
      http.get("http://localhost:3001/v1/payroll/runs", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.getAll("status").includes("VOIDED")) {
          filteredFetchCalled = true;
          const empty: PaginatedResponse<PayrollRunSummary> = {
            data: [],
            page: 1,
            pageSize: 20,
            total: 0,
          };
          return HttpResponse.json(empty);
        }
        return HttpResponse.json(mockPayrollRunsList);
      }),
    );

    renderWithFreshClient(<PayrollPage />);
    await waitFor(() => expect(screen.getByText("2026-06")).toBeInTheDocument());

    await user.click(screen.getByTestId("filter-voided"));
    await waitFor(() => expect(filteredFetchCalled).toBe(true));
    await waitFor(() =>
      expect(screen.getByTestId("payroll-run-list-empty")).toBeInTheDocument(),
    );
  });

  it("clicking Run Payroll, entering a valid period, and confirming triggers POST", async () => {
    const user = userEvent.setup();
    let postCalled = false;

    server.use(
      http.post("http://localhost:3001/v1/payroll/runs", async ({ request }) => {
        postCalled = true;
        const body = await request.json() as { period: string };
        const summary: PayrollRunSummary = {
          period: body.period,
          status: "COMPLETED",
          headcount: 3,
          totalGrossMinor: 1_800_000,
          totalDeductionsMinor: 180_000,
          totalNetMinor: 1_620_000,
          currency: "USD",
          ranAt: "2026-07-01T00:00:00.000Z",
          voidedAt: null,
          voidedBy: null,
        };
        return HttpResponse.json(summary, { status: 201 });
      }),
    );

    renderWithFreshClient(<PayrollPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: /run payroll/i })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /run payroll/i }));
    await user.type(screen.getByLabelText(/pay period/i), "2026-07");
    await user.click(screen.getByRole("button", { name: /run payroll/i, hidden: false }));

    await waitFor(() => expect(postCalled).toBe(true));
  });
});
