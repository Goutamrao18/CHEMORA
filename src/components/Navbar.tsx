import React from 'react';
import { Sparkles, Sun, Moon, Search, User as UserIcon, Atom } from 'lucide-react';

export type ActiveTab = 'home' | 'know' | 'challenge' | 'experiments' | 'progress' | 'lab' | 'account';

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
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      onSelectTab('know');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0e17]/90 backdrop-blur-md border-b border-cyan-950/70 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 group text-left transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center p-1.5 shadow-sm shadow-cyan-500/20 group-hover:border-cyan-400">
            <img src="/assets/chemora-mark.svg" alt="CHEMORA" className="w-full h-full object-contain" onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
          </div>
          <div>
            <span className="block text-lg font-black tracking-wider text-white group-hover:text-cyan-400 transition">CHEMORA</span>
            <span className="block text-[10px] tracking-widest text-cyan-400/80 font-bold -mt-0.5">TOUCH. MIX. REACT.</span>
          </div>
        </button>

        {/* Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#101726]/80 p-1 rounded-xl border border-cyan-950">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'home' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('know')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'know' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Know
          </button>
          <button
            onClick={() => onSelectTab('challenge')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'challenge' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Challenge
          </button>
          <button
            onClick={() => onSelectTab('experiments')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'experiments' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Experiments
          </button>
          <button
            onClick={() => onSelectTab('progress')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'progress' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => onSelectTab('lab')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'lab' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30' : 'text-cyan-400 hover:bg-cyan-950/40'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            3D Lab
          </button>
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Global search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search chemicals, tools..."
              className="bg-[#121929] border border-cyan-950 text-xs text-white rounded-xl pl-9 pr-3 py-1.5 w-48 focus:w-64 focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-500"
            />
          </form>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAssistant}
            aria-label="Open AI Assistant"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-800/50 text-cyan-300 hover:border-cyan-400 hover:text-white transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden sm:inline">AI Tutor</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-[#121929] border border-cyan-950 text-slate-300 hover:text-white hover:border-cyan-800 transition"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>

          {/* Account Profile Button */}
          <button
            onClick={() => onSelectTab('account')}
            aria-label="Account Profile"
            className={`p-2 rounded-xl border transition ${
              activeTab === 'account'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-[#121929] border-cyan-950 text-slate-300 hover:text-white hover:border-cyan-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-cyan-950/60 bg-[#080c14] py-2 px-2 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectTab('home')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'home' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-slate-400'}`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('know')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'know' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-slate-400'}`}
        >
          Know
        </button>
        <button
          onClick={() => onSelectTab('challenge')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'challenge' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-slate-400'}`}
        >
          Challenge
        </button>
        <button
          onClick={() => onSelectTab('experiments')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'experiments' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-slate-400'}`}
        >
          Experiments
        </button>
        <button
          onClick={() => onSelectTab('progress')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'progress' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-slate-400'}`}
        >
          Progress
        </button>
        <button
          onClick={() => onSelectTab('lab')}
          className={`px-2.5 py-1 rounded-md font-medium ${activeTab === 'lab' ? 'text-cyan-400 font-bold bg-cyan-950/60' : 'text-cyan-400'}`}
        >
          3D Lab
        </button>
      </div>
    </header>
  );
};
