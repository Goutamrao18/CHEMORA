import { useState, useEffect, useRef } from 'react';

export interface DelayedLoadingOptions {
  delay?: number;       // Wait before showing loader (default 200ms)
  minDuration?: number; // Minimum time to keep loader displayed (default 400ms)
}

/**
 * Anti-flicker loading hook.
 * - Suppresses loader for brief waits (< 200ms).
 * - Enforces minimum display duration (400ms) once shown to eliminate UI jitter.
 */
export function useDelayedLoading(
  isLoading: boolean,
  options: DelayedLoadingOptions = {}
): boolean {
  const { delay = 200, minDuration = 400 } = options;
  const [showLoader, setShowLoader] = useState(false);
  const shownAtRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (!showLoader && !delayTimerRef.current) {
        delayTimerRef.current = setTimeout(() => {
          shownAtRef.current = Date.now();
          setShowLoader(true);
          delayTimerRef.current = null;
        }, delay);
      }
    } else {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }

      if (showLoader) {
        const elapsedTime = shownAtRef.current ? Date.now() - shownAtRef.current : minDuration;
        const remainingTime = Math.max(0, minDuration - elapsedTime);

        hideTimerRef.current = setTimeout(() => {
          setShowLoader(false);
          shownAtRef.current = null;
          hideTimerRef.current = null;
        }, remainingTime);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isLoading, delay, minDuration, showLoader]);

  return showLoader;
}
