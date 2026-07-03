import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockEmployee, mockPage } from "@/test/msw/handlers/employees";
import type { PaginatedResponse, Employee } from "@salary-mgmt/types";
import EmployeesPage from "../../page";


vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const emptyPage: PaginatedResponse<Employee> = {
  data: [],
  page: 1,
  pageSize: 25,
  total: 0,
};

describe("EF23 – delete dialog: DELETE intercepted; list re-fetches on success", () => {
  it("list refetches and employee row disappears after confirming delete", async () => {
    let listCallCount = 0;

    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        listCallCount += 1;
        return HttpResponse.json(listCallCount === 1 ? mockPage : emptyPage);
      }),
      http.delete(`http://localhost:3001/v1/employees/${mockEmployee.id}`, () => {
        return HttpResponse.json({
          ...mockEmployee,
          employmentStatus: "TERMINATED",
        });
      })
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText(mockEmployee.name)).toBeInTheDocument()
    );

    // Open row actions and click Delete
    await user.click(screen.getByRole("button", { name: /row actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));

    // Confirm in the dialog
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // List re-fetches; empty state renders
    await waitFor(() =>
      expect(screen.getByText(/no employees found/i)).toBeInTheDocument()
    );

    expect(listCallCount).toBeGreaterThanOrEqual(2);
  });
});
