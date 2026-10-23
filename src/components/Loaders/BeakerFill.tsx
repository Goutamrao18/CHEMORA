import React from 'react';
import { LiquidLoader, LiquidLoaderSize } from '../ui/LiquidLoader';

export interface BeakerFillProps {
  progress?: number;
  size?: 'sm' | 'md' | 'lg' | 'xs';
  className?: string;
  label?: string;
}

export const BeakerFill: React.FC<BeakerFillProps> = ({
  size = 'md',
  className = '',
  label = 'Buffering video...',
}) => {
  return (
    <LiquidLoader
      size={size as LiquidLoaderSize}
      className={className}
      label={label}
    />
  );
};
