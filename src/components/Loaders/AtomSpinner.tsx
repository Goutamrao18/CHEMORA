import React from 'react';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const AtomSpinner: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`chem-loader chem-size-${size} ${className}`}
    >
      <span className="chem-sr-only">{label}</span>
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full chem-atom"
        aria-hidden="true"
      >
        {/* Three orbital ellipses at 0, 60, 120 degrees */}
        <ellipse cx="32" cy="32" rx="26" ry="10" className="chem-atom-ring chem-atom-orbit-1" />
        <ellipse cx="32" cy="32" rx="26" ry="10" className="chem-atom-ring chem-atom-orbit-2" />
        <ellipse cx="32" cy="32" rx="26" ry="10" className="chem-atom-ring chem-atom-orbit-3" />
        {/* Orbiting electrons */}
        <g className="chem-atom-electrons">
          <circle cx="58" cy="32" r="2.75" fill="var(--chem-loader-primary)" />
          <circle cx="19" cy="10" r="2.75" fill="var(--chem-loader-secondary)" />
          <circle cx="19" cy="54" r="2.75" fill="var(--chem-loader-accent)" />
        </g>
        {/* Central Nucleus */}
        <circle cx="32" cy="32" r="4.5" className="chem-atom-nucleus" />
      </svg>
    </div>
  );
};
