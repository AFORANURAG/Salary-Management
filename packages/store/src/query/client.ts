import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CORE_ERROR_MESSAGES } from "@salary-mgmt/errors";
import { ApiError } from "../api/client";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      suppressErrorToast?: boolean;
    };
    mutationMeta: {
      successMessage?: string;
      suppressErrorToast?: boolean;
    };
  }
}

function toastMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return CORE_ERROR_MESSAGES.NETWORK_ERROR;
}

/**
 * Default stale times in milliseconds.
 * Use these constants to keep query configs consistent across the app.
 */
export const STALE_TIMES = {
  /** Data that rarely changes (user profile, config) */
  STATIC: 1000 * 60 * 10, // 10 minutes
  /** Standard data (lists, details) */
  DEFAULT: 1000 * 60 * 2, // 2 minutes
  /** Frequently changing data (notifications, feeds) */
  FREQUENT: 1000 * 30, // 30 seconds
  /** Never mark as stale (cache indefinitely until invalidation) */
  INFINITE: Infinity,
  DYNAMIC: 1000 * 60 * 1, // 1 minute
} as const;

export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  DEFAULT: 1000 * 60 * 10, // 10 minutes
  LONG: 1000 * 60 * 60, // 1 hour
} as const;

interface QueryOverrides {
  queries?: {
    retry?: boolean | number | ((failureCount: number, error: unknown) => boolean);
    staleTime?: number;
  };
}

export function createQueryClient(overrides?: QueryOverrides): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (query.meta?.suppressErrorToast) return;
        toast.error(toastMessage(error));
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _vars, _ctx, mutation) {
        if (mutation.meta?.suppressErrorToast) return;
        toast.error(toastMessage(error));
      },
      onSuccess(_data, _vars, _ctx, mutation) {
        const msg = mutation.meta?.successMessage;
        if (msg) toast.success(msg);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.DEFAULT,
        gcTime: CACHE_TIMES.DEFAULT,
        retry: (failureCount, error) => {
          if (error instanceof Error && "status" in error) {
            const status = (error as Error & { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        ...overrides?.queries,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Singleton query client for use outside React (e.g. prefetching in server components) */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new client to avoid sharing state between requests
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
