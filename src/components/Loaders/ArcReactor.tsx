import React from 'react';

export type ArcReactorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ArcReactorProps {
  size?: ArcReactorSize | number;
  label?: string;
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<ArcReactorSize, { dimension: number; scale: number }> = {
  xs: { dimension: 68, scale: 0.25 },
  sm: { dimension: 110, scale: 0.407 },
  md: { dimension: 175, scale: 0.648 },
  lg: { dimension: 270, scale: 1 },
  xl: { dimension: 340, scale: 1.259 },
};

/**
 * Iron Man Arc Reactor Loading Component
 * Production-grade, highly realistic Arc Reactor animation component built with
 * 5-layer physical anatomy, 12-node induction coils, and dual-tier rhythmic pulse.
 */
export const ArcReactor: React.FC<ArcReactorProps> = ({
  size = 'md',
  label = 'Powering arc reactor core...',
  showLabel = false,
  className = '',
  style,
}) => {
  const { dimension, scale } = typeof size === 'number'
    ? { dimension: size, scale: size / 270 }
    : (SIZE_MAP[size] || SIZE_MAP.md);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`arc-reactor-wrapper inline-flex flex-col items-center justify-center ${className}`}
      style={style}
    >
      <span className="sr-only">{label}</span>

      {/* Scalable Container preserving 270px native physics */}
      <div
        className="arc-reactor-scaler relative flex items-center justify-center select-none"
        style={{
          width: `${dimension}px`,
          height: `${dimension}px`,
        }}
        aria-hidden="true"
      >
        <div
          className="arc-reactor-origin"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Layer 1: Outer Metallic Bezel (Casing) */}
          <div className="arc-casing">
            {/* Layer 2: Glow Track Ring */}
            <div className="arc-glow-track" />

            {/* Layer 3: Segmented Induction Coils / Mesh Ring (12 Nodes) */}
            <div className="arc-coil-assembly">
              <div className="arc-coil-node arc-node-1" />
              <div className="arc-coil-node arc-node-2" />
              <div className="arc-coil-node arc-node-3" />
              <div className="arc-coil-node arc-node-4" />
              <div className="arc-coil-node arc-node-5" />
              <div className="arc-coil-node arc-node-6" />
              <div className="arc-coil-node arc-node-7" />
              <div className="arc-coil-node arc-node-8" />
              <div className="arc-coil-node arc-node-9" />
              <div className="arc-coil-node arc-node-10" />
              <div className="arc-coil-node arc-node-11" />
              <div className="arc-coil-node arc-node-12" />
            </div>

            {/* Layer 4: Inner Containment Ring */}
            <div className="arc-containment" />

            {/* Layer 5: Luminous Center Core */}
            <div className="arc-core" />
          </div>
        </div>
      </div>

      {showLabel && label && (
        <span className="mt-3 text-xs font-mono font-medium tracking-widest uppercase text-cyan-400 drop-shadow-[0_0_8px_rgba(82,254,254,0.5)]">
          {label}
        </span>
      )}
    </div>
  );
};

export interface ArcReactorScreenProps {
  label?: string;
  subtitle?: string;
  size?: ArcReactorSize | number;
  className?: string;
}

/**
 * Full-viewport or Chamber Suspense screen powered by the Iron Man Arc Reactor
 */
export const ArcReactorScreen: React.FC<ArcReactorScreenProps> = ({
  label = 'INITIALIZING LABORATORY CHAMBER...',
  subtitle = 'ARC REACTOR MARK-VI // 3.2 GIGAWATTS ONLINE',
  size = 'md',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full min-h-[380px] flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden ${className}`}
    >
      {/* Cinematic Ambient Glow Background */}
      <div
        aria-hidden="true"
        className="absolute w-[360px] h-[360px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none -z-0"
      />

      <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl bg-[#06090d]/80 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(4,8,11,0.9),0_0_30px_rgba(82,254,254,0.15)]">
        <ArcReactor size={size} label={label} />

        {label && (
          <h3 className="mt-6 text-sm sm:text-base font-bold font-mono tracking-wider text-cyan-100 uppercase drop-shadow-[0_0_10px_rgba(82,254,254,0.4)]">
            {label}
          </h3>
        )}

        {subtitle && (
          <p className="mt-2 text-[10px] sm:text-xs font-mono font-semibold tracking-widest text-cyan-400/80 uppercase">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
