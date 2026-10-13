import React, { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../../gameplay/gameState';

/** Touch-first controls. Emits small custom events consumed by PlayerController. */
export const MobileControls: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const activeStation = useGameStore((s) => s.activeStation);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [holdToRun, setHoldToRun] = useState(false);
  const stickRect = useRef<DOMRect | null>(null);
  const pointerId = useRef<number | null>(null);
  const look = useRef<{ id: number; x: number; y: number } | null>(null);

  const emitMove = useCallback((x: number, y: number) => {
    window.dispatchEvent(new CustomEvent('chemora-mobile-move', { detail: { x, y } }));
  }, []);
  const updateStick = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stickRect.current;
    if (!rect) return;
    const radius = Math.min(rect.width, rect.height) * 0.34;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, radius / length);
    const x = (dx * scale) / radius;
    const y = (dy * scale) / radius;
    setStick({ x, y });
    emitMove(x, y);
  };
  if (!hasStartedGame) return null;

  return <>
    <div className="chemora-landscape-notice" role="status"><div><span className="text-3xl">↻</span><strong>Rotate your device</strong><span>CHEMORA is designed for landscape play.</span></div></div>
    <div className="chemora-mobile-controls" aria-label="Mobile game controls">
      {!activeStation && <div className="chemora-joystick-wrap">
        <div className="chemora-joystick" ref={(node) => { if (node) stickRect.current = node.getBoundingClientRect(); }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); pointerId.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); stickRect.current = e.currentTarget.getBoundingClientRect(); updateStick(e); }}
          onPointerMove={(e) => { if (pointerId.current === e.pointerId) { e.preventDefault(); updateStick(e); } }}
          onPointerUp={(e) => { if (pointerId.current === e.pointerId) { pointerId.current = null; setStick({ x: 0, y: 0 }); emitMove(0, 0); } }}
          onPointerCancel={() => { pointerId.current = null; setStick({ x: 0, y: 0 }); emitMove(0, 0); }}>
          <div className="chemora-joystick-knob" style={{ transform: `translate(calc(-50% + ${stick.x * 27}px), calc(-50% + ${stick.y * 27}px))` }} />
        </div><span>MOVE</span>
      </div>}
      <div className="chemora-look-zone" onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button, .chemora-joystick-wrap')) return; look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => { const p = look.current; if (!p || p.id !== e.pointerId) return; const dx = e.clientX - p.x; const dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; window.dispatchEvent(new CustomEvent('chemora-mobile-look', { detail: { dx, dy } })); }}
        onPointerUp={(e) => { if (look.current?.id === e.pointerId) look.current = null; }}
        onPointerCancel={() => { look.current = null; }} />
      <div className="chemora-action-stack">
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setHoldToRun((value) => { const next = !value; window.dispatchEvent(new CustomEvent('chemora-mobile-run', { detail: next })); return next; })}>{holdToRun ? 'RUN: ON' : 'HOLD TO RUN'}</button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => useGameStore.getState().setSettingsOpen(!useGameStore.getState().isSettingsOpen)}>PAUSE / SETTINGS</button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => window.dispatchEvent(new Event('chemora-mobile-interact'))}>{activeStation ? 'BACK' : 'INTERACT'}</button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => useGameStore.getState().setJournalOpen(!useGameStore.getState().isJournalOpen)}>JOURNAL</button>
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setActiveStation(null)} disabled={!activeStation}>EXIT STATION</button>
      </div>
    </div>
  </>;
};
