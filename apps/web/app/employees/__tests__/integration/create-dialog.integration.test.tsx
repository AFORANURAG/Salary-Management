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

describe("EF21 – create dialog: POST intercepted; list re-fetches on success", () => {
  it("list refetches and shows the new employee after a successful create", async () => {
    const newEmployee: Employee = {
      ...mockEmployee,
      id: "22222222-2222-2222-2222-222222222222",
      employeeCode: "EMP002",
      name: "Bob Jones",
      email: "bob@example.com",
    };

    let listCallCount = 0;

    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        listCallCount += 1;
        const page: PaginatedResponse<Employee> =
          listCallCount === 1
            ? mockPage
            : { data: [mockEmployee, newEmployee], page: 1, pageSize: 25, total: 2 };
        return HttpResponse.json(page);
      }),
      http.post("http://localhost:3001/v1/employees", () => {
        return HttpResponse.json(newEmployee, { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText(mockEmployee.name)).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /add employee/i }));

    // Use within(dialog) to avoid ambiguity with page-level filter controls
    const { within } = await import("@testing-library/react");
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/employee code/i), "EMP002");
    await user.type(within(dialog).getByLabelText(/full name/i), "Bob Jones");
    await user.type(within(dialog).getByLabelText(/email/i), "bob@example.com");
    await user.click(within(dialog).getByRole("combobox", { name: /department/i }));
    await user.click(screen.getByRole("option", { name: "Engineering" }));
    await user.type(within(dialog).getByLabelText(/designation/i), "PM");
    await user.type(within(dialog).getByLabelText(/country/i), "US");
    await user.type(within(dialog).getByLabelText(/currency/i), "USD");
    await user.type(within(dialog).getByLabelText(/joining date/i), "2024-01-01");

    await user.click(screen.getByRole("button", { name: /create/i }));

    // List should re-fetch after mutation succeeds; new employee appears
    await waitFor(() =>
      expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    );

    expect(listCallCount).toBeGreaterThanOrEqual(2);
  });
});
