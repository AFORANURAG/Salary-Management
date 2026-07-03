"use client";

import { useState, type ReactNode } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "./client";

interface QueryProviderProps {
  children: ReactNode;
  /** Show React Query Devtools. Defaults to true in development. */
  devtools?: boolean;
  /** Provide a pre-configured QueryClient (e.g. in tests). If omitted, one is created on mount. */
  client?: QueryClient;
}

export function QueryProvider({ children, devtools, client }: QueryProviderProps) {
  const [queryClient] = useState<QueryClient>(() => client ?? createQueryClient());

  const showDevtools = devtools ?? process.env.NODE_ENV === "development";

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
