"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthMeResponse, LoginRequest } from "@salary-mgmt/types";
import { getMe, postLogin, postLogout } from "../api/auth";
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
    meta: { suppressErrorToast: true },
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: data !== undefined,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, LoginRequest>({
    meta: { suppressErrorToast: true },
    mutationFn: postLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session.all() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    meta: { suppressErrorToast: true },
    mutationFn: postLogout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
