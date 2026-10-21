import React, { useState } from 'react';
import { Sparkles, Sun, Moon, Search, User as UserIcon, BookOpen, Trophy, Beaker, TrendingUp, Home } from 'lucide-react';

export type ActiveTab = 'home' | 'know' | 'challenge' | 'experiments' | 'progress' | 'account';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAssistant: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAssistant,
  isLightMode,
  onToggleTheme,
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      onSelectTab('know');
      setIsSearchOpen(false);
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'know', label: 'Know', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'challenge', label: 'Challenge', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'experiments', label: 'Experiments', icon: <Beaker className="w-3.5 h-3.5" /> },
    { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070b14]/95 backdrop-blur-md border-b border-cyan-950/70 text-slate-100 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 group text-left transition flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center p-1.5 shadow-sm shadow-cya[...]">
            <img
              src="/assets/chemora-mark.svg"
              alt="CHEMORA"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <span className="block text-base sm:text-lg font-black tracking-wider text-white group-hover:text-cyan-400 transition leading-none">
              CHEMORA
            </span>
            <span className="block text-[9px] tracking-widest text-cyan-400/80 font-bold mt-0.5">
              TOUCH. MIX. REACT.
            </span>
          </div>
        </button>

        {/* Central Navigation - Always Accessible */}
        <nav className="flex items-center gap-1 bg-[#0e1626]/90 p-1 rounded-xl border border-cyan-900/60 overflow-x-auto no-scrollbar max-w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Search Toggle / Input */}
          <form onSubmit={handleSearchSubmit} className="relative hidden xl:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search library..."
              className="bg-[#101726] border border-cyan-950 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 w-40 focus:w-56 focus:outline-none focus:border-cyan-400 transition-all placeholder-sla[...]"
            />
          </form>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            aria-label="Open CHEMORA AI"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-700/60 text-cyan-300 hover:border-cyan-400 ho[...]"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold hidden sm:inline">CHEMORA AI</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-[#101726] border border-cyan-950 text-slate-300 hover:text-white hover:border-cyan-800 transition"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>

          {/* Account Profile Button */}
          <button
            onClick={() => onSelectTab('account')}
            aria-label="Account Profile"
            className={`p-2 rounded-xl border transition ${
              activeTab === 'account'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                : 'bg-[#101726] border-cyan-950 text-slate-300 hover:text-white hover:border-cyan-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
