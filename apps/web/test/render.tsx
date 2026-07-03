import { render, type RenderOptions } from "@testing-library/react";
import { QueryProvider } from "@salary-mgmt/store/query";
import type { ReactNode } from "react";

function TestProviders({ children }: { children: ReactNode }) {
  return <QueryProvider devtools={false}>{children}</QueryProvider>;
}

function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, "wrapper">
): ReturnType<typeof render> {
  return render(ui, { wrapper: TestProviders, ...options });
}

export { renderWithProviders as render };
export * from "@testing-library/react";
