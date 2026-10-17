import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidthClass} rounded-3xl bg-[#06142a]/95 border border-cyan-500/35 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Top Edge Specular Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-5 pb-3 border-b border-cyan-950/60 flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-black text-white tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto pr-1 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
