import React from 'react';
import { LiquidLoader } from '../ui/LiquidLoader';

export interface BubbleDotsProps {
  className?: string;
  label?: string;
}

export const BubbleDots: React.FC<BubbleDotsProps> = ({
  className = '',
  label = 'Processing...',
}) => {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <LiquidLoader size="xs" label={label} />
    </span>
  );
};
