import { useRef, useCallback, MouseEvent } from 'react';

export interface GlossFXState {
  x: number;
  y: number;
  opacity: number;
}

/**
 * High-performance, zero-re-render gloss reflection hook.
 * Directly updates CSS custom properties (--gloss-x, --gloss-y, --gloss-opacity)
 * on the DOM element without triggering React reconciliation cycles on mouse move.
 */
export function useGlossFX() {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    el.style.setProperty('--gloss-x', `${x.toFixed(1)}%`);
    el.style.setProperty('--gloss-y', `${y.toFixed(1)}%`);
    el.style.setProperty('--gloss-opacity', '1');
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--gloss-opacity', '1');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--gloss-opacity', '0');
    }
  }, []);

  const glossStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at var(--gloss-x, 50%) var(--gloss-y, 50%), rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%)',
    opacity: 'var(--gloss-opacity, 0)',
    transition: 'opacity 0.25s ease-out',
  };

  return {
    cardRef,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    glossStyle,
    glossPos: { x: 50, y: 50, opacity: 0 },
  };
}
