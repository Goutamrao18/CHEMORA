import React, { useState, useMemo } from 'react';
import { KNOWLEDGE_ITEMS, KnowledgeItem } from '../data/knowledgeData';
import { Glossary } from './Glossary';
import { Search, Info, X, Sparkles, Filter, CheckCircle2, BookOpen, Layers } from 'lucide-react';

interface KnowViewProps {
  initialSearch?: string;
  onAskAI?: (topic: string) => void;
}

export const KnowView: React.FC<KnowViewProps> = ({ initialSearch = '', onAskAI }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'glossary'>('catalog');
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<KnowledgeItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Tools & Chemicals', icon: '✦' },
    { id: 'apparatus', label: 'Apparatus', icon: '⚗' },
    { id: 'measurement', label: 'Measurement', icon: '▰' },
    { id: 'heating', label: 'Heating', icon: '🔥' },
    { id: 'support', label: 'Support & Handling', icon: '⚙' },
    { id: 'safety', label: 'Safety', icon: '🛡' },
    { id: 'testing', label: 'Testing & Paper', icon: '◇' },
    { id: 'chemicals', label: 'Chemicals', icon: '🧪' },
  ];

  const filteredItems = useMemo(() => {
    return KNOWLEDGE_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q)) ||
        (item.formulaName && item.formulaName.toLowerCase().includes(q)) ||
        item.tag.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">CHEMISTRY KNOWLEDGE HUB</span>
        <h1 className="text-4xl font-black text-white mt-2 mb-3">
          Know Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Chemistry</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Explore laboratory apparatus, glassware, chemical reagents, safety precautions, and a searchable dictionary of chemistry terms.
        </p>

        {/* View Mode Switcher: Apparatus Catalog vs Glossary */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 hover:scale-102 active:scale-98 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Apparatus &amp; Chemicals ({KNOWLEDGE_ITEMS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 hover:scale-102 active:scale-98 ${
              activeTab === 'glossary'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Chemistry Glossary &amp; Dictionary</span>
          </button>
        </div>
      </div>

      {activeTab === 'glossary' ? (
        <Glossary onAskAI={onAskAI} initialSearch={search} />
      ) : (
        <>
          {/* Search bar for Catalog */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools, chemicals, formulas (e.g. Beaker, HCl, Burette)..."
              className="w-full bg-[#101726] border border-cyan-900/80 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 shadow-lg shadow-cyan-950/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

      {/* Main Grid with Sidebar Category Navigation */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Categories Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-[#0e1524] border border-cyan-950/80 rounded-2xl p-4 sticky top-20">
            <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              Categories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-cyan-950/80">
              <span className="text-xs font-bold text-cyan-400 block mb-1">Quick Tip</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click <b>Learn more →</b> on any card for full laboratory usage, formula details, and safety notes.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-cyan-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Catalog</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-semibold">{filteredItems.length} items found</span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-[#0e1524] rounded-2xl border border-cyan-950/80">
              <Info className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-white mb-1">No items matched your search</h3>
              <p className="text-sm text-slate-400 mb-4">Try checking your spelling or selecting "All Tools & Chemicals".</p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-300 hover:bg-cyan-900"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="bg-[#0e1524] border border-cyan-950/80 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/40 flex flex-col justify-between"
                >
                  <div>
                    {/* Visual: Image or Chemical Card Banner */}
                    {item.isChemical || item.formula ? (
                      <div className="h-32 bg-gradient-to-br from-[#121c2e] via-[#0d1624] to-[#0a0f19] p-4 flex flex-col items-center justify-center border-b border-cyan-950/60 relative overflow-hidden">
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                          CHEMICAL
                        </div>
                        <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
                          {item.formula || item.name}
                        </span>
                        {item.formulaName && (
                          <span className="text-xs text-slate-400 font-medium mt-1">
                            {item.formulaName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 bg-[#090d16] p-4 flex items-center justify-center border-b border-cyan-950/60 relative">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="max-h-24 max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                            onError={(e) => {
                              // If image fails, replace with icon fallback
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-4xl text-cyan-400">⚗</span>
                        )}
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase mb-2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                        {item.tag}
                      </span>
                      <h3 className="text-base font-bold text-white mb-2 leading-snug">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <button
                      onClick={() => setActiveModalItem(item)}
                      className="w-full text-center py-2 px-3 rounded-xl bg-[#121b2d] hover:bg-cyan-950 hover:text-cyan-300 border border-cyan-900/60 text-xs font-bold text-slate-300 transition"
                    >
                      Learn more →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Detail Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0e1626] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl anim-popup">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-[#0a101b]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  {activeModalItem.tag}
                </span>
                <h3 className="text-xl font-bold text-white leading-tight">
                  {activeModalItem.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Formula / Image */}
              {activeModalItem.formula ? (
                <div className="p-4 rounded-xl bg-[#131d2e] border border-cyan-900/60 text-center">
                  <span className="text-xs text-cyan-400 font-mono uppercase block mb-1">Chemical Formula</span>
                  <span className="text-3xl font-black text-white font-mono">{activeModalItem.formula}</span>
                  {activeModalItem.formulaName && (
                    <span className="block text-sm text-slate-300 mt-1">{activeModalItem.formulaName}</span>
                  )}
                </div>
              ) : activeModalItem.image ? (
                <div className="h-44 bg-[#0a0f19] rounded-xl border border-cyan-950 flex items-center justify-center p-4">
                  <img
                    src={activeModalItem.image}
                    alt={activeModalItem.name}
                    className="max-h-36 max-w-full object-contain filter drop-shadow-lg"
                  />
                </div>
              ) : null}

              {/* Summary */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Overview</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0b101a] p-3.5 rounded-xl border border-cyan-950">
                  {activeModalItem.description}
                </p>
              </div>

              {/* Detailed Info */}
              {activeModalItem.info && (
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-1.5">Laboratory Context &amp; Guidance</h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-[#0b101a] p-3.5 rounded-xl border border-cyan-950">
                    {activeModalItem.info}
                  </p>
                </div>
              )}

              {/* Ask AI button */}
              {onAskAI && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const topic = activeModalItem.name;
                      setActiveModalItem(null);
                      onAskAI(`Tell me more about ${topic} in chemistry experiments`);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-md shadow-cyan-600/30"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    Ask CHEMORA AI about {activeModalItem.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
