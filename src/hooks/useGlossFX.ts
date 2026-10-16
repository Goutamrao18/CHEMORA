import { useState, useRef, useCallback, MouseEvent } from 'react';

export interface GlossFXState {
  x: number;
  y: number;
  opacity: number;
}

export function useGlossFX() {
  const [glossPos, setGlossPos] = useState<GlossFXState>({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setGlossPos({ x, y, opacity: 1 });
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setGlossPos((prev) => ({ ...prev, opacity: 1 }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setGlossPos((prev) => ({ ...prev, opacity: 0 }));
    });
  }, []);

  const glossStyle = {
    background: `radial-gradient(circle at ${glossPos.x}% ${glossPos.y}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%)`,
    opacity: glossPos.opacity,
    transition: glossPos.opacity === 0 ? 'opacity 0.4s ease-out' : 'opacity 0.15s ease-in',
  };

  return {
    cardRef,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    glossStyle,
    glossPos,
  };
}
