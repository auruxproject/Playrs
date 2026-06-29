"use client";

import { useState, useCallback } from "react";

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T, P extends unknown[]> extends UseAsyncState<T> {
  execute: (...args: P) => Promise<T>;
  reset: () => void;
}

export function useAsync<T, P extends unknown[] = []>(
  asyncFunction: (...args: P) => Promise<T>
): UseAsyncReturn<T, P> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P): Promise<T> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: errorObj });
        throw errorObj;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
