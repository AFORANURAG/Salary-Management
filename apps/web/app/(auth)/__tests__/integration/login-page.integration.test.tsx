import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithFreshClient } from "@/test/render-integration";
import { server } from "@/test/msw/server";
import { authHandlersLoginFail } from "@/test/msw/handlers/auth";
import LoginPage from "../../login/page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

describe("LoginPage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successful login redirects to /", async () => {
    // default authHandlers return 200 for POST /login
    renderWithFreshClient(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "admin@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Test1234!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("failed login shows error banner and does not redirect", async () => {
    server.use(...authHandlersLoginFail);

    renderWithFreshClient(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "bad@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
