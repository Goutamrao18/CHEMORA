import React, { useEffect, useRef } from 'react';

export interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  amplitude?: number;
  fogDepth?: number;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  grain?: boolean;
  className?: string;
}

/**
 * Parses hex or rgb/rgba string into [r, g, b, a].
 */
function parseColor(colorStr: string): [number, number, number, number] {
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
  }
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      match[4] !== undefined ? parseFloat(match[4]) : 1,
    ];
  }
  return [100, 150, 180, 1];
}

function rgbaStr(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.max(0, Math.min(1, a))})`;
}

function lerpColor(
  c1: [number, number, number, number],
  c2: [number, number, number, number],
  t: number
): [number, number, number, number] {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
    c1[3] + (c2[3] - c1[3]) * t,
  ];
}

/**
 * High-performance, zero-dependency fluid wave canvas.
 * - Caps frame rate at 30-40 fps to minimize CPU/GPU load
 * - Clamps devicePixelRatio to max 1.5
 * - Auto-pauses when tab is hidden or backgrounded
 * - Falls back to a clean static gradient when prefers-reduced-motion is active or device is low-end
 */
export const GradientWaves: React.FC<GradientWavesProps> = ({
  horizonColor = '#cfd8df',
  waveColor = '#a8b8c4',
  crestColor = '#e2ecf2',
  amplitude = 2.8,
  fogDepth = 34,
  brightness = 1.0,
  opacity = 1.0,
  mouseInteraction = false,
  grain = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check device capabilities and user preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = mediaQuery.matches;
    const isLowEnd =
      typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 2;

    const shouldAnimate = !isReducedMotion && !isLowEnd;

    let animId: number = 0;
    let isVisible = !document.hidden;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const hColor = parseColor(horizonColor);
    const wColor = parseColor(waveColor);
    const cColor = parseColor(crestColor);

    // Mouse coordinates (normalized 0..1)
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      targetMouseY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!shouldAnimate) {
        drawFrame(0);
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    } else {
      resizeObserver.observe(canvas);
    }
    resize();

    // Wave layers configuration
    const layers = [
      { depth: 0.15, freq: 0.002, speed: 0.0006, ampMult: 0.35, phase: 0 },
      { depth: 0.35, freq: 0.003, speed: 0.0008, ampMult: 0.55, phase: 1.2 },
      { depth: 0.55, freq: 0.004, speed: 0.0011, ampMult: 0.75, phase: 2.7 },
      { depth: 0.75, freq: 0.005, speed: 0.0014, ampMult: 0.95, phase: 4.1 },
      { depth: 0.95, freq: 0.006, speed: 0.0017, ampMult: 1.15, phase: 5.5 },
    ];

    const drawFrame = (time: number) => {
      if (width === 0 || height === 0) return;

      // Smooth mouse easing
      if (mouseInteraction) {
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
      }

      ctx.save();

      // Apply brightness & global opacity
      if (brightness !== 1.0) {
        ctx.filter = `brightness(${brightness})`;
      }
      ctx.globalAlpha = opacity;

      // 1. Sky / Horizon Background Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, rgbaStr(hColor[0], hColor[1], hColor[2], hColor[3]));
      const midSky = lerpColor(hColor, wColor, 0.4);
      skyGrad.addColorStop(0.5, rgbaStr(midSky[0], midSky[1], midSky[2], 0.95));
      skyGrad.addColorStop(1, rgbaStr(wColor[0], wColor[1], wColor[2], 1));

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Wave Ribbons
      const baseAmp = amplitude * (height * 0.038);
      const fogFactor = Math.max(5, Math.min(70, fogDepth));

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const layerTime = time * layer.speed;
        const currentDepth = layer.depth;

        // Base horizon line with fog perspective
        const horizonY = height * 0.32;
        const targetY = horizonY + (height - horizonY) * Math.pow(currentDepth, 1.15);

        // Color blend based on depth
        const layerWaveColor = lerpColor(hColor, wColor, Math.min(1, currentDepth * 1.2));
        const layerCrestColor = lerpColor(layerWaveColor, cColor, 0.75);

        // Alpha increases as layers get closer
        const layerAlpha = 0.35 + currentDepth * 0.65;

        ctx.beginPath();
        ctx.moveTo(0, height);

        const step = Math.max(12, Math.floor(width / 48));

        // Sample points across the wave
        for (let x = 0; x <= width + step; x += step) {
          const normX = x / width;
          const mouseOffset = mouseInteraction ? (mouseX - 0.5) * 40 * currentDepth : 0;
          const mouseWave = mouseInteraction ? Math.sin(normX * 6 + mouseY * 4) * 8 * currentDepth : 0;

          const wave1 = Math.sin(x * layer.freq + layerTime + layer.phase + mouseOffset * 0.01);
          const wave2 = Math.cos(x * (layer.freq * 1.8) - layerTime * 0.8 + layer.phase);
          const wave3 = Math.sin(x * (layer.freq * 0.5) + layerTime * 0.5);

          const yOffset = (wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1) * baseAmp * layer.ampMult + mouseWave;
          const y = targetY + yOffset;

          if (x === 0) {
            ctx.lineTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Wave body gradient
        const waveGrad = ctx.createLinearGradient(0, targetY - baseAmp, 0, height);
        waveGrad.addColorStop(
          0,
          rgbaStr(layerCrestColor[0], layerCrestColor[1], layerCrestColor[2], layerAlpha * 0.9)
        );
        waveGrad.addColorStop(
          0.3,
          rgbaStr(layerWaveColor[0], layerWaveColor[1], layerWaveColor[2], layerAlpha * 0.95)
        );
        waveGrad.addColorStop(
          1,
          rgbaStr(wColor[0], wColor[1], wColor[2], layerAlpha)
        );

        ctx.fillStyle = waveGrad;
        ctx.fill();

        // Crest highlight stroke
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= width + step; x += step) {
          const normX = x / width;
          const mouseOffset = mouseInteraction ? (mouseX - 0.5) * 40 * currentDepth : 0;
          const mouseWave = mouseInteraction ? Math.sin(normX * 6 + mouseY * 4) * 8 * currentDepth : 0;

          const wave1 = Math.sin(x * layer.freq + layerTime + layer.phase + mouseOffset * 0.01);
          const wave2 = Math.cos(x * (layer.freq * 1.8) - layerTime * 0.8 + layer.phase);
          const wave3 = Math.sin(x * (layer.freq * 0.5) + layerTime * 0.5);

          const yOffset = (wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1) * baseAmp * layer.ampMult + mouseWave;
          const y = targetY + yOffset;

          if (x === 0) {
            ctx.moveTo(0, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = rgbaStr(
          cColor[0],
          cColor[1],
          cColor[2],
          Math.min(0.9, 0.4 + currentDepth * 0.45)
        );
        ctx.lineWidth = Math.max(1, 1.2 * currentDepth * (dpr > 1 ? 1.2 : 1));
        ctx.stroke();
        ctx.restore();
      }

      // 3. Atmospheric depth / fog overlay
      const fogGrad = ctx.createLinearGradient(0, 0, 0, height * (fogFactor / 50));
      fogGrad.addColorStop(0, rgbaStr(hColor[0], hColor[1], hColor[2], 0.35));
      fogGrad.addColorStop(1, rgbaStr(hColor[0], hColor[1], hColor[2], 0));
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Subtle procedural grain if requested
      if (grain) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let i = 0; i < 60; i++) {
          const gx = Math.random() * width;
          const gy = Math.random() * height;
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
        ctx.restore();
      }

      ctx.restore();
    };

    // If reduced motion or low-end device, render static frame once
    if (!shouldAnimate) {
      drawFrame(1200);
      return () => {
        resizeObserver.disconnect();
        if (mouseInteraction) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
      };
    }

    // Animation loop capped at 32-38 FPS
    let lastTime = performance.now();
    const targetInterval = 1000 / 36; // ~27.7ms per frame

    const loop = (currentTime: number) => {
      if (isVisible) {
        const delta = currentTime - lastTime;
        if (delta >= targetInterval) {
          lastTime = currentTime - (delta % targetInterval);
          drawFrame(currentTime);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [
    horizonColor,
    waveColor,
    crestColor,
    amplitude,
    fogDepth,
    brightness,
    opacity,
    mouseInteraction,
    grain,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};
