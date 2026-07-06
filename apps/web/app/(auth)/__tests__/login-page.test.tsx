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

const mockMutate = vi.fn();
let mockError: ApiError | null = null;
let mockIsPending = false;

vi.mock("@salary-mgmt/store/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store/query")>();
  return {
    ...actual,
    useLogin: () => ({
      mutate: mockMutate,
      isPending: mockIsPending,
      error: mockError,
      isSuccess: false,
      isError: mockError !== null,
    }),
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = null;
    mockIsPending = false;
  });

  it("calls mutate with email and password on submit", async () => {
    mockMutate.mockImplementation(() => {});
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "admin@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Test1234!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { email: "admin@acme.com", password: "Test1234!" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("redirects to / on successful login via onSuccess callback", async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "admin@acme.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Test1234!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });

  it("shows error banner when login.error is a 401", async () => {
    mockError = new ApiError("Unauthorized", 401);
    render(<LoginPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("shows generic error banner for non-401 errors", async () => {
    mockError = new ApiError("Server Error", 500);
    render(<LoginPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("disables submit button while isPending", () => {
    mockIsPending = true;
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });

  it("does not call mutate with an invalid email", async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/password/i), "somepassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
