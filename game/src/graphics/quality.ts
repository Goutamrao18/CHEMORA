import { useSyncExternalStore } from 'react';
export type QualityPreset = 'Low' | 'Medium' | 'High';
export type GraphicsSettings = { quality: QualityPreset; postprocessing: boolean; showStats: boolean };
let state: GraphicsSettings = { quality: 'Medium', postprocessing: false, showStats: false };
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getGraphicsSettings = () => state;
export const setGraphicsSettings = (next: Partial<GraphicsSettings>) => { state = { ...state, ...next }; listeners.forEach((fn) => fn()); };
export const useGraphicsSettings = () => useSyncExternalStore(subscribe, () => state, () => state);
export async function detectQuality(): Promise<QualityPreset> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4; const cores = navigator.hardwareConcurrency ?? 4;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  // Short startup frame-pacing sample; conservative fallback if the tab is throttled.
  const started = performance.now(); let frames = 0;
  await new Promise<void>((resolve) => {
    const sample = (now: number) => { frames += 1; if (now - started >= 420 || frames >= 30) resolve(); else requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  });
  const elapsed = Math.max(1, performance.now() - started);
  const fps = frames * 1000 / elapsed;
  if (touch || memory <= 4 || cores <= 4 || fps < 42) return 'Low';
  if (memory >= 8 && cores >= 8 && fps >= 55) return 'High';
  return 'Medium';
}
export const qualityDpr: Record<QualityPreset, [number, number]> = { Low: [0.75, 1], Medium: [1, 1.35], High: [1.25, 1.75] };
