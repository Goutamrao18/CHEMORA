import React from 'react';
import { LiquidLoader } from './LiquidLoader';

export type ButtonVariant = 'cyan' | 'purple' | 'emerald' | 'ghost' | 'outline' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'cyan',
      size = 'md',
      isLoading = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-xs sm:text-sm gap-2',
      lg: 'px-7 py-3.5 text-sm sm:text-base gap-2.5',
    }[size];

    const variantClasses = {
      cyan: 'glass-btn-cyan text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.35)]',
      purple: 'glass-btn-purple text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)]',
      emerald: 'glass-btn-emerald text-emerald-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.35)]',
      glass: 'glass-btn text-white font-bold',
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent',
      outline: 'bg-transparent hover:bg-slate-800/40 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`inline-flex items-center justify-center rounded-full font-bold tracking-wide uppercase transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020816] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <LiquidLoader size="xs" label="Processing..." />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
