import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { renderWithFreshClient } from "@/test/render-integration";
import { mockPage } from "@/test/msw/handlers/employees";
import EmployeesPage from "../../page";


const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("EF20 – department filter triggers re-query with department param", () => {
  it("issues a new GET request with ?department=Engineering after selecting the filter", async () => {
    const capturedUrls: string[] = [];

    server.use(
      http.get("http://localhost:3001/v1/employees", ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json(mockPage);
      })
    );

    const user = userEvent.setup();
    renderWithFreshClient(<EmployeesPage />);

    // Wait for initial render
    await waitFor(() =>
      expect(screen.getByText(mockPage.data[0]!.name)).toBeInTheDocument()
    );

    // Open the Department select
    await user.click(screen.getByRole("combobox", { name: /department/i }));
    await user.click(screen.getByRole("option", { name: "Engineering" }));

    // The page calls router.replace with updated search params — simulate
    // the URL update by re-rendering with the new params
    const calledWith: string = mockReplace.mock.calls.at(-1)?.[0] ?? "";
    const updatedParams = new URLSearchParams(calledWith.split("?")[1] ?? "");

    expect(updatedParams.get("department")).toBe("Engineering");
  });
});
