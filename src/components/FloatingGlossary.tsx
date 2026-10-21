import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen,
  Search,
  X,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  ChevronRight,
  FlaskConical,
  Pin,
  PinOff,
} from 'lucide-react';
import { GLOSSARY_TERMS, GlossaryTerm, GLOSSARY_CATEGORIES } from '../data/glossaryData';
import { EquationText } from './EquationText';

interface FloatingGlossaryProps {
  onAskAI?: (topic: string) => void;
}

export const FloatingGlossary: React.FC<FloatingGlossaryProps> = ({ onAskAI }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Terms');
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null);
  const [hoveredTerm, setHoveredTerm] = useState<GlossaryTerm | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside if not pinned
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (isPinned) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveTerm(null);
        setHoveredTerm(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isPinned]);

  const filteredTerms = useMemo(() => {
    const q = search.toLowerCase().trim();
    return GLOSSARY_TERMS.filter((item) => {
      const matchCat = selectedCategory === 'All Terms' || item.category === selectedCategory;
      const matchSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  // Current term displayed in the pop-up (either hovered or clicked/active)
  const currentDisplayTerm = hoveredTerm || activeTerm || filteredTerms[0] || null;

  const handleCopy = (term: GlossaryTerm) => {
    const text = `${term.term}: ${term.definition} ${term.formula ? `(${term.formula})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 left-4 sm:left-6 z-40">
      {/* Floating Pill Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0a1424]/90 hover:bg-[#0f1d33] border border-cyan-500/40 hover:border-cyan-400 text-white font-bold text-xs shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_40px_rgba(6,182,212,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-xl"
          title="Open Chemical Glossary Quick-Lookup"
          aria-label="Open Floating Chemical Glossary"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-sm">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide">Glossary</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {GLOSSARY_TERMS.length}
          </span>
        </button>
      )}

      {/* Expanded Floating Glossary Panel */}
      {isOpen && (
        <div className="w-[min(400px,calc(100vw-32px))] bg-[#0a1322]/95 border border-cyan-500/40 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-2xl anim-popup max-h-[82vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-900/50 bg-gradient-to-r from-[#0d1b30] via-[#0b172a] to-[#0a1322]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white tracking-wide">Chemical Glossary</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                    Instant Pop-up
                  </span>
                </div>
                <small className="block text-[10px] text-slate-400">
                  Hover or tap any term for instant definition
                </small>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition ${
                  isPinned ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={isPinned ? 'Unpin Glossary' : 'Pin Glossary open'}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTerm(null);
                  setHoveredTerm(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition hover:scale-105 active:scale-95"
                aria-label="Close Floating Glossary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-[#070e1a] border-b border-cyan-950/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chemical terms (e.g. Meniscus, Titration, Ksp)..."
                className="w-full bg-[#0d1829] border border-cyan-900/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Category Tabs */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar mt-2 pt-1">
              {['All Terms', 'Techniques & Lab', 'Acids & Bases', 'Atomic & Bonding', 'Thermodynamics & Kinetics', 'Solutions & Equilibrium'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat === 'All Terms' ? 'All' : cat.split('&')[0].trim()}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Term Chips Grid */}
          <div className="p-3 overflow-y-auto max-h-40 border-b border-cyan-950/80 bg-[#08111e]">
            <div className="flex flex-wrap gap-1.5">
              {filteredTerms.map((t) => {
                const isSelected = currentDisplayTerm?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onMouseEnter={() => setHoveredTerm(t)}
                    onMouseLeave={() => setHoveredTerm(null)}
                    onClick={() => {
                      setActiveTerm(t);
                      setHoveredTerm(null);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 scale-105'
                        : 'bg-[#0e1b2f] text-slate-300 hover:bg-cyan-950 hover:text-cyan-200 border border-cyan-900/40'
                    }`}
                  >
                    <span>{t.term}</span>
                    <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-cyan-400/50'}`} />
                  </button>
                );
              })}

              {filteredTerms.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400 w-full">
                  No chemical terms found matching "{search}".
                </div>
              )}
            </div>
          </div>

          {/* Instant Pop-Up Definition Card (Pop-up Preview) */}
          {currentDisplayTerm ? (
            <div className="p-4 bg-gradient-to-b from-[#0b172a] to-[#070e1c] overflow-y-auto flex-1 space-y-3 anim-fade-in">
              {/* Term Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-white tracking-wide">
                      {currentDisplayTerm.term}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                      {currentDisplayTerm.category}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(currentDisplayTerm)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 transition"
                  title="Copy definition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Chemical Formula or Equation (if present) */}
              {currentDisplayTerm.formula && (
                <div className="bg-[#050c18] border border-cyan-500/30 rounded-xl p-2.5 shadow-inner">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 block mb-1">
                    Chemical Notation / Formula:
                  </span>
                  <EquationText content={currentDisplayTerm.formula} className="text-xs text-cyan-200 font-serif" />
                </div>
              )}

              {/* Definition */}
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  Definition
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-[#0a1526]/70 p-3 rounded-xl border border-cyan-900/30">
                  {currentDisplayTerm.definition}
                </p>
              </div>

              {/* Real-World Lab Example */}
              {currentDisplayTerm.example && (
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1 uppercase tracking-wider flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" /> Practical Example
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl">
                    {currentDisplayTerm.example}
                  </p>
                </div>
              )}

              {/* Related Terms */}
              {currentDisplayTerm.relatedTerms && currentDisplayTerm.relatedTerms.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Related Concepts:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentDisplayTerm.relatedTerms.map((rt) => (
                      <button
                        key={rt}
                        onClick={() => {
                          const found = GLOSSARY_TERMS.find(
                            (x) => x.term.toLowerCase() === rt.toLowerCase()
                          );
                          if (found) {
                            setActiveTerm(found);
                            setHoveredTerm(null);
                          } else {
                            setSearch(rt);
                          }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-cyan-900/50 text-cyan-300 hover:text-white border border-cyan-900/30 transition"
                      >
                        {rt} →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask AI Action Button */}
              {onAskAI && (
                <div className="pt-2 border-t border-cyan-950 flex justify-end">
                  <button
                    onClick={() => {
                      onAskAI(
                        `Explain the concept of "${currentDisplayTerm.term}" in chemistry, its practical lab significance, and how to apply it in problem solving.`
                      );
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-sm shadow-cyan-500/20 hover:scale-102 active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About {currentDisplayTerm.term}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Select or hover over a term to view its instant pop-up definition.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
