import React from 'react';

export interface DropperDripProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const DropperDrip: React.FC<DropperDripProps> = ({
  size = 'md',
  className = '',
  label = 'No items found',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`chem-loader chem-size-${size} ${className}`}
    >
      <span className="chem-sr-only">{label}</span>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* Rubber Bulb */}
        <path
          d="M13.5 3h5c1 0 1.5.8 1.5 1.5v2h-8v-2c0-.7.5-1.5 1.5-1.5z"
          className="chem-dropper-bulb"
        />
        {/* Pipette Collar */}
        <rect x="11" y="6.5" width="10" height="1.5" rx="0.5" className="chem-dropper-pipette" />
        {/* Glass Pipette Body tapering down to nozzle */}
        <path
          d="M13 8v9l2 4v2h2v-2l2-4V8"
          className="chem-dropper-pipette"
        />
        {/* Liquid Column inside pipette */}
        <rect x="14" y="9" width="4" height="7" rx="0.5" className="chem-dropper-liquid-in" />
        {/* Falling Chemistry Drop */}
        <circle cx="16" cy="24" r="1.5" className="chem-dropper-drop" />
        {/* Surface Ripple Effect */}
        <ellipse cx="16" cy="30" rx="6" ry="1.5" className="chem-dropper-ripple" />
      </svg>
    </div>
  );
};
