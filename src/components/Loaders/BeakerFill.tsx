import React from 'react';

export interface BeakerFillProps {
  progress?: number; // 0-100 or undefined for looping indeterminate
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const BeakerFill: React.FC<BeakerFillProps> = ({
  progress,
  size = 'md',
  className = '',
  label = 'Buffering video...',
}) => {
  const isDeterminate = typeof progress === 'number' && !isNaN(progress);
  const clampedProgress = isDeterminate ? Math.max(0, Math.min(100, progress)) : 50;
  // Liquid height in beaker: from Y=25 (empty) down to Y=9 (full)
  const liquidY = 25 - (clampedProgress / 100) * 16;
  const liquidHeight = (clampedProgress / 100) * 16;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`chem-loader chem-size-${size} ${
        isDeterminate ? 'chem-beaker-determinate' : 'chem-beaker-indeterminate'
      } ${className}`}
    >
      <span className="chem-sr-only">
        {isDeterminate ? `${label} (${Math.round(clampedProgress)}%)` : label}
      </span>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* Beaker Lip & Contour */}
        <path
          d="M7 6h17v19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6l-1.5-1"
          className="chem-beaker-contour"
        />
        {/* Graduation Tick Marks */}
        <line x1="9" y1="11" x2="13" y2="11" className="chem-beaker-ticks" />
        <line x1="9" y1="16" x2="14" y2="16" className="chem-beaker-ticks" />
        <line x1="9" y1="21" x2="13" y2="21" className="chem-beaker-ticks" />

        {/* Liquid Fill */}
        {isDeterminate ? (
          <rect
            x="8"
            y={liquidY}
            width="15"
            height={liquidHeight}
            rx="1"
            className="chem-beaker-liquid"
          />
        ) : (
          <rect
            x="8"
            y="11"
            width="15"
            height="14"
            rx="1"
            className="chem-beaker-liquid"
          />
        )}
      </svg>
    </div>
  );
};
