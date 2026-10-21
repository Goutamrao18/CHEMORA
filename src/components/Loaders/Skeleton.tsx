import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'video';
  label?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'card',
  label = 'Loading placeholder...',
}) => {
  const variantClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'text'
      ? 'h-4 w-full rounded-md'
      : variant === 'video'
      ? 'aspect-video w-full rounded-2xl'
      : 'rounded-2xl';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`chem-skeleton ${variantClass} ${className}`}
    >
      <span className="chem-sr-only">{label}</span>
    </div>
  );
};
