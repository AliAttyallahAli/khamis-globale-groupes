// frontend/src/hooks/useApi.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { getErrorMessage } from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Hook API avancé avec :
 * - Loading / error / data
 * - Toast automatique (optionnel)
 * - Retry manuel
 * - Cache mémoire léger
 *
 * Usage :
 *   const { data, loading, error, execute } = useApi(
 *     (params) => produitsApi.list(params),
 *     { toast: true, cache: true }
 *   );
 *   await execute({ page: 1 });
 */
const CACHE = new Map();

export function useApi(fetcher, options = {}) {
  const {
    toastSuccess = null,
    toastError = true,
    cache = false,
    cacheKey = null,
    immediate = false,
    initialData = null,
  } = options;

  const [data, setData] = useState(
    cache && cacheKey && CACHE.has(cacheKey) ? CACHE.get(cacheKey) : initialData
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (params = {}) => {
    const key = cache && cacheKey ? `${cacheKey}:${JSON.stringify(params)}` : null;

    // Cache hit
    if (key && CACHE.has(key)) {
      const cached = CACHE.get(key);
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(params);

      if (mountedRef.current) {
        setData(result);
        if (key) CACHE.set(key, result);
        if (toastSuccess) toast.success(toastSuccess);
      }
      return result;
    } catch (err) {
      const msg = getErrorMessage(err, 'Une erreur est survenue');
      if (mountedRef.current) {
        setError(err);
        if (toastError) toast.error(msg);
      }
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher, cache, cacheKey, toastSuccess, toastError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  const invalidate = useCallback(() => {
    if (cacheKey) {
      for (const k of CACHE.keys()) {
        if (k.startsWith(`${cacheKey}:`)) CACHE.delete(k);
      }
    }
  }, [cacheKey]);

  useEffect(() => {
    if (immediate) execute().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, execute, reset, invalidate, setData };
}

// Helper : vider tout le cache
export function clearApiCache() {
  CACHE.clear();
}