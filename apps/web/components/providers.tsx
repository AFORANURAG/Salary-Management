"use client";

import { QueryProvider } from "@salary-mgmt/store/query";
import { Toaster } from "@salary-mgmt/ui";

export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
