import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/render";
import SetupPage from "../setup/page";
import { ApiError } from "@salary-mgmt/store";

const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

vi.mock("@salary-mgmt/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store")>();
  return { ...actual, postSetup: vi.fn() };
});

import { postSetup } from "@salary-mgmt/store";
const mockPostSetup = postSetup as ReturnType<typeof vi.fn>;

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows static error when token is missing from URL", () => {
    mockGet.mockReturnValue(null);

    render(<SetupPage />);

    expect(screen.getByText(/invalid invite link/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /activate/i })).not.toBeInTheDocument();
  });

  it("calls postSetup with token, name, and password on valid submit", async () => {
    mockGet.mockReturnValue("valid-token-uuid");
    mockPostSetup.mockResolvedValue(undefined);

    render(<SetupPage />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText("Password"), "NewPass1234!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "NewPass1234!");
    await userEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() => {
      expect(mockPostSetup).toHaveBeenCalledWith({
        token: "valid-token-uuid",
        name: "Jane Smith",
        password: "NewPass1234!",
      });
    });
  });

  it("redirects to /auth/login on success", async () => {
    mockGet.mockReturnValue("valid-token-uuid");
    mockPostSetup.mockResolvedValue(undefined);

    render(<SetupPage />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText("Password"), "NewPass1234!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "NewPass1234!");
    await userEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/auth/login?setup=success"),
    );
  });

  it("shows validation error when passwords do not match", async () => {
    mockGet.mockReturnValue("valid-token-uuid");

    render(<SetupPage />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText("Password"), "NewPass1234!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "Different5678!");
    await userEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
    expect(mockPostSetup).not.toHaveBeenCalled();
  });

  it("shows 410 error when invite link is expired", async () => {
    mockGet.mockReturnValue("expired-token-uuid");
    mockPostSetup.mockRejectedValue(new ApiError("Gone", 410));

    render(<SetupPage />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Smith");
    await userEvent.type(screen.getByLabelText("Password"), "NewPass1234!");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "NewPass1234!");
    await userEvent.click(screen.getByRole("button", { name: /activate/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/expired/i);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
