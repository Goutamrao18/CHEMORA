import React from 'react';
import { ActiveTab } from './Navbar';
import { Home, BookOpen, Trophy, TrendingUp, Beaker, Play, Sparkles, User, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAssistant,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Home', symbol: '⌂' },
    { id: 'know' as ActiveTab, label: 'Know', symbol: '▤' },
    { id: 'challenge' as ActiveTab, label: 'Challenge', symbol: '⚗' },
    { id: 'progress' as ActiveTab, label: 'Progress', symbol: '▥' },
    { id: 'experiments' as ActiveTab, label: 'Experiments', symbol: '⌬' },
    { id: 'lab' as ActiveTab, label: 'Play', symbol: '⚗' },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Trigger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-xl bg-[#08152c]/90 border border-cyan-500/30 text-cyan-300 shadow-lg backdrop-blur-md"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Authentic CHEMORA Left Sidebar App Rail */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 w-[172px] bg-gradient-to-b from-[#051126]/95 to-[#020814]/95 border-r border-cyan-500/20 backdrop-blur-xl flex flex-col justify-between p-3.5 shadow-2xl transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Brand header */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left px-2 py-2 group transition"
          >
            <div className="w-7 h-7 flex-shrink-0 filter drop-shadow-[0_0_10px_rgba(62,211,255,0.7)]">
              <img
                src="/assets/chemora-mark.svg"
                alt="CHEMORA"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="block text-sm font-black tracking-wider text-white group-hover:text-cyan-400 transition leading-tight">
                CHEMORA
              </span>
              <span className="block text-[8px] tracking-widest text-cyan-400 font-bold -mt-0.5 whitespace-nowrap">
                TOUCH. MIX. REACT.
              </span>
            </div>
          </button>

          {/* Navigation Links List */}
          <nav className="flex flex-col gap-1.5 mt-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2.5 w-full h-[42px] px-3 rounded-xl text-xs font-semibold text-left transition-all duration-200 hover:scale-102 active:scale-98 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600/90 to-indigo-600/70 border border-cyan-400/60 shadow-[0_0_20px_rgba(35,129,255,0.35)]'
                      : 'text-slate-300 hover:text-white hover:bg-cyan-500/10'
                  }`}
                >
                  {/* Left indicator bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r shadow-[0_0_8px_#38bdf8] anim-slide-right" />
                  )}
                  <span className="w-4 text-center font-mono text-sm opacity-90 text-cyan-300">
                    {item.symbol}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* AI Assistant link in rail */}
            <button
              onClick={() => {
                onOpenAssistant();
                setMobileOpen(false);
              }}
              className="flex items-center gap-2.5 w-full h-[42px] px-3 rounded-xl text-xs font-semibold text-left text-cyan-300 hover:text-white hover:bg-cyan-500/10 transition-all duration-200 hover:scale-102 active:scale-98"
            >
              <span className="w-4 text-center font-mono text-sm text-cyan-400">✦</span>
              <span>AI Assistant</span>
            </button>
          </nav>
        </div>

        {/* Bottom: Account button */}
        <div className="pt-3 border-t border-cyan-900/40">
          <button
            onClick={() => handleNavClick('account')}
            className={`flex items-center gap-2.5 w-full h-[42px] px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-102 active:scale-98 ${
              activeTab === 'account'
                ? 'bg-blue-600/90 text-white border border-cyan-400/50 shadow-md shadow-blue-600/30'
                : 'bg-[#0b1c37]/70 text-slate-300 hover:text-white border border-cyan-900/40 hover:border-cyan-700'
            }`}
          >
            <User className="w-4 h-4 text-cyan-400" />
            <span>Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};
