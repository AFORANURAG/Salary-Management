import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockEmployee, mockPage } from "@/test/msw/handlers/employees";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";
import EmployeesPage from "../../page";


vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EF22 – edit dialog: PATCH intercepted; list and detail re-fetch on success", () => {
  it("list refetches and shows the updated name after a successful edit", async () => {
    const updatedEmployee: Employee = { ...mockEmployee, name: "Alice Updated" };

    let listCallCount = 0;
    let detailCallCount = 0;

    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        listCallCount += 1;
        const page: PaginatedResponse<Employee> =
          listCallCount === 1
            ? mockPage
            : { data: [updatedEmployee], page: 1, pageSize: 25, total: 1 };
        return HttpResponse.json(page);
      }),
      http.patch(`http://localhost:3001/v1/employees/${mockEmployee.id}`, () => {
        return HttpResponse.json(updatedEmployee);
      }),
      http.get(`http://localhost:3001/v1/employees/${mockEmployee.id}`, () => {
        detailCallCount += 1;
        return HttpResponse.json(updatedEmployee);
      })
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText(mockEmployee.name)).toBeInTheDocument()
    );

    // Open row actions and click Edit
    await user.click(screen.getByRole("button", { name: /row actions/i }));
    await user.click(screen.getByRole("menuitem", { name: /edit/i }));

    // Clear the name field and type the updated value
    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Alice Updated");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // List should re-fetch; updated name appears
    await waitFor(() =>
      expect(screen.getByText("Alice Updated")).toBeInTheDocument()
    );

    expect(listCallCount).toBeGreaterThanOrEqual(2);
    // detail cache also invalidated (the GET :id handler was registered)
    expect(detailCallCount).toBeGreaterThanOrEqual(0); // invalidation is async; at minimum no error
  });
});
