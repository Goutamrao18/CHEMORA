import React, { forwardRef } from 'react';
import { useGlossFX } from '../../hooks/useGlossFX';

// ---------------------------------------------------------------------------
// GlassCard Component
// ---------------------------------------------------------------------------
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'cyan' | 'purple' | 'emerald' | 'amber';
  interactive?: boolean;
  withSpecularShine?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  interactive = false,
  withSpecularShine = true,
  className = '',
  children,
  ...props
}) => {
  const { cardRef, handleMouseMove, handleMouseEnter, handleMouseLeave, glossStyle } = useGlossFX();

  const variantClasses = {
    default: 'glass-card',
    elevated: 'glass-card glass-elevated',
    subtle: 'glass-card glass-subtle',
    cyan: 'glass-card border-cyan-500/35 hover:border-cyan-400/70 hover:shadow-[0_0_30px_rgba(0,240,255,0.25)]',
    purple: 'glass-card border-purple-500/35 hover:border-purple-400/70 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
    emerald: 'glass-card border-emerald-500/35 hover:border-emerald-400/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    amber: 'glass-card border-amber-500/35 hover:border-amber-400/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]',
  }[variant];

  const interactiveClass = interactive ? 'glass-card-interactive active:scale-[0.99] cursor-pointer' : '';

  return (
    <div
      ref={cardRef}
      onMouseMove={interactive && withSpecularShine ? handleMouseMove : undefined}
      onMouseEnter={interactive && withSpecularShine ? handleMouseEnter : undefined}
      onMouseLeave={interactive && withSpecularShine ? handleMouseLeave : undefined}
      className={`relative ${variantClasses} ${interactiveClass} ${className}`}
      {...props}
    >
      {/* Dynamic Specular Interactive Mouse Glare */}
      {interactive && withSpecularShine && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-[inherit]"
          style={glossStyle}
        />
      )}

      {/* Top Edge Specular White Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20" />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// GlassButton Component
// ---------------------------------------------------------------------------
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'purple' | 'emerald' | 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'cyan', size = 'md', icon, children, className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-xs font-bold tracking-wider',
      lg: 'px-6 py-3.5 text-sm font-bold tracking-wider',
    }[size];

    const variantClasses = {
      cyan: 'glass-btn glass-btn-cyan',
      purple: 'glass-btn glass-btn-purple',
      emerald: 'glass-btn glass-btn-emerald',
      default: 'glass-btn',
      ghost: 'glass-btn bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white',
    }[variant];

    return (
      <button ref={ref} type={props.type || 'button'} className={`${variantClasses} ${sizeClasses} ${className}`} {...props}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';

// ---------------------------------------------------------------------------
// GlassBadge Component
// ---------------------------------------------------------------------------
export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
  dot?: boolean;
  children: React.ReactNode;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'cyan',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    cyan: 'glass-badge',
    purple: 'glass-badge glass-badge-purple',
    emerald: 'glass-badge glass-badge-emerald',
    amber: 'glass-badge glass-badge-amber',
    rose: 'glass-badge glass-badge-rose',
  }[variant];

  const dotColors = {
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  }[variant];

  return (
    <span className={`${variantClasses} ${className}`} {...props}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors} animate-pulse`} />}
      {children}
    </span>
  );
};

// ---------------------------------------------------------------------------
// GlassPanel Container Component
// ---------------------------------------------------------------------------
export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'purple' | 'emerald' | 'none';
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  glow = 'none',
  children,
  className = '',
  ...props
}) => {
  const glowClass = {
    cyan: 'shadow-[0_0_50px_rgba(0,240,255,0.18)]',
    purple: 'shadow-[0_0_50px_rgba(168,85,247,0.18)]',
    emerald: 'shadow-[0_0_50px_rgba(16,185,129,0.18)]',
    none: '',
  }[glow];

  return (
    <div className={`glass-panel ${glowClass} ${className}`} {...props}>
      {children}
    </div>
  );
};
