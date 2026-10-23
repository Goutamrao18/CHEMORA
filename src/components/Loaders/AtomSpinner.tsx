import React from 'react';
import { LiquidLoader, LiquidLoaderSize } from '../ui/LiquidLoader';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xs';
  className?: string;
  label?: string;
}

export const AtomSpinner: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  return (
    <LiquidLoader
      size={size as LiquidLoaderSize}
      className={className}
      label={label}
    />
  );
};
