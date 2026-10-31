// frontend/src/hooks/usePagination.js
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook réutilisable pour la pagination
 *
 * Usage :
 *   const pag = usePagination({ initialPage: 1, initialLimit: 20 });
 *   pag.page, pag.limit, pag.setPage, pag.setLimit
 *   pag.setPagination(response.pagination)
 */
export function usePagination({ initialPage = 1, initialLimit = 20 } = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const goToPage = useCallback((p) => {
    if (p < 1) return;
    if (totalPages > 0 && p > totalPages) return;
    setPage(p);
  }, [totalPages]);

  const next = useCallback(() => {
    if (page < totalPages) setPage(page + 1);
  }, [page, totalPages]);

  const prev = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page]);

  const setLimit = useCallback((newLimit) => {
    setLimitState(newLimit);
    setPage(1); // reset à la page 1
  }, []);

  const setPagination = useCallback((pagination = {}) => {
    setTotal(pagination.total || 0);
    setTotalPages(pagination.totalPages || 0);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimitState(initialLimit);
    setTotal(0);
    setTotalPages(0);
  }, [initialPage, initialLimit]);

  const range = useMemo(() => {
    if (total === 0) return { start: 0, end: 0 };
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return { start, end };
  }, [page, limit, total]);

  return {
    page, limit, total, totalPages,
    setPage: goToPage,
    setLimit,
    setPagination,
    next, prev, reset,
    range,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}