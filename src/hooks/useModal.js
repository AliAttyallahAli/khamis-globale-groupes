// frontend/src/hooks/useModal.js
import { useState, useCallback } from 'react';

/**
 * Hook réutilisable pour gérer l'ouverture/fermeture de modales
 *
 * Usage :
 *   const createModal = useModal();
 *   createModal.open();
 *   createModal.close();
 *   createModal.isOpen
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const open = useCallback((d = null) => {
    setData(d);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset data après animation
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  return { isOpen, data, open, close, toggle, setData };
}