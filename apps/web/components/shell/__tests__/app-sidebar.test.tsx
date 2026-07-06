import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/render";
import { AppSidebar } from "../app-sidebar";
import type { AuthMeResponse } from "@salary-mgmt/types";

const mockPush = vi.fn();
const mockPathname = vi.fn(() => "/employees");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/components/session-provider", () => ({
  useSessionContext: vi.fn(),
}));

const mockSetCollapsed = vi.fn();
const mockCollapsedState = vi.fn(() => false);

vi.mock("@salary-mgmt/store/hooks", () => ({
  useLocalStorage: (_key: string, _initial: boolean) => [
    mockCollapsedState(),
    mockSetCollapsed,
    vi.fn(),
  ],
}));

import { useSessionContext } from "@/components/session-provider";
const mockUseSessionContext = useSessionContext as ReturnType<typeof vi.fn>;

function makeSession(role: AuthMeResponse["role"]): ReturnType<typeof useSessionContext> {
  return {
    user: { id: "u1", email: "a@acme.com", name: "Admin User", role },
    isLoading: false,
    isAuthenticated: true,
  };
}

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollapsedState.mockReturnValue(false);
    mockPathname.mockReturnValue("/employees");
  });

  it("renders all nav items for ADMIN", () => {
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
    render(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Bulk Operations")).toBeInTheDocument();
    expect(screen.getByText("Run Payroll")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("does not render Admin section for HR_MANAGER", () => {
    mockUseSessionContext.mockReturnValue(makeSession("HR_MANAGER"));
    render(<AppSidebar />);

    expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.getByText("Bulk Operations")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("does not render Admin section or role-restricted items for HR_VIEWER", () => {
    mockUseSessionContext.mockReturnValue(makeSession("HR_VIEWER"));
    render(<AppSidebar />);

    expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Bulk Operations")).not.toBeInTheDocument();
    expect(screen.queryByText("Export")).not.toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("marks the current route link as active and others as inactive", () => {
    mockPathname.mockReturnValue("/employees");
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
    render(<AppSidebar />);

    const employeesLink = screen.getByRole("link", { name: /^employees$/i });
    expect(employeesLink).toHaveAttribute("data-active", "true");

    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("data-active", "false");
  });

  it("hides text labels when collapsed", () => {
    mockCollapsedState.mockReturnValue(true);
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
    render(<AppSidebar />);

    expect(screen.queryByText("Employees")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it("calls setCollapsed when collapse toggle is clicked", async () => {
    mockCollapsedState.mockReturnValue(false);
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
    render(<AppSidebar />);

    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    await userEvent.click(toggle);

    expect(mockSetCollapsed).toHaveBeenCalledOnce();
  });

  it("shows expand button when collapsed and calls setCollapsed on click", async () => {
    mockCollapsedState.mockReturnValue(true);
    mockUseSessionContext.mockReturnValue(makeSession("ADMIN"));
    render(<AppSidebar />);

    const expandBtn = screen.getByRole("button", { name: /expand sidebar/i });
    await userEvent.click(expandBtn);

    expect(mockSetCollapsed).toHaveBeenCalledOnce();
  });
});
