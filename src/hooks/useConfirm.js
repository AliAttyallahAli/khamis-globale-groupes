// frontend/src/hooks/useConfirm.js
import { useState, useCallback } from 'react';

/**
 * Hook pour une modale de confirmation réutilisable
 *
 * Usage :
 *   const confirm = useConfirm();
 *   const ok = await confirm.ask({
 *     title: 'Supprimer ?',
 *     message: 'Cette action est irréversible',
 *     variant: 'danger',
 *   });
 *   if (ok) { doDelete(); }
 */
export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'primary',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    resolve: null,
  });

  const ask = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title || 'Confirmation',
        message: opts.message || 'Êtes-vous sûr ?',
        variant: opts.variant || 'primary',
        confirmLabel: opts.confirmLabel || 'Confirmer',
        cancelLabel: opts.cancelLabel || 'Annuler',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) state.resolve(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    if (state.resolve) state.resolve(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  return {
    state,
    ask,
    handleConfirm,
    handleCancel,
  };
}