// frontend/src/hooks/useKeyboard.js
import { useEffect } from 'react';

/**
 * Raccourcis clavier globaux
 *
 * Usage :
 *   useKeyboard({ 'ctrl+k': () => openSearch(), 'escape': () => closeModal() });
 */
export function useKeyboard(shortcuts = {}) {
  useEffect(() => {
    const handler = (e) => {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());

      const combo = parts.join('+');
      const fn = shortcuts[combo];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}