import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPage } from "@/test/msw/handlers/employees";
import EmployeesPage from "../../page";


// next/navigation is not available in jsdom; provide minimal stubs
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EF18 – list page renders via real useEmployees hook + MSW", () => {
  it("renders employee rows returned by GET /v1/employees", async () => {
    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText(mockPage.data[0]!.name)).toBeInTheDocument()
    );

    expect(screen.getByText(mockPage.data[0]!.employeeCode)).toBeInTheDocument();
    expect(screen.getByText(mockPage.data[0]!.email)).toBeInTheDocument();
  });

  it("renders loading skeleton while the request is in flight", () => {
    // Delay the response so the skeleton is visible on first render
    server.use(
      http.get("http://localhost:3001/v1/employees", async () => {
        await new Promise(() => {}); // never resolves in this test
      })
    );

    renderWithFreshClient(<EmployeesPage />);

    expect(screen.getByTestId("employee-list-skeleton")).toBeInTheDocument();
  });
});
