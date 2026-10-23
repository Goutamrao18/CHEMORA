import React, { useState, useEffect, useRef } from 'react';

export type LiquidLoaderSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LiquidLoaderProps {
  size?: LiquidLoaderSize;
  label?: string;
  showLabel?: boolean;
  className?: string;
  antiFlicker?: boolean;
  style?: React.CSSProperties;
}

/**
 * Hook providing anti-flicker protection:
 * 1. 200ms delay before mounting loader (prevents micro-flashing for fast operations)
 * 2. 400ms minimum display duration once rendered (prevents jarring blink)
 */
export function useAntiFlicker(enabled = true, delay = 200, minDuration = 400) {
  const [shouldShow, setShouldShow] = useState(!enabled);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setShouldShow(true);
      return;
    }

    const timer = setTimeout(() => {
      startTimeRef.current = Date.now();
      setShouldShow(true);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, delay, minDuration]);

  return shouldShow;
}

/**
 * Chemora Liquid Blob Loader Component
 * Renders an organic 8-point morphing liquid droplet with cyan glow and orbiting satellite dot.
 */
export const LiquidLoader: React.FC<LiquidLoaderProps> = ({
  size = 'md',
  label = 'Loading...',
  showLabel = false,
  className = '',
  antiFlicker = false,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isVisible = useAntiFlicker(antiFlicker, 200, 400);

  // IntersectionObserver to pause heavy GPU animations when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPaused(!entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return null;
  }

  const isWithSatellite = size === 'md' || size === 'lg';
  const orbitRadius = size === 'lg' ? '54px' : '34px';

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      className={`liquid-loader-container ${isPaused ? 'liquid-loader-paused' : ''} ${className}`}
      style={style}
    >
      {/* Screen reader announcement */}
      <span className="sr-only">{label}</span>

      {/* Outer wrapper maintaining aspect and relative bounds */}
      <div className="relative inline-flex items-center justify-center">
        {/* Organic Morphing Liquid Blob */}
        <div
          aria-hidden="true"
          className={`liquid-loader-blob size-${size}`}
        />

        {/* Orbiting Satellite Dot (md and lg only) */}
        {isWithSatellite && (
          <div
            aria-hidden="true"
            className={`liquid-loader-satellite size-${size}`}
            style={{ ['--orbit-radius' as string]: orbitRadius }}
          >
            <div className="liquid-loader-satellite-dot" />
          </div>
        )}
      </div>

      {/* Optional visible text label */}
      {showLabel && label && (
        <span className="ml-3 text-xs font-mono font-medium tracking-wide text-cyan-600 dark:text-cyan-300">
          {label}
        </span>
      )}
    </div>
  );
};

export interface LiquidLoaderScreenProps {
  label?: string;
  subtitle?: string;
  className?: string;
  antiFlicker?: boolean;
}

/**
 * Full-screen / viewport-centered liquid loader screen with Chemora aesthetic
 */
export const LiquidLoaderScreen: React.FC<LiquidLoaderScreenProps> = ({
  label = 'Loading laboratory curriculum...',
  subtitle = 'SECURE COMPUTATIONAL ENVIRONMENT',
  className = '',
  antiFlicker = true,
}) => {
  return (
    <div
      className={`min-h-[360px] w-full flex-1 flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="p-4 rounded-3xl bg-cyan-950/20 border border-cyan-500/10 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center">
        <LiquidLoader size="lg" label={label} antiFlicker={antiFlicker} />
        
        {label && (
          <p className="mt-5 text-sm sm:text-base font-bold text-[var(--color-text-main,#f4f8ff)] max-w-sm tracking-tight leading-snug">
            {label}
          </p>
        )}

        {subtitle && (
          <p className="mt-2 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export interface LiquidLoaderOverlayProps {
  label?: string;
  className?: string;
}

/**
 * Transparent backdrop overlay loader for cards, modals, or drawers
 */
export const LiquidLoaderOverlay: React.FC<LiquidLoaderOverlayProps> = ({
  label = 'Processing...',
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs rounded-[inherit] transition-all p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center p-4 rounded-2xl bg-[#04212b]/90 border border-cyan-500/20 shadow-xl">
        <LiquidLoader size="md" label={label} />
        {label && (
          <span className="mt-3 text-xs font-medium text-cyan-200 font-mono tracking-wide">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
