import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import {
  mockSalaryStructure,
  mockSalaryStructureHistory,
} from "@/test/msw/handlers/salary-structure";
import EmployeeDetailPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: "11111111-1111-1111-1111-111111111111" }),
}));

describe("SF9 – salary structure: detail page integration", () => {
  it("renders SalaryStructureCard with data fetched via real hook + MSW", async () => {
    renderWithFreshClient(<EmployeeDetailPage />);

    await waitFor(() =>
      expect(screen.getAllByText(mockSalaryStructure.effectiveFrom).length).toBeGreaterThan(0)
    );

    expect(screen.getAllByText("BASIC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PF").length).toBeGreaterThan(0);
  });

  it("submitting UpsertSalaryStructureDialog PUTs to MSW and card re-fetches", async () => {
    const user = userEvent.setup();

    const newStructure = {
      ...mockSalaryStructure,
      effectiveFrom: "2025-01-01",
      components: [
        {
          id: "sc-new-0",
          structureId: mockSalaryStructure.id,
          code: "SALARY",
          kind: "EARNING" as const,
          amountMinor: 800_000,
        },
      ],
    };

    let putCalled = false;

    server.use(
      http.put(
        "http://localhost:3001/v1/employees/:employeeId/salary-structure",
        async () => {
          putCalled = true;
          return HttpResponse.json(newStructure, { status: 201 });
        }
      ),
      http.get(
        "http://localhost:3001/v1/employees/:employeeId/salary-structure",
        () => {
          if (putCalled) return HttpResponse.json(newStructure);
          return HttpResponse.json(mockSalaryStructure);
        }
      ),
      http.get(
        "http://localhost:3001/v1/employees/:employeeId/salary-structure/history",
        () => HttpResponse.json(mockSalaryStructureHistory)
      )
    );

    renderWithFreshClient(<EmployeeDetailPage />);

    await waitFor(() =>
      expect(screen.getByText(mockSalaryStructure.effectiveFrom)).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /set salary structure/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await user.type(screen.getByLabelText(/effective from/i), "2025-01-01");
    await user.click(screen.getByRole("combobox", { name: /currency/i }));
    await user.click(screen.getByRole("option", { name: "USD" }));
    await user.clear(screen.getByLabelText(/code/i));
    await user.type(screen.getByLabelText(/code/i), "SALARY");
    await user.type(screen.getByLabelText(/amount/i), "800000");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(putCalled).toBe(true));

    await waitFor(() =>
      expect(screen.getAllByText("SALARY").length).toBeGreaterThan(0)
    );
  });
});
