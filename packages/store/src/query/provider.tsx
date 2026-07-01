"use client";

import { useState, type ReactNode } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "./client";

interface QueryProviderProps {
  children: ReactNode;
  /** Show React Query Devtools. Defaults to true in development. */
  devtools?: boolean;
}

export function QueryProvider({ children, devtools }: QueryProviderProps) {
  // Create the client once per component mount (avoids sharing between SSR requests)
  const [queryClient] = useState<QueryClient>(() => createQueryClient());

  const showDevtools = devtools ?? process.env.NODE_ENV === "development";

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
