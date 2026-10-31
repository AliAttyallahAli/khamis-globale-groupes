// frontend/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Debounce une valeur (utile pour les recherches)
 *
 * Usage :
 *   const debouncedSearch = useDebounce(search, 300);
 *   useEffect(() => { fetch(debouncedSearch) }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}