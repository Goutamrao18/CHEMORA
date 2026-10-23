import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Flame, X, Volume2, VolumeX, Command } from 'lucide-react';
import { getDailyStreak, DailyStreakState } from '../data/streakManager';
import { isSoundEnabled, setSoundEnabled, playSoftClick } from '../utils/soundEffects';

interface TopBarProps {
  onSearch: (q: string) => void;
  onOpenAssistant: () => void;
  onGoToProgress?: () => void;
  onOpenCommandPalette?: () => void;
  onSelectHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSearch,
  onOpenAssistant,
  onGoToProgress,
  onOpenCommandPalette,
  onSelectHome,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [streakState, setStreakState] = useState<DailyStreakState>(getDailyStreak);
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled);

  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setSoundActive(custom.detail);
    };
    window.addEventListener('chemora:sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('chemora:sound_toggle', handleSoundToggle);
  }, []);

  useEffect(() => {
    const handleStreakUpdate = () => {
      setStreakState(getDailyStreak());
    };
    window.addEventListener('chemora:streak_update', handleStreakUpdate);
    return () => window.removeEventListener('chemora:streak_update', handleStreakUpdate);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className="fixed top-0 right-0 left-0 h-16 z-30 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 sm:gap-4 pointer-events-none">
      {/* Brand Logo & Name (Left side of TopBar) */}
      <button
        type="button"
        onClick={onSelectHome}
        aria-label="CHEMORA Home"
        className="pointer-events-auto flex items-center gap-2 group flex-shrink-0 transition active:scale-[0.97]"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center p-1.5 shadow-sm">
          <img
            src="/assets/chemora-mark.svg"
            alt="CHEMORA"
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
        <div className="hidden xs:block text-left">
          <span className="block text-sm sm:text-base font-black tracking-wider text-white group-hover:text-cyan-400 transition leading-none">
            CHEMORA
          </span>
          <span className="block text-[8px] font-mono tracking-widest text-cyan-400/80 font-bold mt-0.5">
            CHEMISTRY
          </span>
        </div>
      </button>

      {/* Pill Search Bar - Centered in TopBar */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-[540px] mx-auto pointer-events-auto"
      >
        <div className="relative flex items-center h-[44px] px-3.5 sm:px-4 rounded-full bg-[#07162e]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition overflow-hidden group">
          {/* Top specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <Search className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0 group-focus-within:scale-110 transition-transform" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search chemicals, topics, experiments..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-1 rounded-full text-slate-400 hover:text-white transition flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              title="Open Command Palette (⌘K / Ctrl+K)"
              className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-400/80 bg-cyan-950/70 border border-cyan-800/40 hover:border-cyan-500/50 hover:text-cyan-200 transition"
            >
              <span>⌘K</span>
            </button>
          )}
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
        {/* Command Palette Button for Mobile / Quick Access */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label="Open Command Palette (Ctrl+K)"
          title="Command Palette (Ctrl+K)"
          className="sm:hidden min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-[#07162e]/85 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 active:scale-[0.96] transition shadow-md backdrop-blur-md"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Soft Audio Effects Toggle (Tablet/Desktop or >= 400px) */}
        <button
          type="button"
          onClick={() => {
            const next = !soundActive;
            setSoundActive(next);
            setSoundEnabled(next);
            if (next) playSoftClick();
          }}
          aria-label={soundActive ? 'Disable UI sounds' : 'Enable soft UI sounds'}
          title={soundActive ? 'UI Sounds: Enabled (click to mute)' : 'UI Sounds: Muted (click to enable)'}
          className={`hidden xs:flex min-w-[44px] min-h-[44px] rounded-full items-center justify-center border transition-all duration-200 shadow-md active:scale-[0.96] backdrop-blur-md ${
            soundActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(20,163,196,0.3)]'
              : 'bg-[#07162e]/85 border-cyan-500/30 text-slate-400 hover:text-slate-200'
          }`}
        >
          {soundActive ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Streak Counter Chip */}
        <button
          type="button"
          onClick={onGoToProgress}
          aria-label="View daily streak and progress"
          title={`Daily Streak: ${streakState.currentStreak} days (${streakState.streakLevel})`}
          className="min-h-[44px] px-3 rounded-full flex items-center gap-1.5 bg-[#0e1628]/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-[0.96] group backdrop-blur-md"
        >
          <span className="text-base group-hover:scale-115 transition-transform duration-200">🔥</span>
          <span className="text-xs font-black tracking-tight font-mono">
            {streakState.currentStreak}d
          </span>
        </button>
      </div>
    </div>
  );
};
