import React from 'react';
import { LoaderProps } from './AtomSpinner';
import { LiquidLoader, LiquidLoaderSize } from '../ui/LiquidLoader';

export const FlaskBubbles: React.FC<LoaderProps> = ({
  size = 'md',
  className = '',
  label = 'Processing chemistry calculations...',
}) => {
  return (
    <LiquidLoader
      size={size as LiquidLoaderSize}
      className={className}
      label={label}
    />
  );
};
