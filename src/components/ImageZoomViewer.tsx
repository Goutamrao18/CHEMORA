import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ImageZoomViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  subtitle?: string;
}

export const ImageZoomViewer: React.FC<ImageZoomViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(3, z + 0.5));
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(1, z - 0.5));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const webpUrl = imageUrl.replace(/\.png$/, '.webp');

  return (
    <div
      className="fixed inset-0 z-[110000] flex flex-col bg-black/90 backdrop-blur-xl anim-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Image zoom viewer for ${title}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950/80 bg-[#06101f]/80 z-20">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-cyan-400 font-mono mt-0.5">{subtitle}</p>}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#091833] border border-cyan-900/60 rounded-xl px-2 py-1 text-xs text-slate-300 gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              disabled={zoomLevel <= 1}
              aria-label="Zoom out"
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-cyan-300 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              disabled={zoomLevel >= 3}
              aria-label="Zoom in"
              className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
              aria-label="Reset zoom"
              className="p-1 rounded text-slate-400 hover:text-white border-l border-cyan-900/60 pl-1.5 ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close image viewer"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto cursor-zoom-in"
        onClick={() => setZoomLevel((z) => (z >= 2 ? 1 : z + 0.5))}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="max-w-3xl max-h-[75vh] flex items-center justify-center"
        >
          <picture>
            <source srcSet={webpUrl} type="image/webp" />
            <img
              src={imageUrl}
              alt={title}
              width={700}
              height={600}
              decoding="async"
              className="max-w-full max-h-[70vh] object-contain filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto"
            />
          </picture>
        </div>
      </div>

      {/* Footer Hotkey Guide */}
      <div className="px-6 py-2.5 bg-[#030914] border-t border-cyan-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Click image or press + / - to zoom &bull; ESC to exit</span>
        <span className="text-cyan-400">CHEMORA OPTICS</span>
      </div>
    </div>
  );
};
