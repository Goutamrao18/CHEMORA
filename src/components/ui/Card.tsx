import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'subtle';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', interactive = false, className = '', ...props }, ref) => {
    const variantClass = {
      default: 'glass-card',
      elevated: 'glass-elevated',
      subtle: 'glass-subtle rounded-2xl',
    }[variant];

    const interactiveClass = interactive ? 'glass-card-interactive cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={`relative ${variantClass} ${interactiveClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
