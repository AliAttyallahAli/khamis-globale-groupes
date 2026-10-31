// frontend/src/hooks/useCountUp.js
import { useState, useEffect, useRef } from 'react';

/**
 * Anime un nombre (utile pour les KPIs)
 */
export function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) {
      setCount(0);
      return;
    }
    if (target === 0) {
      setCount(0);
      return;
    }

    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(target * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}