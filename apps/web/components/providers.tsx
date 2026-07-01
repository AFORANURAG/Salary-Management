"use client";

import { QueryProvider } from "@salary-mgmt/store/query";

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <QueryProvider>{children}</QueryProvider>;
}
