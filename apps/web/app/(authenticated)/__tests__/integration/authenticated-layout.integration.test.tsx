import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithFreshClient } from "@/test/render-integration";
import { server } from "@/test/msw/server";
import { http, HttpResponse } from "msw";
import { mockAdminUser, mockViewerUser } from "@/test/msw/handlers/auth";
import AuthenticatedLayout from "../../layout";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

describe("AuthenticatedLayout integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when session returns an authenticated user", async () => {
    // authHandlers (default) returns 200 /me with ADMIN — already registered in server.ts
    renderWithFreshClient(
      <AuthenticatedLayout>
        <div>Protected content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to /login when /me returns 401", async () => {
    server.use(
      http.get("http://localhost:3001/v1/auth/me", () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    renderWithFreshClient(
      <AuthenticatedLayout>
        <div>Protected content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  // AS14 — role-based sidebar rendering
  it("AS14: ADMIN session renders AppSidebar with Admin section visible", async () => {
    // default handler returns mockAdminUser (ADMIN)
    renderWithFreshClient(
      <AuthenticatedLayout>
        <div>content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    });

    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("AS14: HR_VIEWER session renders AppSidebar without Admin section", async () => {
    server.use(
      http.get("http://localhost:3001/v1/auth/me", () =>
        HttpResponse.json(mockViewerUser),
      ),
    );

    renderWithFreshClient(
      <AuthenticatedLayout>
        <div>content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    });

    expect(screen.queryByText("Audit Log")).not.toBeInTheDocument();
    expect(screen.queryByText("User Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    // Unrestricted items still present
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });
});
