import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Sparkles, Flame } from 'lucide-react';
import { getDailyStreak, DailyStreakState } from '../data/streakManager';

interface TopBarProps {
  onSearch: (q: string) => void;
  onOpenAssistant: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  onGoToProgress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSearch,
  onOpenAssistant,
  isLightMode,
  onToggleTheme,
  onGoToProgress,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [streakState, setStreakState] = useState<DailyStreakState>(getDailyStreak);

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

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-[172px] h-16 z-30 px-4 sm:px-8 flex items-center justify-between gap-4 pointer-events-none">
      {/* Spacer on mobile for hamburger */}
      <div className="w-10 lg:hidden pointer-events-auto" />

      {/* Pill Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-[540px] mx-auto pointer-events-auto"
      >
        <div className="relative flex items-center h-[42px] px-4 rounded-full bg-[#07162e]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition overflow-hidden group">
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
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
        {/* Streak Counter Chip */}
        <button
          onClick={onGoToProgress}
          aria-label="View daily streak and progress"
          title={`Daily Streak: ${streakState.currentStreak} days (${streakState.streakLevel})`}
          className="h-10 px-3.5 rounded-full flex items-center gap-1.5 bg-[#0e1628]/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 group backdrop-blur-md"
        >
          <span className="text-base group-hover:scale-125 transition-transform duration-200">🔥</span>
          <span className="text-xs font-black tracking-tight font-mono">
            {streakState.currentStreak}d
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#07162e]/85 border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 hover:text-white transition-all duration-200 shadow-md hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onOpenAssistant}
          aria-label="Open AI Assistant"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 via-[#07162e]/90 to-purple-500/20 border border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(57,215,255,0.45)] hover:text-white transition-all duration-200 shadow-md hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        </button>
      </div>
    </div>
  );
};
