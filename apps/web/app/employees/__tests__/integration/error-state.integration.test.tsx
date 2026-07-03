import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import EmployeesPage from "../../page";


vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EF24 – 5xx from MSW causes error state on list page", () => {
  it("renders the error state when GET /v1/employees returns 500", async () => {
    server.use(
      http.get("http://localhost:3001/v1/employees", () => {
        return HttpResponse.json({ message: "Internal server error" }, { status: 500 });
      })
    );

    renderWithFreshClient(<EmployeesPage />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load employees/i)).toBeInTheDocument()
    );
  });
});
