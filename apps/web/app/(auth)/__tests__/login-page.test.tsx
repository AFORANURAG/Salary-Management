import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/render";
import LoginPage from "../login/page";
import { ApiError } from "@salary-mgmt/store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, postLogin: vi.fn() };
});

import { postLogin } from "@salary-mgmt/store";
const mockPostLogin = postLogin as ReturnType<typeof vi.fn>;

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls postLogin with email and password on submit", async () => {
    mockPostLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "admin@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Test1234!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPostLogin).toHaveBeenCalledWith({
        email: "admin@acme.com",
        password: "Test1234!",
      });
    });
  });

  it("redirects to / on successful login", async () => {
    mockPostLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "admin@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Test1234!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows error banner on 401 response", async () => {
    mockPostLogin.mockRejectedValue(new ApiError("Unauthorized", 401));

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "bad@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not submit with an invalid email", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/password/i), "somepassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
    expect(mockPostLogin).not.toHaveBeenCalled();
  });
});
