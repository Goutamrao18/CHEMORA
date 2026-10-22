import React from 'react';
import { Droplet, Loader2 } from 'lucide-react';
import './liquid-button.css';

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  showDroplet?: boolean;
  loading?: boolean;
  className?: string;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  children,
  icon,
  showDroplet = true,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={`chemora-liquid-btn group ${className}`}
      {...props}
    >
      {/* Liquid Rising & Wobbling Layer */}
      <span className="liquid-layer" aria-hidden="true" />

      {/* Button Content */}
      <span className="liquid-content">
        {loading ? (
          <Loader2 className="w-4 h-4 text-[#7fdcef] animate-spin flex-shrink-0" aria-hidden="true" />
        ) : showDroplet ? (
          <Droplet
            className="w-4 h-4 text-[#7fdcef] flex-shrink-0 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(127,220,239,0.7)]"
            fill="currentColor"
            fillOpacity={0.35}
            aria-hidden="true"
          />
        ) : (
          icon
        )}
        {children}
      </span>
    </button>
  );
};
