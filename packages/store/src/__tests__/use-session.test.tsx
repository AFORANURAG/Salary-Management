import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useSession, useLogin, useLogout } from "../query/session";
import { ApiError } from "../api/client";
import { wrapper } from "./test-utils";

vi.mock("../api/auth", () => ({
  getMe: vi.fn(),
  postLogin: vi.fn(),
  postLogout: vi.fn(),
}));

import { getMe, postLogin, postLogout } from "../api/auth";
const mockGetMe = getMe as ReturnType<typeof vi.fn>;
const mockPostLogin = postLogin as ReturnType<typeof vi.fn>;
const mockPostLogout = postLogout as ReturnType<typeof vi.fn>;

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

describe("useLogin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetMe.mockResolvedValue({ id: "u1", email: "admin@acme.com", name: "Admin", role: "ADMIN" });
  });

  it("is idle and not pending before mutate is called", () => {
    const { result } = renderHook(() => useLogin(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("isPending is true while the mutation is in-flight", async () => {
    let resolve: () => void;
    mockPostLogin.mockReturnValue(new Promise<void>((r) => { resolve = r; }));

    const { result } = renderHook(() => useLogin(), { wrapper });

    // mutateAsync lets us observe isPending without act() flushing it immediately
    let mutatePromise: Promise<void>;
    act(() => { mutatePromise = result.current.mutateAsync({ email: "admin@acme.com", password: "pass" }); });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => { resolve!(); await mutatePromise; });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("calls postLogin with the supplied credentials and succeeds", async () => {
    mockPostLogin.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "admin@acme.com", password: "pass" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPostLogin).toHaveBeenCalledOnce();
    expect(mockPostLogin.mock.calls[0]?.[0]).toEqual({ email: "admin@acme.com", password: "pass" });
  });

  it("exposes ApiError on failure", async () => {
    mockPostLogin.mockRejectedValue(new ApiError("Invalid credentials", 401));

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "admin@acme.com", password: "wrong" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(401);
  });
});

describe("useLogout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetMe.mockResolvedValue({ id: "u1", email: "admin@acme.com", name: "Admin", role: "ADMIN" });
  });

  it("calls postLogout and succeeds", async () => {
    mockPostLogout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => { result.current.mutate(); });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPostLogout).toHaveBeenCalledTimes(1);
  });
});
