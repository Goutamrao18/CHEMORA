import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, AlertCircle } from 'lucide-react';
import { LiquidLoader } from './ui/LiquidLoader';

export interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void>;
  isUploading: boolean;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isUploading,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset pan & zoom whenever a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMsg(null);
    }
  }, [isOpen, imageSrc]);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch drag handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform client-side 512x512 WebP export stripping EXIF metadata
  const handleApplyCrop = async () => {
    const img = imgRef.current;
    if (!img) return;

    setErrorMsg(null);
    try {
      const CROP_VIEWPORT_SIZE = 240; // Diameter of circular crop window in CSS px
      const OUTPUT_SIZE = 512; // Required 512x512 square canvas

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Dimensions of the rendered image within the 240px circle box
      const naturalW = img.naturalWidth || 512;
      const naturalH = img.naturalHeight || 512;

      // Fit image into viewport maintaining aspect ratio
      const baseScale = Math.max(CROP_VIEWPORT_SIZE / naturalW, CROP_VIEWPORT_SIZE / naturalH);
      const effectiveScale = baseScale * zoom;

      // Center offset in canvas coordinates (scaling from 240 viewport to 512 output)
      const scaleToOutput = OUTPUT_SIZE / CROP_VIEWPORT_SIZE;

      ctx.save();
      // Center the origin
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      // Apply user pan (scaled to 512px output)
      ctx.translate(pan.x * scaleToOutput, pan.y * scaleToOutput);
      // Draw image centered at origin
      const drawW = naturalW * effectiveScale * scaleToOutput;
      const drawH = naturalH * effectiveScale * scaleToOutput;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Export as 512x512 square WebP (quality 0.85) - strips EXIF/GPS automatically
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setErrorMsg('Failed to process image crop.');
            return;
          }
          if (blob.size > 2 * 1024 * 1024) {
            setErrorMsg('Processed image exceeds 2 MB. Please zoom or crop differently.');
            return;
          }
          try {
            await onCropComplete(blob);
          } catch (err: any) {
            setErrorMsg(err.message || 'Upload failed. Please try again.');
          }
        },
        'image/webp',
        0.85
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cropping image');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-heading"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => { if (!isUploading) onClose(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-[#04212b] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(4,33,43,0.5)] text-slate-100 anim-popup relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60 mb-4">
          <div>
            <h3 id="crop-modal-heading" className="text-base sm:text-lg font-bold text-white tracking-tight">
              Adjust Profile Photo
            </h3>
            <p className="text-[11px] text-cyan-300/80">
              Drag to position • Zoom to frame • Exports 512×512 WebP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close photo crop"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Circular Crop Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-[240px] h-[240px] mx-auto rounded-full overflow-hidden border-4 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.35)] bg-slate-950 cursor-grab active:cursor-grabbing select-none touch-none mb-5 flex items-center justify-center"
        >
          {/* Subtle Crosshairs */}
          <div className="absolute inset-0 pointer-events-none border border-cyan-400/20 rounded-full" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-400/15 pointer-events-none" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/15 pointer-events-none" />

          {/* Draggable & Scalable Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Preview avatar"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            className="transition-transform duration-75 pointer-events-none select-none"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-slate-900/60 border border-cyan-900/40 mb-5">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
            disabled={zoom <= 1 || isUploading}
            aria-label="Zoom out"
            className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            disabled={isUploading}
            aria-label="Image zoom slider"
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
            disabled={zoom >= 3 || isUploading}
            aria-label="Zoom in"
            className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            disabled={isUploading || (zoom === 1 && pan.x === 0 && pan.y === 0)}
            aria-label="Reset position and zoom"
            title="Reset position and zoom"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isUploading}
            aria-busy={isUploading}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 active:scale-98 text-xs font-bold text-[#04212b] shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isUploading ? (
              <LiquidLoader size="xs" label="Uploading profile picture..." />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
