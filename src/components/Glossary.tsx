import React, { useState, useMemo, useEffect } from 'react';
import {
  GLOSSARY_TERMS,
  GLOSSARY_CATEGORIES,
  GlossaryTerm
} from '../data/glossaryData';
import {
  Search,
  BookOpen,
  Sparkles,
  Filter,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  X
} from 'lucide-react';

interface GlossaryProps {
  onAskAI?: (topic: string) => void;
  initialSearch?: string;
}

const STORAGE_BOOKMARKS_KEY = 'chemora_glossary_bookmarks';

export const Glossary: React.FC<GlossaryProps> = ({ onAskAI, initialSearch = '' }) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Terms');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inspectedTerm, setInspectedTerm] = useState<GlossaryTerm | null>(null);

  // User bookmarked terms
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(next));
      } catch {}
      triggerToast(exists ? 'Term removed from bookmarks' : 'Term added to bookmarks ★');
      return next;
    });
  };

  const handleCopyDefinition = (term: GlossaryTerm, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${term.term}: ${term.definition} ${term.formula ? `(${term.formula})` : ''}`;
    try {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(term.id);
      triggerToast(`Copied "${term.term}" definition to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Available initial letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    GLOSSARY_TERMS.forEach((t) => {
      letters.add(t.term.charAt(0).toUpperCase());
    });
    return Array.from(letters).sort();
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const q = search.trim().toLowerCase();

    return GLOSSARY_TERMS.filter((item) => {
      // Bookmarks filter
      if (onlyBookmarks && !bookmarks.includes(item.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All Terms' && item.category !== selectedCategory) {
        return false;
      }

      // Letter filter
      if (selectedLetter !== 'ALL') {
        if (item.term.charAt(0).toUpperCase() !== selectedLetter) {
          return false;
        }
      }

      // Search query
      if (!q) return true;

      return (
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q)) ||
        item.example.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.relatedTerms.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCategory, selectedLetter, onlyBookmarks, bookmarks]);

  // Jump to term
  const handleSelectRelated = (relatedTerm: string) => {
    setSearch(relatedTerm);
    setSelectedCategory('All Terms');
    setSelectedLetter('ALL');
    setOnlyBookmarks(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      {/* Floating Action Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-[90%] anim-slide-down anim-popup pointer-events-auto">
          <div className="p-4 rounded-2xl border border-cyan-500/60 bg-[#091830]/95 backdrop-blur-xl shadow-[0_10px_35px_rgba(6,182,212,0.3)] text-cyan-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold leading-snug">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Term Inspector Modal Popup */}
      {inspectedTerm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gradient-to-b from-[#0e172a] via-[#09101f] to-[#040813] border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] anim-popup relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 uppercase tracking-wider">
                    {inspectedTerm.category}
                  </span>
                  {inspectedTerm.formula && (
                    <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300">
                      {inspectedTerm.formula}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{inspectedTerm.term}</h2>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => toggleBookmark(inspectedTerm.id, e)}
                  title={bookmarks.includes(inspectedTerm.id) ? 'Remove bookmark' : 'Bookmark term'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition hover:scale-105 active:scale-95 ${
                    bookmarks.includes(inspectedTerm.id)
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-[#070e1c] border-cyan-950 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarks.includes(inspectedTerm.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => setInspectedTerm(null)}
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg transition hover:scale-105 active:scale-95"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* In-depth definition */}
            <div className="p-4 rounded-2xl bg-[#070d18] border border-cyan-950/80 mb-5 text-sm text-slate-200 leading-relaxed">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                Fundamental Definition &amp; Mechanism
              </span>
              <p>{inspectedTerm.definition}</p>
            </div>

            {/* Practical Application */}
            <div className="p-4 rounded-2xl bg-[#091324] border border-cyan-900/60 mb-5 text-xs text-slate-300">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Laboratory Context &amp; Experimental Application
              </span>
              <p className="leading-relaxed">{inspectedTerm.example}</p>
            </div>

            {/* Related terms */}
            <div className="mb-6">
              <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-2">
                Cross-Referenced Chemical Concepts:
              </span>
              <div className="flex flex-wrap gap-2">
                {inspectedTerm.relatedTerms.map((rel) => (
                  <button
                    key={rel}
                    onClick={() => {
                      handleSelectRelated(rel);
                      setInspectedTerm(null);
                    }}
                    className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#071328] hover:bg-cyan-950 hover:text-cyan-300 border border-cyan-950 hover:border-cyan-800 text-slate-300 transition hover:scale-105 active:scale-95"
                  >
                    → {rel}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-cyan-950 flex-wrap">
              <button
                onClick={(e) => handleCopyDefinition(inspectedTerm, e)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 transition hover:scale-102"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Definition</span>
              </button>

              <div className="flex items-center gap-2">
                {onAskAI && (
                  <button
                    onClick={() => {
                      onAskAI(inspectedTerm.term);
                      setInspectedTerm(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white flex items-center gap-1.5 transition hover:scale-105 shadow-md shadow-cyan-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask CHEMORA AI</span>
                  </button>
                )}
                <button
                  onClick={() => setInspectedTerm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Search & Top Action Bar */}
      <div className="bg-[#0b1220] border border-cyan-900/50 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span>Chemistry Terms &amp; Definitions</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Search {GLOSSARY_TERMS.length} essential chemical concepts, laws, and experimental techniques.
            </p>
          </div>

          {/* Bookmarks toggle */}
          <button
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex-shrink-0 ${
              onlyBookmarks
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-[#101b30] text-slate-300 hover:text-white border border-cyan-900/60'
            }`}
          >
            {onlyBookmarks ? (
              <BookmarkCheck className="w-4 h-4 text-slate-950" />
            ) : (
              <Bookmark className="w-4 h-4 text-amber-400" />
            )}
            <span>Saved Terms ({bookmarks.length})</span>
          </button>
        </div>

        {/* Search input with reset */}
        <div className="relative">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search definitions, formulas, or concepts (e.g. Titration, pH, Le Chatelier, Ksp)..."
            className="w-full bg-[#070e1c] border border-cyan-900/80 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 shadow-inner transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-5 pb-2 scrollbar-none">
          {GLOSSARY_CATEGORIES.map((cat) => {
            const count =
              cat === 'All Terms'
                ? GLOSSARY_TERMS.length
                : GLOSSARY_TERMS.filter((t) => t.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOnlyBookmarks(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-[#0e172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-950/20 text-slate-900' : 'bg-cyan-950 text-cyan-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* A-Z Alphabet Quick Jump */}
        <div className="flex items-center gap-1 pt-4 border-t border-cyan-950/80 overflow-x-auto text-[11px] font-mono font-bold">
          <span className="text-slate-500 mr-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" /> A-Z:
          </span>
          <button
            onClick={() => setSelectedLetter('ALL')}
            className={`px-2 py-0.5 rounded-md transition ${
              selectedLetter === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          {availableLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                selectedLetter === letter
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-cyan-950/60'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header / Stats */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          {filteredTerms.length} {filteredTerms.length === 1 ? 'Term Found' : 'Terms Found'}
          {selectedCategory !== 'All Terms' ? ` in ${selectedCategory}` : ''}
          {selectedLetter !== 'ALL' ? ` (Starting with "${selectedLetter}")` : ''}
          {onlyBookmarks ? ' (Saved)' : ''}
        </span>

        {(search || selectedCategory !== 'All Terms' || selectedLetter !== 'ALL' || onlyBookmarks) && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All Terms');
              setSelectedLetter('ALL');
              setOnlyBookmarks(false);
            }}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Terms Grid */}
      {filteredTerms.length === 0 ? (
        <div className="text-center py-16 bg-[#0b1220] rounded-3xl border border-cyan-950 p-8">
          <HelpCircle className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-white mb-1">No chemistry terms matched your criteria</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            {onlyBookmarks
              ? "You haven't bookmarked any terms yet. Click the bookmark icon on any term card to save it for quick review."
              : 'Try checking your search spelling or resetting your category and A-Z filters.'}
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All Terms');
              setSelectedLetter('ALL');
              setOnlyBookmarks(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Clear Search Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTerms.map((term) => {
            const isSaved = bookmarks.includes(term.id);
            const isCopied = copiedId === term.id;

            return (
              <article
                key={term.id}
                onClick={() => setInspectedTerm(term)}
                className="group bg-[#0e1627] hover:bg-[#111b30] border border-cyan-950/90 hover:border-cyan-500/60 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.015] hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/50 flex flex-col justify-between relative overflow-hidden cursor-pointer"
              >
                <div>
                  {/* Card Top: Term & Category & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-800/50 uppercase tracking-wider">
                          {term.category}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-300 transition leading-snug">
                        {term.term}
                      </h3>
                    </div>

                    {/* Action buttons (Bookmark & Copy) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleCopyDefinition(term, e)}
                        title="Copy definition to clipboard"
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#070e1c] border border-cyan-950 hover:border-cyan-500/40 text-slate-400 hover:text-white transition"
                        aria-label="Copy definition"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => toggleBookmark(term.id, e)}
                        title={isSaved ? 'Remove bookmark' : 'Bookmark term'}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition ${
                          isSaved
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-[#070e1c] border-cyan-950 hover:border-amber-400/50 text-slate-400 hover:text-amber-300'
                        }`}
                        aria-label="Bookmark term"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Definition Body */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {term.definition}
                  </p>

                  {/* Formula Badge (if present) */}
                  {term.formula && (
                    <div className="mb-4 p-3 rounded-2xl bg-[#060b14] border border-cyan-950/80 font-mono text-xs text-cyan-300 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        Formula:
                      </span>
                      <code className="text-xs text-amber-300 font-bold overflow-x-auto">{term.formula}</code>
                    </div>
                  )}

                  {/* Practical Laboratory Application / Example */}
                  <div className="mb-4 p-3.5 rounded-2xl bg-[#091120] border border-cyan-950 text-xs">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Laboratory Application
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                      {term.example}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Related Terms & Ask AI */}
                <div className="pt-3 border-t border-cyan-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">Related:</span>
                    {term.relatedTerms.map((rel) => (
                      <button
                        key={rel}
                        onClick={() => handleSelectRelated(rel)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#081224] hover:bg-cyan-950 hover:text-cyan-300 border border-cyan-950 hover:border-cyan-800 text-slate-400 transition"
                      >
                        {rel}
                      </button>
                    ))}
                  </div>

                  {onAskAI && (
                    <button
                      onClick={() => onAskAI(term.term)}
                      className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex-shrink-0 transition self-end sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ask AI Tutor</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
