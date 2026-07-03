import { render, type RenderOptions } from "@testing-library/react";
import { QueryProvider, createQueryClient } from "@salary-mgmt/store/query";
import type { ReactNode } from "react";

export function renderWithFreshClient(
  ui: ReactNode,
  options?: Omit<RenderOptions, "wrapper">
): ReturnType<typeof render> {
  const queryClient = createQueryClient({ queries: { retry: false, staleTime: 0 } });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryProvider client={queryClient} devtools={false}>
        {children}
      </QueryProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
