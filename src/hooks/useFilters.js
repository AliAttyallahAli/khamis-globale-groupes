// frontend/src/hooks/useFilters.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook réutilisable pour gérer les filtres d'une page
 *
 * Usage :
 *   const filters = useFilters({ search: '', category_id: '' });
 *   filters.values.search
 *   filters.set('search', 'abc')
 *   filters.reset()
 *   filters.hasActiveFilters
 */
export function useFilters(initialValues = {}) {
  const [values, setValues] = useState(initialValues);
  const [initial] = useState(initialValues);

  const set = useCallback((key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const setMultiple = useCallback((patch) => {
    setValues((v) => ({ ...v, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
  }, [initial]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(values).some(([key, val]) => {
      const init = initial[key];
      if (val === init) return false;
      if (val === '' || val === null || val === undefined) return false;
      if (typeof val === 'string' && val.trim() === '') return false;
      return true;
    });
  }, [values, initial]);

  const activeCount = useMemo(() => {
    return Object.entries(values).filter(([key, val]) => {
      const init = initial[key];
      if (val === init) return false;
      if (val === '' || val === null || val === undefined) return false;
      if (typeof val === 'string' && val.trim() === '') return false;
      return true;
    }).length;
  }, [values, initial]);

  return { values, set, setMultiple, reset, hasActiveFilters, activeCount };
}