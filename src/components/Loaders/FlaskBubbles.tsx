import React from 'react';
import { LoaderProps } from './AtomSpinner';

export const FlaskBubbles: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Thinking...',
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
        {/* Flask Rim */}
        <line x1="12" y1="4" x2="20" y2="4" className="chem-flask-outline" />
        {/* Conical Flask Contour */}
        <path
          d="M13 4v7L6.5 24.5C5.8 26 6.9 27.5 8.6 27.5h14.8c1.7 0 2.8-1.5 2.1-3L19 11V4"
          className="chem-flask-outline"
        />
        {/* Liquid Meniscus Fill */}
        <path
          d="M8.2 24.5L11 19c2 0.8 4-0.8 6-0.8s3.5 1.2 5 0.5l2.2 5.8c0.4 1-0.3 2-1.4 2H9.6c-1.1 0-1.8-1-1.4-2z"
          className="chem-flask-liquid"
        />
        {/* Rising Chemical Bubbles */}
        <circle cx="13" cy="23" r="1.5" className="chem-bubble chem-bubble-1" />
        <circle cx="17.5" cy="24" r="1.2" className="chem-bubble chem-bubble-2" />
        <circle cx="15" cy="21" r="1.3" className="chem-bubble chem-bubble-3" />
      </svg>
    </div>
  );
};
