import React from 'react';
import { Home, Search, Compass, Sparkles, Beaker } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface NotFoundViewProps {
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onSelectTab, onOpenSearch }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center select-none">
      <div className="max-w-lg w-full bg-[#071329]/90 border border-cyan-500/40 rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-950 to-blue-900 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center text-4xl font-black mb-6 shadow-lg shadow-cyan-950/50">
          🧪
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold tracking-widest uppercase mb-3">
          CHAMBER SUBLIMATED &bull; 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Laboratory Void
        </h1>

        <p className="text-sm text-slate-300 mb-8 leading-relaxed max-w-md mx-auto">
          The requested molecular chamber or route does not exist or has decayed into an unstable quantum state. Return to known apparatus or explore our library.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-[#0e1c33] hover:bg-[#142645] border border-cyan-500/30 text-cyan-300 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Search Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
