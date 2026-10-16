import {
  Activity,
  BookOpen,
  Flame,
  FlaskConical,
  HelpCircle,
  Maximize2,
  Scale,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useState } from 'react';
import { playGlasswareClick } from '../../gameplay/audio';
import { useGameStore } from '../../gameplay/gameState';
import { setGraphicsSettings, useGraphicsSettings } from '../../graphics/quality';

export const MainHUD: React.FC = () => {
  const activeStation = useGameStore((s) => s.activeStation);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const setJournalOpen = useGameStore((s) => s.setJournalOpen);
  const heldVesselId = useGameStore((s) => s.heldVesselId);
  const dropHeldVessel = useGameStore((s) => s.dropHeldVessel);
  const vessels = useGameStore((s) => s.vessels);
  const unlockedTier = useGameStore((s) => s.unlockedTier);
  const completedProtocolIds = useGameStore((s) => s.completedProtocolIds);
  const latestNotification = useGameStore((s) => s.latestNotification);
  const clearNotification = useGameStore((s) => s.clearNotification);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const audioVolume = useGameStore((s) => s.audioVolume);
  const audioMuted = useGameStore((s) => s.audioMuted);
  const graphics = useGraphicsSettings();

  const [showControlsHelp, setShowControlsHelp] = useState(false);

  const heldVessel = heldVesselId ? vessels[heldVesselId] : null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 font-mono text-[#E2E8F0]">
      {/* ========================================================
          TOP BAR
      ======================================================== */}
      <div className="flex items-start justify-between">
        {/* Title & Laboratory Status Telemetry */}
        <div className="pointer-events-auto bg-[#111418]/90 border border-[#2A323D] p-3 backdrop-blur-md space-y-1 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-widest text-white">CHEMORA</span>
            <span className="text-[10px] bg-[#0ea5e9]/20 text-[#0ea5e9] px-1.5 py-0.5 border border-[#0ea5e9]/40 font-bold">
              LAB TIER {unlockedTier}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>TEMP: 22.4°C</span>
            <span>HVAC: NOMINAL</span>
            <span>PRESSURE: 101.3 kPa</span>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mouse Lock Button */}
          {!activeStation && (
            <button
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (document.pointerLockElement) {
                  document.exitPointerLock?.();
                } else if (canvas) {
                  canvas.requestPointerLock?.();
                }
              }}
              className="px-2.5 py-1.5 bg-[#111418]/90 hover:bg-[#1e242c] border border-[#2A323D] hover:border-[#0ea5e9] text-xs text-[#0ea5e9] flex items-center gap-1.5 transition-colors shadow-md"
              title="Toggle Mouse Pointer Lock (Hot-key: L)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MOUSE LOCK [L]</span>
            </button>
          )}

          {/* Quick Objective Preview */}
          <button
            onClick={() => {
              playGlasswareClick();
              setJournalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#111418]/90 hover:bg-[#1e242c] border border-[#2A323D] hover:border-[#0ea5e9] backdrop-blur-md transition-colors text-xs text-white"
          >
            <BookOpen className="w-4 h-4 text-[#0ea5e9]" />
            <span className="hidden sm:inline">RESEARCH JOURNAL</span>
            <span className="text-[10px] bg-[#0ea5e9]/20 text-[#0ea5e9] px-1.5 py-0.2 rounded font-bold">
              {completedProtocolIds.length}/5
            </span>
            <span className="text-[10px] text-slate-500">[TAB]</span>
          </button>

          <button
            onClick={() => setShowControlsHelp(!showControlsHelp)}
            className="p-2 bg-[#111418]/90 hover:bg-[#1e242c] border border-[#2A323D] hover:border-slate-400 backdrop-blur-md transition-colors text-slate-300"
            title="Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSettingsOpen(!isSettingsOpen)}
            className="p-2 bg-[#111418]/90 hover:bg-[#1e242c] border border-[#2A323D] hover:border-slate-400 backdrop-blur-md transition-colors text-slate-300"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          CENTER RETICLE & CROSSHAIR (when roaming)
      ======================================================== */}
      {!activeStation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Minimal High-Tech Crosshair */}
            <div className="w-2 h-2 rounded-full bg-[#0ea5e9] opacity-80 shadow-[0_0_8px_#0ea5e9]" />
            <div className="absolute w-6 h-6 rounded-full border border-[#0ea5e9]/40" />

            {/* Hint prompt under crosshair */}
            <div className="absolute top-6 whitespace-nowrap bg-[#111418]/90 border border-[#2A323D] px-3 py-1 text-[11px] text-slate-300 backdrop-blur-sm shadow-md">
              <span className="text-[#0ea5e9] font-bold">DRAG MOUSE</span> OR PRESS <span className="text-[#0ea5e9] font-bold">[L]</span> TO LOCK | <span className="text-[#0ea5e9] font-bold">Q/E</span> TO TURN | <span className="text-[#0ea5e9] font-bold">[E]</span> INTERACT
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SETTINGS MODAL
      ======================================================== */}
      {isSettingsOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#111418] border border-[#2A323D] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A323D] pb-2">
              <span className="font-bold text-white text-sm">LABORATORY SIMULATION SETTINGS</span>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                [CLOSE]
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">CAMERA SENSITIVITY</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={useGameStore.getState().mouseSensitivity}
                    onChange={(e) => useGameStore.getState().setMouseSensitivity(Number(e.target.value))}
                    className="w-full accent-[#0ea5e9] bg-[#2A323D] h-1.5 cursor-pointer"
                  />
                  <span className="text-[#0ea5e9] font-bold">
                    {useGameStore.getState().mouseSensitivity.toFixed(1)}x
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">GRAPHICS QUALITY</label>
                <select aria-label="Graphics quality preset" value={graphics.quality} onChange={(e) => { const quality = e.target.value as 'Low' | 'Medium' | 'High'; setGraphicsSettings({ quality, postprocessing: quality !== 'Low' && graphics.postprocessing }); }} className="w-full rounded border border-[#2A323D] bg-[#1a202c] p-2 text-slate-100">
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                </select>
                <label className="mt-3 flex items-center gap-2 text-slate-300"><input type="checkbox" checked={graphics.postprocessing} disabled={graphics.quality === 'Low'} onChange={(e) => setGraphicsSettings({ postprocessing: e.target.checked })} /> Post-processing</label>
                {import.meta.env.DEV && <label className="mt-2 flex items-center gap-2 text-slate-300"><input type="checkbox" checked={graphics.showStats} onChange={(e) => setGraphicsSettings({ showStats: e.target.checked })} /> FPS + draw calls (dev)</label>}
              </div>
              <div>
                <label className="text-slate-400 block mb-1">MASTER VOLUME · {Math.round(audioVolume * 100)}%</label>
                <input aria-label="Master volume" type="range" min={0} max={1} step={0.05} value={audioVolume} onChange={(e) => useGameStore.getState().setAudioVolume(Number(e.target.value))} className="w-full accent-[#0ea5e9]" />
                <label className="text-slate-400 block mb-1 mt-3">AUDIO SYNTHESIS</label>
                <button
                  onClick={() => useGameStore.getState().setAudioMuted(!audioMuted)}
                  className="flex items-center gap-2 px-3 py-2 border border-[#2A323D] bg-[#1a202c] text-slate-300 hover:text-white w-full"
                >
                  {audioMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {audioMuted ? 'Muted (Audio Off)' : 'Tone.js Synthesis Enabled'}
                  </span>
                </button>
              </div>
            </div>
            <button onClick={() => { if (window.confirm('Reset CHEMORA progress?')) useGameStore.getState().resetProgress(); }} className="w-full py-2 bg-rose-900 text-white font-bold text-xs">RESET PROGRESS</button>
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2 bg-[#0ea5e9] text-[#111418] font-bold text-xs hover:bg-[#0284c7]"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CONTROLS HELP POPUP MODAL
      ======================================================== */}
      {showControlsHelp && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#111418] border border-[#2A323D] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A323D] pb-2">
              <span className="font-bold text-white text-sm">LABORATORY EXPLORATION CONTROLS</span>
              <button
                onClick={() => setShowControlsHelp(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                [CLOSE]
              </button>
            </div>
            <div className="text-xs space-y-2 text-slate-300 leading-relaxed">
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>WASD / Arrow Keys</span>
                <span className="text-[#0ea5e9]">Walk in Laboratory</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>Shift + WASD</span>
                <span className="text-[#0ea5e9]">Sprint / Fast Walk</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>Mouse Look</span>
                <span className="text-[#0ea5e9]">Rotate 360° View</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>E Key / Left Click</span>
                <span className="text-[#0ea5e9]">Focus Workstation / Inspect</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>ESC Key</span>
                <span className="text-[#0ea5e9]">Exit Station to Free Roam</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>TAB Key</span>
                <span className="text-[#0ea5e9]">Open Research Journal</span>
              </div>
              <div className="flex justify-between border-b border-[#2A323D]/50 pb-1">
                <span>1, 2, 3, 4 Keys</span>
                <span className="text-[#0ea5e9]">Fast Travel to Workstations</span>
              </div>
            </div>
            <button
              onClick={() => setShowControlsHelp(false)}
              className="w-full py-2 bg-[#0ea5e9] text-[#111418] font-bold text-xs hover:bg-[#0284c7]"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          NOTIFICATION BANNER TOAST
      ======================================================== */}
      {latestNotification && (
        <div className="pointer-events-auto mx-auto mb-2 max-w-lg w-full bg-[#161c24]/95 border-l-4 border-l-[#0ea5e9] border border-[#2A323D] p-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="text-xs text-white leading-relaxed">{latestNotification}</div>
          <button
            onClick={clearNotification}
            className="text-[10px] text-slate-400 hover:text-white flex-shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* ========================================================
          BOTTOM ROW
      ======================================================== */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
        {/* Held Equipment Card */}
        {heldVessel ? (
          <div className="pointer-events-auto bg-[#111418]/90 border border-[#2A323D] p-3 backdrop-blur-md min-w-[240px] shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px]">EQUIPMENT IN HAND:</span>
              <button
                onClick={dropHeldVessel}
                className="text-[10px] text-rose-400 hover:text-rose-300"
              >
                [STOW]
              </button>
            </div>
            <div className="font-bold text-white text-xs">{heldVessel.name}</div>
            <div className="flex items-center gap-2 pt-1">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: heldVessel.content.color }}
              />
              <span className="text-[11px] text-slate-300">
                {heldVessel.content.volumeMl > 0
                  ? `${heldVessel.content.volumeMl}mL (${heldVessel.content.productName || 'Solution'})`
                  : 'Empty Vessel'}
              </span>
            </div>
            {heldVessel.content.volumeMl > 0 && (
              <div className="text-[10px] text-slate-400 flex gap-3 pt-0.5">
                <span>pH: {heldVessel.content.ph}</span>
                <span>Temp: {heldVessel.content.temperatureC}°C</span>
              </div>
            )}
          </div>
        ) : (
          <div className="pointer-events-auto bg-[#111418]/70 border border-[#2A323D] px-3 py-2 text-[11px] text-slate-500 backdrop-blur-sm">
            Hands empty. Select equipment at benches to manipulate.
          </div>
        )}

        {/* Fast Station Nav Dock */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#111418]/90 border border-[#2A323D] p-1.5 backdrop-blur-md shadow-lg">
          <span className="text-[10px] text-slate-500 px-2 font-bold hidden md:inline">FAST TRAVEL:</span>
          <button
            onClick={() => {
              playGlasswareClick();
              setActiveStation('dispensing');
            }}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border transition-all ${
              activeStation === 'dispensing'
                ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9] font-bold'
                : 'border-transparent text-slate-300 hover:border-[#2A323D] hover:bg-[#1a202c]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>DISPENSING</span>
            <span className="text-[9px] text-slate-500">[1]</span>
          </button>

          <button
            onClick={() => {
              playGlasswareClick();
              setActiveStation('measurement');
            }}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border transition-all ${
              activeStation === 'measurement'
                ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9] font-bold'
                : 'border-transparent text-slate-300 hover:border-[#2A323D] hover:bg-[#1a202c]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>MEASURE</span>
            <span className="text-[9px] text-slate-500">[2]</span>
          </button>

          <button
            onClick={() => {
              playGlasswareClick();
              setActiveStation('workbench');
            }}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border transition-all ${
              activeStation === 'workbench'
                ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9] font-bold'
                : 'border-transparent text-slate-300 hover:border-[#2A323D] hover:bg-[#1a202c]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>REACTION</span>
            <span className="text-[9px] text-slate-500">[3]</span>
          </button>

          <button
            onClick={() => {
              playGlasswareClick();
              setActiveStation('analysis');
            }}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 border transition-all ${
              activeStation === 'analysis'
                ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9] font-bold'
                : 'border-transparent text-slate-300 hover:border-[#2A323D] hover:bg-[#1a202c]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ANALYSIS</span>
            <span className="text-[9px] text-slate-500">[4]</span>
          </button>

          {activeStation && (
            <button
              onClick={() => setActiveStation(null)}
              className="px-2.5 py-1.5 text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              title="Return to First-Person Roam"
            >
              [ESC ROAM]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
