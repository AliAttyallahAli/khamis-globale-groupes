// frontend/src/hooks/useFetch.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook générique pour les appels API
 *
 * Usage :
 *   const { data, loading, error, refetch } = useFetch(
 *     () => produitsApi.list({ page: 1 }),
 *     []
 *   );
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
      return result;
    } catch (err) {
      if (mountedRef.current) setError(err);
      throw err;
    } finally {
      if (mountedRef.current && showLoading) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback((showLoading = true) => execute(showLoading), [execute]);

  return { data, loading, error, refetch, setData };
}