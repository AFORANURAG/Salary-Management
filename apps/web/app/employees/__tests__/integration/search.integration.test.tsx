import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { createQueryClient, QueryProvider } from "@salary-mgmt/store/query";
import { mockPage } from "@/test/msw/handlers/employees";
import EmployeesPage from "../../page";
import { useState, useCallback } from "react";

// Stateful wrapper: router.replace calls update React state so the component
// re-renders with new searchParams (simulates Next.js router navigation).
function SearchTestWrapper() {
  const [params, setParams] = useState(new URLSearchParams());
  const replace = useCallback((url: string) => {
    const qs = url.includes("?") ? url.split("?")[1] : "";
    setParams(new URLSearchParams(qs));
  }, []);

  const queryClient = createQueryClient({ queries: { retry: false, staleTime: 0 } });

  return (
    <QueryProvider client={queryClient} devtools={false}>
      <RouterContext.Provider value={{ params, replace }}>
        <EmployeesPage />
      </RouterContext.Provider>
    </QueryProvider>
  );
}

// React context so the navigation mock can read/write state from the wrapper
import { createContext, useContext } from "react";
const RouterContext = createContext<{
  params: URLSearchParams;
  replace: (url: string) => void;
}>({ params: new URLSearchParams(), replace: () => {} });

vi.mock("next/navigation", () => ({
  useRouter: () => {
    const ctx = useContext(RouterContext);
    return { push: vi.fn(), replace: ctx.replace };
  },
  useSearchParams: () => {
    const ctx = useContext(RouterContext);
    return ctx.params;
  },
}));

describe("EF19 – search triggers re-query with q param", () => {
  it("issues a new GET request with ?q=alice after the debounce fires", async () => {
    const capturedUrls: string[] = [];

    server.use(
      http.get("http://localhost:3001/v1/employees", ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json(mockPage);
      })
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<SearchTestWrapper />);

    // Wait for the initial load
    await waitFor(() =>
      expect(screen.getByText(mockPage.data[0]!.name)).toBeInTheDocument()
    );

    const searchBox = screen.getByRole("searchbox");
    await user.clear(searchBox);
    await user.type(searchBox, "alice");

    // Advance past the 400 ms debounce
    act(() => { vi.advanceTimersByTime(500); });

    await waitFor(() => {
      const searchRequests = capturedUrls.filter((u) =>
        new URL(u).searchParams.get("q") === "alice"
      );
      expect(searchRequests.length).toBeGreaterThan(0);
    });

    vi.useRealTimers();
  });
});
