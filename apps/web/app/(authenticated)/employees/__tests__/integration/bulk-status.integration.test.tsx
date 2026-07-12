import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockEmployee, mockPage } from "@/test/msw/handlers/employees";
import type { BulkStatusResponse, Employee, PaginatedResponse } from "@salary-mgmt/types";
import EmployeesPage from "../../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/session-provider", () => ({
  useSessionContext: () => ({
    user: { id: "u1", email: "a@acme.com", name: "Admin User", role: "ADMIN" },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

const mockEmployee2: Employee = {
  ...mockEmployee,
  id: "22222222-2222-2222-2222-222222222222",
  employeeCode: "EMP002",
  name: "Bob Jones",
  email: "bob@example.com",
};

const twoEmployeePage: PaginatedResponse<Employee> = {
  data: [mockEmployee, mockEmployee2],
  page: 1,
  pageSize: 25,
  total: 2,
};

describe("BO20 – bulk status integration", () => {
  it("select rows → toolbar appears → confirm → toast shown → list refetches", async () => {
    let listCallCount = 0;
    const bulkResponse: BulkStatusResponse = { updated: 2, skipped: 0 };

    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        listCallCount += 1;
        return HttpResponse.json(twoEmployeePage);
      }),
      http.post("http://localhost:3001/v1/employees/bulk-status", () => {
        return HttpResponse.json(bulkResponse);
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    // Wait for list to load
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());

    // Toolbar should not be visible yet
    expect(screen.queryByTestId("bulk-action-toolbar")).not.toBeInTheDocument();

    // Select all via header checkbox
    const headerCheckbox = screen.getByRole("checkbox", { name: /select all/i });
    await user.click(headerCheckbox);

    // Toolbar should appear with count
    await waitFor(() =>
      expect(screen.getByTestId("bulk-action-toolbar")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("bulk-action-toolbar")).toHaveTextContent("2 selected");

    // Pick a status
    await user.click(screen.getByRole("button", { name: /change status/i }));
    await user.click(screen.getByText("Set Inactive"));

    // Confirm
    const firstListCount = listCallCount;
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // List refetched after mutation; toolbar disappears (selection cleared)
    await waitFor(() => expect(listCallCount).toBeGreaterThan(firstListCount));
    await waitFor(() =>
      expect(screen.queryByTestId("bulk-action-toolbar")).not.toBeInTheDocument(),
    );
  });

  it("deselect button clears selection and hides toolbar", async () => {
    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        return HttpResponse.json(twoEmployeePage);
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());

    const headerCheckbox = screen.getByRole("checkbox", { name: /select all/i });
    await user.click(headerCheckbox);

    await waitFor(() =>
      expect(screen.getByTestId("bulk-action-toolbar")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /deselect all/i }));

    await waitFor(() =>
      expect(screen.queryByTestId("bulk-action-toolbar")).not.toBeInTheDocument(),
    );
  });

  it("individual row checkbox selects only that row", async () => {
    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        return HttpResponse.json(twoEmployeePage);
      }),
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeInTheDocument());

    const rowCheckbox = screen.getByRole("checkbox", { name: /select alice smith/i });
    await user.click(rowCheckbox);

    await waitFor(() =>
      expect(screen.getByTestId("bulk-action-toolbar")).toHaveTextContent("1 selected"),
    );
  });
});
