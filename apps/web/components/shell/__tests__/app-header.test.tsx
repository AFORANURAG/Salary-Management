import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/render";
import { AppHeader } from "../app-header";
import { UserMenu } from "../user-menu";
import type { AuthMeResponse } from "@salary-mgmt/types";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/components/session-provider", () => ({
  useSessionContext: vi.fn(),
}));

const mockPostLogout = vi.fn(() => Promise.resolve());
vi.mock("@salary-mgmt/store", () => ({
  postLogout: () => mockPostLogout(),
}));

const mockRemoveQueries = vi.fn();
vi.mock("@salary-mgmt/store/query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@salary-mgmt/store/query")>();
  return {
    ...actual,
    useQueryClient: () => ({ removeQueries: mockRemoveQueries }),
    queryKeys: actual.queryKeys,
  };
});

import { useSessionContext } from "@/components/session-provider";
const mockUseSessionContext = useSessionContext as ReturnType<typeof vi.fn>;

function makeSession(role: AuthMeResponse["role"]): ReturnType<typeof useSessionContext> {
  return {
    user: { id: "u1", email: "a@acme.com", name: "Anurag Upadhyay", role },
    isLoading: false,
    isAuthenticated: true,
  };
}

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/");
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
  });

  it("renders logo wordmark", () => {
    render(<AppHeader />);
    expect(screen.getByText("ACME HRMS")).toBeInTheDocument();
  });

  it("shows Dashboard as page title when pathname is /", () => {
    mockPathname.mockReturnValue("/");
    render(<AppHeader />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Dashboard");
  });

  it("shows Employees as page title when pathname is /employees", () => {
    mockPathname.mockReturnValue("/employees");
    render(<AppHeader />);
    expect(screen.getByTestId("page-title")).toHaveTextContent("Employees");
  });

  it("renders notification bell", () => {
    render(<AppHeader />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("renders user menu trigger", () => {
    render(<AppHeader />);
    expect(screen.getByRole("button", { name: /user menu/i })).toBeInTheDocument();
  });
});

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
  });

  it("shows correct initials for two-word name", () => {
    render(<UserMenu />);
    expect(screen.getByTestId("user-menu-trigger")).toHaveTextContent("AU");
  });

  it("shows name and role badge when menu is opened", async () => {
    render(<UserMenu />);
    await userEvent.click(screen.getByTestId("user-menu-trigger"));
    expect(screen.getByTestId("user-menu-name")).toHaveTextContent("Anurag Upadhyay");
    expect(screen.getByTestId("user-menu-role-badge")).toHaveTextContent("ADMIN");
  });

  it("role badge variant is destructive for ADMIN", async () => {
    render(<UserMenu />);
    await userEvent.click(screen.getByTestId("user-menu-trigger"));
    const badge = screen.getByTestId("user-menu-role-badge");
    // shadcn Badge with variant=destructive gets bg-destructive class
    expect(badge.className).toMatch(/destructive/);
  });

  it("role badge variant is default for HR_MANAGER", async () => {
    mockUseSessionContext.mockReturnValue(makeSession("HR_MANAGER"));
    render(<UserMenu />);
    await userEvent.click(screen.getByTestId("user-menu-trigger"));
    const badge = screen.getByTestId("user-menu-role-badge");
    expect(badge.className).not.toMatch(/destructive/);
    expect(badge.className).not.toMatch(/secondary/);
  });

  it("role badge variant is secondary for HR_VIEWER", async () => {
    mockUseSessionContext.mockReturnValue(makeSession("HR_VIEWER"));
    render(<UserMenu />);
    await userEvent.click(screen.getByTestId("user-menu-trigger"));
    const badge = screen.getByTestId("user-menu-role-badge");
    expect(badge.className).toMatch(/secondary/);
  });

  it("calls postLogout, removeQueries, and redirects to /login on sign out", async () => {
    render(<UserMenu />);
    await userEvent.click(screen.getByTestId("user-menu-trigger"));
    await userEvent.click(screen.getByTestId("sign-out-item"));

    expect(mockPostLogout).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      expect(mockRemoveQueries).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
