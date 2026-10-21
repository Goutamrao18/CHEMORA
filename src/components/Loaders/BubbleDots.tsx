import React from 'react';

export interface BubbleDotsProps {
  className?: string;
  label?: string;
}

export const BubbleDots: React.FC<BubbleDotsProps> = ({
  className = '',
  label = 'Processing...',
}) => {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`chem-bubble-dots ${className}`}
    >
      <span className="chem-sr-only">{label}</span>
      <span className="chem-bubble-dot" aria-hidden="true" />
      <span className="chem-bubble-dot" aria-hidden="true" />
      <span className="chem-bubble-dot" aria-hidden="true" />
    </span>
  );
};
