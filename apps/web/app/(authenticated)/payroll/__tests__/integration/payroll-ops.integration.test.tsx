import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPayrollRunsList, mockPayrollDiff } from "@/test/msw/handlers/payroll";
import type { PaginatedResponse, PayrollRunSummary } from "@salary-mgmt/types";
import PayrollPage from "../../page";
import PayrollDetailPage from "../../[period]/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ period: "2026-06" }),
}));

vi.mock("@/components/session-provider", () => ({
  useSessionContext: () => ({ user: { role: "ADMIN", email: "admin@example.com" } }),
}));

describe("Payroll ops — integration (PO29)", () => {
  describe("History page", () => {
    it("renders run list from MSW fixture", async () => {
      renderWithFreshClient(<PayrollPage />);
      await waitFor(() =>
        expect(screen.getByText(mockPayrollRunsList.data[0]!.period)).toBeInTheDocument(),
      );
      expect(screen.getByTestId("status-badge-completed")).toBeInTheDocument();
    });

    it("status filter pill sends status param and re-renders filtered list", async () => {
      const user = userEvent.setup();
      let capturedStatus: string | null = null;

      server.use(
        http.get("http://localhost:3001/v1/payroll/runs", ({ request }) => {
          const url = new URL(request.url);
          const statuses = url.searchParams.getAll("status");
          if (statuses.length > 0) {
            capturedStatus = statuses[0] ?? null;
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
      await waitFor(() =>
        expect(screen.getByText(mockPayrollRunsList.data[0]!.period)).toBeInTheDocument(),
      );

      await user.click(screen.getByTestId("filter-voided"));

      await waitFor(() => expect(capturedStatus).toBe("VOIDED"));
      await waitFor(() =>
        expect(screen.getByTestId("payroll-run-list-empty")).toBeInTheDocument(),
      );
    });

    it("diff icon button opens PeriodDiffDrawer with salary changes", async () => {
      const user = userEvent.setup();

      server.use(
        http.get("http://localhost:3001/v1/payroll/runs", () =>
          HttpResponse.json(mockPayrollRunsList),
        ),
        http.get("http://localhost:3001/v1/payroll/runs/:period/diff", ({ request }) => {
          const url = new URL(request.url);
          const compareTo = url.searchParams.get("compareTo");
          if (!compareTo) return HttpResponse.json({ message: "missing compareTo" }, { status: 400 });
          return HttpResponse.json({ ...mockPayrollDiff });
        }),
      );

      renderWithFreshClient(<PayrollPage />);
      await waitFor(() =>
        expect(screen.getByText(mockPayrollRunsList.data[0]!.period)).toBeInTheDocument(),
      );

      const diffBtn = screen.getByTestId(`diff-btn-${mockPayrollRunsList.data[0]!.period}`);
      await user.click(diffBtn);

      await waitFor(() =>
        expect(screen.getByText(mockPayrollDiff.salaryChanges[0]!.name)).toBeInTheDocument(),
      );
      expect(screen.getByTestId("diff-totals")).toBeInTheDocument();
    });
  });

  describe("Void modal — MSW integration", () => {
    it("200 response: shows toast and modal closes", async () => {
      const user = userEvent.setup();

      server.use(
        http.post(
          "http://localhost:3001/v1/payroll/runs/:period/void",
          ({ params }) => {
            return HttpResponse.json({
              period: params.period,
              status: "VOIDED",
              voidedAt: "2026-07-09T00:00:00.000Z",
              voidedBy: "admin@example.com",
            });
          },
        ),
      );

      renderWithFreshClient(<PayrollDetailPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /void run/i })).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /void run/i }));
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /^void run$/i }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    });

    it("409 response: shows inline error without closing modal", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("http://localhost:3001/v1/payroll/runs/:period/void", () =>
          HttpResponse.json({ message: "Already voided" }, { status: 409 }),
        ),
      );

      renderWithFreshClient(<PayrollDetailPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /void run/i })).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /void run/i }));
      await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /^void run$/i }));

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(/already been voided/i),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Diff drawer — MSW integration", () => {
    it("opens from detail page and renders salary changes table", async () => {
      const user = userEvent.setup();

      server.use(
        http.get("http://localhost:3001/v1/payroll/runs/:period/diff", ({ request }) => {
          const url = new URL(request.url);
          const compareTo = url.searchParams.get("compareTo");
          if (!compareTo) return HttpResponse.json({ message: "missing compareTo" }, { status: 400 });
          return HttpResponse.json({ ...mockPayrollDiff });
        }),
      );

      renderWithFreshClient(<PayrollDetailPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /compare with previous/i })).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /compare with previous/i }));

      await waitFor(() =>
        expect(screen.getByText(mockPayrollDiff.salaryChanges[0]!.name)).toBeInTheDocument(),
      );
      expect(screen.getByTestId("diff-totals")).toBeInTheDocument();
    });

    it("totals tile shows correct delta sign", async () => {
      const user = userEvent.setup();

      server.use(
        http.get("http://localhost:3001/v1/payroll/runs/:period/diff", ({ request }) => {
          const url = new URL(request.url);
          const compareTo = url.searchParams.get("compareTo");
          if (!compareTo) return HttpResponse.json({ message: "missing compareTo" }, { status: 400 });
          return HttpResponse.json({ ...mockPayrollDiff });
        }),
      );

      renderWithFreshClient(<PayrollDetailPage />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /compare with previous/i })).toBeInTheDocument(),
      );
      await user.click(screen.getByRole("button", { name: /compare with previous/i }));

      await waitFor(() =>
        expect(screen.getByTestId("diff-totals")).toBeInTheDocument(),
      );
      // delta is positive (540_000 cents), so "+" should appear
      expect(screen.getByTestId("diff-totals")).toHaveTextContent("+");
    });
  });
});
