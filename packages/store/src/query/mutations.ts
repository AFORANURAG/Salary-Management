"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { ApiError } from "../api/client";

/**
 * Options for `useOptimisticMutation`.
 * Wraps TanStack's `useMutation` with automatic cache rollback on error.
 */
export interface OptimisticMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /** Query keys to invalidate after a successful mutation */
  invalidateKeys?: readonly unknown[][];
}

/**
 * A `useMutation` wrapper that:
 * 1. Invalidates specified query keys on success
 * 2. Provides a typed error via `ApiError`
 */
export function useOptimisticMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: OptimisticMutationOptions<TData, ApiError, TVariables, TContext>
): UseMutationResult<TData, ApiError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, ...rest } = options;

  return useMutation<TData, ApiError, TVariables, TContext>({
    ...rest,
    // Use spread to stay compatible with TanStack Query v5's 4-arg onSuccess signature
    onSuccess: async (...args) => {
      await Promise.all(
        invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
      );
      await onSuccess?.(...args);
    },
  });
}
