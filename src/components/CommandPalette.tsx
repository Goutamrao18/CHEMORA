import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ActiveTab } from './Navbar';
import {
  Search,
  BookOpen,
  Trophy,
  Beaker,
  Compass,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  Command,
  ArrowRight,
  Flame,
  X
} from 'lucide-react';
import { KNOWLEDGE_ITEMS } from '../data/knowledgeData';
import { isSoundEnabled, setSoundEnabled, playSoftClick } from '../utils/soundEffects';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAssistant: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Knowledge' | 'Actions';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAssistant,
  isLightMode,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [soundActive, setSoundActive] = useState(isSoundEnabled);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync sound setting state
  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setSoundActive(custom.detail);
    };
    window.addEventListener('chemora:sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('chemora:sound_toggle', handleSoundToggle);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playSoftClick();
  };

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-home',
        title: 'Home Chamber',
        subtitle: 'Overview, interactive beaker video & quick workspace',
        category: 'Navigation',
        icon: <span className="font-mono text-cyan-400">⌂</span>,
        action: () => { onSelectTab('home'); onClose(); },
      },
      {
        id: 'nav-know',
        title: 'Know Library & Glossary',
        subtitle: '134 laboratory apparatus, glassware & chemical reagents',
        category: 'Navigation',
        icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
        action: () => { onSelectTab('know'); onClose(); },
      },
      {
        id: 'nav-challenge',
        title: 'Challenge Arena',
        subtitle: '100 progressive curriculum-aligned chemistry levels',
        category: 'Navigation',
        icon: <Trophy className="w-4 h-4 text-purple-400" />,
        action: () => { onSelectTab('challenge'); onClose(); },
      },
      {
        id: 'nav-experiments',
        title: 'Guided Experiments',
        subtitle: '20 practical protocols with video explainers',
        category: 'Navigation',
        icon: <Beaker className="w-4 h-4 text-emerald-400" />,
        action: () => { onSelectTab('experiments'); onClose(); },
      },
      {
        id: 'nav-progress',
        title: 'Progress & Discipline Rings',
        subtitle: 'Concentric analytics, 52-week streak heatmap & badges',
        category: 'Navigation',
        icon: <Compass className="w-4 h-4 text-amber-400" />,
        action: () => { onSelectTab('progress'); onClose(); },
      },
      {
        id: 'nav-account',
        title: 'Researcher Profile',
        subtitle: 'Account settings, lab rank & preferences',
        category: 'Navigation',
        icon: <User className="w-4 h-4 text-blue-400" />,
        action: () => { onSelectTab('account'); onClose(); },
      },
      // Actions
      {
        id: 'act-assistant',
        title: 'CHEMORA AI Assistant',
        subtitle: 'Open intelligent chemistry chatbot & equation balancer',
        category: 'Actions',
        icon: <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />,
        action: () => { onClose(); onOpenAssistant(); },
      },
      {
        id: 'act-sound',
        title: soundActive ? 'Disable Soft UI Sounds' : 'Enable Soft UI Sounds',
        subtitle: 'Toggle gentle synthetic audio feedback',
        category: 'Actions',
        icon: soundActive ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />,
        action: () => { toggleSound(); },
      },
      ...(onToggleTheme ? [{
        id: 'act-theme',
        title: isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode',
        subtitle: isLightMode ? 'Enable dark laboratory theme' : 'Enable clean light laboratory theme',
        category: 'Actions' as const,
        icon: <span className="text-cyan-400">{isLightMode ? '🌙' : '☀️'}</span>,
        action: () => { onToggleTheme(); onClose(); },
      }] : []),
    ];

    // Add popular chemical library items
    const sampleItems = KNOWLEDGE_ITEMS.slice(0, 18).map((item) => ({
      id: `know-${item.id}`,
      title: item.name,
      subtitle: item.formula ? `Formula: ${item.formula} · ${item.category}` : `${item.tag} · ${item.category}`,
      category: 'Knowledge' as const,
      icon: <span className="font-mono text-cyan-300 text-xs">{item.formula || '⚗'}</span>,
      action: () => {
        onSelectTab('know');
        onClose();
      },
    }));

    return [...list, ...sampleItems];
  }, [soundActive, onSelectTab, onOpenAssistant, onClose, isLightMode, onToggleTheme]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-md anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#061224] border border-cyan-500/40 shadow-[0_24px_80px_rgba(0,0,0,0.7)] overflow-hidden anim-popup"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-cyan-950 bg-[#08152c]">
          <Search className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, section, or chemical..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white transition"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono text-cyan-400/80 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded ml-2">
            ESC
          </span>
        </div>

        {/* Command list */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors duration-150 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-white border border-cyan-400/50 shadow-sm'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#0b1b36] border border-cyan-900/60 flex items-center justify-center flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                        <span>{cmd.title}</span>
                        <span className="text-[10px] font-mono text-cyan-400/70 font-normal">
                          · {cmd.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#040c1a] border-t border-cyan-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">↵</kbd> Select</span>
          </div>
          <span className="font-mono text-cyan-400 text-[10px]">CHEMORA PALETTE</span>
        </div>
      </div>
    </div>
  );
};
