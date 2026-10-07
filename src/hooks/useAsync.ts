import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
  /** Lets a mutation update the cached value without refetching. */
  setData: (value: T | null) => void;
}

/**
 * Runs an async service call and exposes loading / error / data + retry.
 * Every screen that reads from a service uses this so loading and error states
 * are consistent across the app.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[]): AsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, error, reload, setData };
}
