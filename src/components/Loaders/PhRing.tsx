import React from 'react';
import { LoaderProps } from './AtomSpinner';
import { LiquidLoader, LiquidLoaderSize } from '../ui/LiquidLoader';

export const PhRing: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Synchronizing...',
}) => {
  return (
    <LiquidLoader
      size={size as LiquidLoaderSize}
      className={className}
      label={label}
    />
  );
};
