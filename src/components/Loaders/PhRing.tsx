import React from 'react';
import { LoaderProps } from './AtomSpinner';

export const PhRing: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Saving...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`chem-loader chem-size-${size} ${className}`}
    >
      <span className="chem-sr-only">{label}</span>
      <svg
        viewBox="0 0 36 36"
        className="w-full h-full"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="14"
          className="chem-ph-track"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          className="chem-ph-ring"
        />
      </svg>
    </div>
  );
};
