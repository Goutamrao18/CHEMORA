import React, { useEffect, useState, useRef } from 'react';

interface BubbleTransitionProps {
  isTransitioning: boolean;
  onSwapView: () => void;
  onComplete: () => void;
}

export const BubbleTransition: React.FC<BubbleTransitionProps> = ({
  isTransitioning,
  onSwapView,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'covering' | 'revealing'>('idle');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const onSwapViewRef = useRef(onSwapView);
  const onCompleteRef = useRef(onComplete);

  onSwapViewRef.current = onSwapView;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } catch {
      return undefined;
    }
  }, []);

  // Browser back/forward cache safety (pageshow persisted)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setPhase('idle');
        onCompleteRef.current();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      setPhase('idle');
      return;
    }

    // If reduced motion is preferred, use a brief 200ms opacity crossfade
    if (prefersReducedMotion) {
      setPhase('covering');
      const swapTimer = setTimeout(() => {
        onSwapViewRef.current();
        setPhase('revealing');
      }, 100);
      const endTimer = setTimeout(() => {
        setPhase('idle');
        onCompleteRef.current();
      }, 200);
      return () => {
        clearTimeout(swapTimer);
        clearTimeout(endTimer);
      };
    }

    // Standard Bubble Transition: 1000ms total
    // 0ms -> 450ms: Circles cover screen
    // 450ms: Swap view
    // 450ms -> 1000ms: Circles sweep off revealing new view
    setPhase('covering');

    const swapTimer = setTimeout(() => {
      onSwapViewRef.current();
      setPhase('revealing');
    }, 480);

    const endTimer = setTimeout(() => {
      setPhase('idle');
      onCompleteRef.current();
    }, 1000);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
    };
  }, [isTransitioning, prefersReducedMotion]);

  if (phase === 'idle') return null;

  if (prefersReducedMotion) {
    return (
      <div
        className={`fixed inset-0 z-[99999] bg-[#020816] pointer-events-none transition-opacity duration-200 ${
          phase === 'covering' ? 'opacity-90' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[99999] pointer-events-auto overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Circle 1 - Primary Cyan (#14a3c4) */}
      <div
        className="bubble-transition-circle bubble-cyan"
        style={{
          animation: 'chemoraBubbleSweep 1000ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
      />

      {/* Circle 2 - Deep Navy (#04212b) with staggered delay */}
      <div
        className="bubble-transition-circle bubble-navy"
        style={{
          animation: 'chemoraBubbleSweep 1000ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          animationDelay: '120ms',
        }}
      />
    </div>
  );
};
