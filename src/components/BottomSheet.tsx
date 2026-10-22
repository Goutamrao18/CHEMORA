import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string; // e.g. '88dvh' or '92dvh'
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  maxHeight = '90dvh',
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number>(0);
  const currentDragY = useRef<number>(0);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    // Find all focusable elements
    const focusableElements = sheetEl.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Touch Drag-to-Dismiss handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentDragY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only allow downward drag
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragY(deltaY);
    } else {
      currentDragY.current = 0;
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If dragged down by more than 80px, dismiss
    if (currentDragY.current > 80) {
      onClose();
    }
    setDragY(0);
    currentDragY.current = 0;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 p-0 md:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translate3d(0, ${dragY}px, 0)` : undefined,
          transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight,
        }}
        className={`w-full md:max-w-3xl bg-[#091120] border-t md:border border-cyan-500/40 rounded-t-[28px] md:rounded-[28px] shadow-[0_-16px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative pb-[env(safe-area-inset-bottom,16px)] md:pb-0 ${className}`}
      >
        {/* Mobile Drag Handle Bar */}
        <div
          ref={dragHandleRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none md:hidden"
          aria-label="Drag to dismiss sheet"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-600/80 active:bg-cyan-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-900/40 bg-gradient-to-r from-[#0b1629] to-[#08101e] flex-shrink-0">
          <div className="min-w-0 pr-3">
            {subtitle && (
              <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400 mb-0.5 truncate">
                {subtitle}
              </div>
            )}
            {title && (
              <div className="text-base sm:text-lg font-bold text-white truncate">
                {title}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
