import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useSession } from "../query/session";
import { ApiError } from "../api/client";
import { wrapper } from "./test-utils";

vi.mock("../api/auth", () => ({
  getMe: vi.fn(),
}));

import { getMe } from "../api/auth";
const mockGetMe = getMe as ReturnType<typeof vi.fn>;

describe("useSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns isAuthenticated: true with the user when /me resolves", async () => {
    const user = { id: "u1", email: "admin@acme.com", name: "Admin", role: "ADMIN" as const };
    mockGetMe.mockResolvedValue(user);

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  it("returns isAuthenticated: false when /me returns 401", async () => {
    mockGetMe.mockRejectedValue(new ApiError("Unauthorized", 401));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("returns isAuthenticated: false when /me returns any other error", async () => {
    mockGetMe.mockRejectedValue(new ApiError("Internal Server Error", 500));

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("starts in isLoading: true before the query resolves", () => {
    mockGetMe.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
