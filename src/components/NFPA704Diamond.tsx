import React from 'react';
import { NFPARating } from '../utils/chemicalHazards';

interface NFPA704DiamondProps {
  rating: NFPARating;
  size?: number;
  className?: string;
}

export const NFPA704Diamond: React.FC<NFPA704DiamondProps> = ({
  rating,
  size = 56,
  className = '',
}) => {
  const { health, flammability, instability, special = '' } = rating;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      title={`NFPA 704 Fire Diamond: Health ${health}, Flammability ${flammability}, Instability ${instability}${
        special ? `, Special: ${special}` : ''
      }`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        aria-label={`NFPA 704 Diamond - Health ${health}, Flammability ${flammability}, Instability ${instability}`}
      >
        {/* Outer Diamond Border */}
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill="#000000"
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Top Quadrant: Flammability (Red) */}
        <polygon points="50,4 73,27 50,50 27,27" fill="#dc2626" />
        <text
          x="50"
          y="34"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="22"
          fontWeight="900"
          fontFamily="monospace"
        >
          {flammability}
        </text>

        {/* Left Quadrant: Health (Blue) */}
        <polygon points="27,27 50,50 27,73 4,50" fill="#2563eb" />
        <text
          x="27"
          y="57"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="22"
          fontWeight="900"
          fontFamily="monospace"
        >
          {health}
        </text>

        {/* Right Quadrant: Instability/Reactivity (Yellow) */}
        <polygon points="73,27 96,50 73,73 50,50" fill="#eab308" />
        <text
          x="73"
          y="57"
          textAnchor="middle"
          fill="#000000"
          fontSize="22"
          fontWeight="900"
          fontFamily="monospace"
        >
          {instability}
        </text>

        {/* Bottom Quadrant: Special (White) */}
        <polygon points="50,50 73,73 50,96 27,73" fill="#f8fafc" />
        <text
          x="50"
          y="79"
          textAnchor="middle"
          fill="#000000"
          fontSize={special.length > 2 ? '13' : '17'}
          fontWeight="900"
          fontFamily="monospace"
        >
          {special || '—'}
        </text>

        {/* Quadrant divider grid lines */}
        <line x1="2" y1="50" x2="98" y2="50" stroke="#000000" strokeWidth="2.5" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="#000000" strokeWidth="2.5" />
      </svg>
      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase mt-1 tracking-wider">
        NFPA 704
      </span>
    </div>
  );
};
