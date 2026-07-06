import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/render";
import { AppHeader } from "../app-header";

const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/components/session-provider", () => ({
  useSessionContext: vi.fn(() => ({
    user: { id: "u1", email: "a@acme.com", name: "Admin User", role: "ADMIN" },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

vi.mock("@salary-mgmt/store", () => ({ postLogout: vi.fn(() => Promise.resolve()) }));
vi.mock("@salary-mgmt/store/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store/query")>();
  return { ...actual, useQueryClient: () => ({ removeQueries: vi.fn() }) };
});

describe("AppHeader — hamburger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/");
  });

  it("renders hamburger button when onMenuClick is provided", () => {
    render(<AppHeader onMenuClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /open navigation/i })).toBeInTheDocument();
  });

  it("does not render hamburger when onMenuClick is not provided", () => {
    render(<AppHeader />);
    expect(screen.queryByRole("button", { name: /open navigation/i })).not.toBeInTheDocument();
  });

  it("calls onMenuClick when hamburger is clicked", async () => {
    const onMenuClick = vi.fn();
    render(<AppHeader onMenuClick={onMenuClick} />);
    await userEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    expect(onMenuClick).toHaveBeenCalledOnce();
  });
});
