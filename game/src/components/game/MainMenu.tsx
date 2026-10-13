import React, { useState } from 'react';
import { useGameStore } from '../../gameplay/gameState';
import { initAudio } from '../../gameplay/audio';
import {
  FlaskConical,
  Play,
  Volume2,
  VolumeX,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const MainMenu: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const startGame = useGameStore((s) => s.startGame);
  const audioMuted = useGameStore((s) => s.audioMuted);
  const setAudioMuted = useGameStore((s) => s.setAudioMuted);
  const mouseSensitivity = useGameStore((s) => s.mouseSensitivity);
  const setMouseSensitivity = useGameStore((s) => s.setMouseSensitivity);

  const [isLoading, setIsLoading] = useState(false);

  if (hasStartedGame) return null;

  const handleStartGame = async () => {
    setIsLoading(true);
    await initAudio();
    startGame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0e12] p-6 text-[#E2E8F0] font-mono select-none">
      {/* Background Graphic Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #2A323D 1px, transparent 1px), linear-gradient(to bottom, #2A323D 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Mission Card */}
      <div className="relative max-w-2xl w-full bg-[#111418] border border-[#2A323D] p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-md">
        {/* Header Decal */}
        <div className="flex items-center justify-between border-b border-[#2A323D] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#0ea5e9]">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-widest text-white">
                CHEMORA
              </h1>
              <p className="text-xs text-[#0ea5e9] tracking-wider">
                OPEN WORLD CHEMISTRY | FIRST-PERSON RESEARCH LABORATORY
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 border border-[#2A323D] px-2 py-1">
            RELEASE 1.0 (VERTICAL SLICE)
          </span>
        </div>

        {/* Mission Briefing */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-[#161c24] border border-[#2A323D] p-4">
          <div className="text-[#0ea5e9] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Research Directive & Scientific Protocol
          </div>
          <p>
            Welcome to the advanced chemical research facility. As the lead research chemist, you have full access to interactive laboratory equipment:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>Explore 3D Research Laboratory</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>Collect Reagents & Dispense</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>Precision Analytical Balance Weighing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>Reaction Stirrer & Heat Synthesis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>UV-Vis Spectrophotometric Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span>Unlock Advanced Research Tiers</span>
            </div>
          </div>
        </div>

        {/* Audio & Controls Setting Pre-flight */}
        <div className="grid grid-cols-2 gap-4 border border-[#2A323D] bg-[#161c24] p-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">MOUSE SENSITIVITY</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={mouseSensitivity}
                onChange={(e) => setMouseSensitivity(Number(e.target.value))}
                className="w-full accent-[#0ea5e9] bg-[#2A323D] h-1.5 cursor-pointer"
              />
              <span className="text-[#0ea5e9] font-bold">{mouseSensitivity.toFixed(1)}x</span>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">AUDIO SIMULATION</label>
            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#2A323D] bg-[#1a202c] text-slate-300 hover:text-white"
            >
              {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{audioMuted ? 'MUTED' : 'SYNTHESIS ON'}</span>
            </button>
          </div>
        </div>

        {/* Start Game Action Button */}
        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full py-4 bg-[#0ea5e9] hover:bg-[#0284c7] text-[#111418] font-black text-sm tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <Play className="w-5 h-5 fill-current" />
          {isLoading ? 'INITIALIZING LABORATORY SENSORS...' : 'START LABORATORY SIMULATION'}
        </button>

        {import.meta.env.BASE_URL === '/play/' && (
          <a
            href="/"
            className="block text-center text-[11px] tracking-widest text-slate-400 hover:text-[#0ea5e9] transition-colors"
          >
            ← BACK TO CHEMORA LEARNING SITE
          </a>
        )}

        <div className="text-center text-[10px] text-slate-500">
          Navigation: WASD to walk, Mouse to look around, [E] or Click to interact with laboratory workbenches.
        </div>
      </div>
    </div>
  );
};
