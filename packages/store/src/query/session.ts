"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthMeResponse } from "@salary-mgmt/types";
import { getMe } from "../api/auth";
import { ApiError } from "../api/client";
import { queryKeys } from "./keys";

export interface SessionState {
  user: AuthMeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useSession(): SessionState {
  const { data, isLoading } = useQuery<AuthMeResponse, ApiError>({
    queryKey: queryKeys.session.all(),
    queryFn: getMe,
    staleTime: Infinity,
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: data !== undefined,
  };
}
