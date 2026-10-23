import React, { useState, useMemo, useRef } from 'react';
import { KNOWLEDGE_ITEMS, KnowledgeItem } from '../data/knowledgeData';
import { Glossary } from './Glossary';
import { Search, X, Sparkles, Filter, BookOpen, Layers, ZoomIn, ShieldAlert, AlertTriangle, Flame, Atom, Dna } from 'lucide-react';
import { PeriodicTable } from './PeriodicTable';
import { BioscienceView } from './BioscienceView';
import { DropperDrip } from './Loaders/DropperDrip';
import { NFPA704Diamond } from './NFPA704Diamond';
import { ImageZoomViewer } from './ImageZoomViewer';
import { getChemicalHazard } from '../utils/chemicalHazards';
import { playSoftClick } from '../utils/soundEffects';

interface KnowViewProps {
  initialSearch?: string;
  onAskAI?: (topic: string) => void;
}

// Text Highlighter for instant search matching (Item 5)
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-cyan-400/30 text-cyan-200 font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const KnowView: React.FC<KnowViewProps> = ({ initialSearch = '', onAskAI }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'periodic-table' | 'glossary' | 'bioscience'>(() => {
    try {
      const stored = window.sessionStorage?.getItem('chemora:know_tab');
      if (stored === 'bioscience') {
        window.sessionStorage.removeItem('chemora:know_tab');
        return 'bioscience';
      }
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('bioscience')) return 'bioscience';
      if (hash.includes('periodic')) return 'periodic-table';
      if (hash.includes('glossary')) return 'glossary';
    } catch {}
    return 'catalog';
  });
  const [bioscienceInitialQuery, setBioscienceInitialQuery] = useState<string>('TP53');
  const [isBioscienceFullscreen, setIsBioscienceFullscreen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'apparatus' | 'chemicals' | 'indicators' | 'hazards'>('all');
  const [activeModalItem, setActiveModalItem] = useState<KnowledgeItem | null>(null);
  const [zoomViewerItem, setZoomViewerItem] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Mobile Bottom Sheet Drag-to-Dismiss State
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartY = useRef<number>(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!isSheetDragging) return;
    const delta = e.touches[0].clientY - sheetTouchStartY.current;
    if (delta > 0) {
      setSheetDragY(delta);
    } else {
      setSheetDragY(0);
    }
  };

  const handleSheetTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 80) {
      setActiveModalItem(null);
    }
    setSheetDragY(0);
  };

  // Filter Chips specification (Item 5: apparatus, chemicals, indicators, hazards)
  const filterChips = [
    { id: 'all' as const, label: 'All Catalog', icon: '✦', count: KNOWLEDGE_ITEMS.length },
    { id: 'apparatus' as const, label: 'Apparatus', icon: '⚗', count: KNOWLEDGE_ITEMS.filter((i) => !i.isChemical && !i.formula).length },
    { id: 'chemicals' as const, label: 'Chemicals', icon: '🧪', count: KNOWLEDGE_ITEMS.filter((i) => i.isChemical || !!i.formula).length },
    {
      id: 'indicators' as const,
      label: 'Indicators',
      icon: '◇',
      count: KNOWLEDGE_ITEMS.filter(
        (i) =>
          i.category === 'testing' ||
          i.name.toLowerCase().includes('indicator') ||
          i.name.toLowerCase().includes('litmus') ||
          i.name.toLowerCase().includes('paper')
      ).length,
    },
    {
      id: 'hazards' as const,
      label: 'Hazards & Safety',
      icon: '⚠',
      count: KNOWLEDGE_ITEMS.filter(
        (i) => i.category === 'safety' || (i.isChemical && !i.name.toLowerCase().includes('water'))
      ).length,
    },
  ];

  const filteredItems = useMemo(() => {
    return KNOWLEDGE_ITEMS.filter((item) => {
      // 1. Filter Chip match
      let matchesFilter = true;
      if (selectedFilter === 'apparatus') {
        matchesFilter = !item.isChemical && !item.formula;
      } else if (selectedFilter === 'chemicals') {
        matchesFilter = Boolean(item.isChemical || item.formula);
      } else if (selectedFilter === 'indicators') {
        matchesFilter =
          item.category === 'testing' ||
          item.name.toLowerCase().includes('indicator') ||
          item.name.toLowerCase().includes('litmus') ||
          item.name.toLowerCase().includes('paper');
      } else if (selectedFilter === 'hazards') {
        matchesFilter =
          item.category === 'safety' ||
          (Boolean(item.isChemical || item.formula) && !item.name.toLowerCase().includes('water'));
      }

      // 2. Instant Search query match
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q)) ||
        (item.formulaName && item.formulaName.toLowerCase().includes(q)) ||
        item.tag.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [search, selectedFilter]);

  const handleFilterClick = (filterId: typeof selectedFilter) => {
    playSoftClick();
    setSelectedFilter(filterId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Lightbox Zoom Viewer Modal */}
      {zoomViewerItem && (
        <ImageZoomViewer
          isOpen={Boolean(zoomViewerItem)}
          onClose={() => setZoomViewerItem(null)}
          imageUrl={zoomViewerItem.url}
          title={zoomViewerItem.title}
          subtitle={zoomViewerItem.subtitle}
        />
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          CHEMISTRY KNOWLEDGE HUB
        </span>
        <h1 className="text-4xl font-black text-white mt-2 mb-3">
          Know Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Chemistry</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Explore laboratory apparatus, glassware, chemical reagents, NFPA 704 safety diamonds, and a searchable dictionary of chemistry terms.
        </p>

        {/* View Mode Switcher: Apparatus Catalog vs Periodic Table vs Glossary */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mt-6">
          <button
            type="button"
            onClick={() => { setActiveTab('catalog'); playSoftClick(); }}
            className={`flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Apparatus &amp; Chemicals ({KNOWLEDGE_ITEMS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('periodic-table'); playSoftClick(); }}
            className={`flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
              activeTab === 'periodic-table'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Periodic Table (118 Elements)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('bioscience'); playSoftClick(); }}
            className={`flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
              activeTab === 'bioscience'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-emerald-950 hover:border-emerald-700/60'
            }`}
          >
            <Dna className="w-4 h-4 text-emerald-400" />
            <span>Bioscience &amp; 3D Molecules</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50">
              AlphaFold &bull; PDB
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('glossary'); playSoftClick(); }}
            className={`flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
              activeTab === 'glossary'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-[#0f172a] text-slate-300 hover:text-white border border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Chemistry Glossary</span>
          </button>
        </div>
      </div>

      {activeTab === 'periodic-table' ? (
        <PeriodicTable onAskAI={onAskAI} />
      ) : activeTab === 'glossary' ? (
        <Glossary onAskAI={onAskAI} initialSearch={search} />
      ) : activeTab === 'bioscience' ? (
        <BioscienceView
          onAskAI={onAskAI}
          initialQuery={bioscienceInitialQuery}
          isStandaloneFullscreen={isBioscienceFullscreen}
          onToggleFullscreen={() => setIsBioscienceFullscreen((prev) => !prev)}
        />
      ) : (
        <>
          {/* Instant Search Bar with Highlight */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools, chemicals, formulas (e.g. Beaker, HCl, Burette, Sulfuric)..."
              className="w-full bg-[#0a1222]/90 border border-cyan-900/80 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 shadow-xl shadow-cyan-950/40 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips Bar (Item 5: apparatus, chemicals, indicators, hazards) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {filterChips.map((chip) => {
              const isSelected = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleFilterClick(chip.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.96] ${
                    isSelected
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(20,163,196,0.25)]'
                      : 'bg-[#09152b]/80 text-slate-300 hover:text-white hover:bg-[#0c1c38] border border-cyan-950'
                  }`}
                >
                  <span className="text-sm">{chip.icon}</span>
                  <span>{chip.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between pb-2 border-b border-cyan-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Catalog</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300 font-semibold">{filteredItems.length} items found</span>
            </div>
            {search && (
              <span className="text-xs text-cyan-400/80 font-mono">
                Matching: &ldquo;{search}&rdquo;
              </span>
            )}
          </div>

          {/* Grid of Apparatus and Chemical Items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-[#0e1524] rounded-2xl border border-cyan-950/80" role="status" aria-live="polite">
              <div className="mb-3">
                <DropperDrip size="lg" label="No items matched your search" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No items matched your search</h3>
              <p className="text-sm text-slate-400 mb-4">Try checking your spelling or selecting &ldquo;All Catalog&rdquo;.</p>
              <button
                onClick={() => { setSearch(''); setSelectedFilter('all'); }}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-cyan-950 border border-cyan-800 text-xs font-bold text-cyan-300 hover:bg-cyan-900"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map((item) => {
                const isChemical = item.isChemical || Boolean(item.formula);
                const hazard = isChemical ? getChemicalHazard(item.id, item.name, item.formula) : null;
                const webpUrl = item.image ? item.image.replace(/\.png$/, '.webp') : '';

                return (
                  <article
                    key={item.id}
                    className="relative rounded-2xl bg-[#071325]/85 border border-cyan-950/80 hover:border-cyan-500/40 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-200 flex flex-col justify-between overflow-hidden group content-visibility-auto"
                  >
                    <div>
                      {/* Visual Container: Chemical Banner with NFPA 704 OR Apparatus Image with Lightbox Zoom */}
                      {isChemical ? (
                        <div className="h-36 bg-gradient-to-br from-[#0c1a2f] via-[#091424] to-[#050b14] p-4 flex items-center justify-between border-b border-cyan-950/60 relative overflow-hidden">
                          {/* Formula and Name */}
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight block truncate">
                              <HighlightText text={item.formula || item.name} query={search} />
                            </span>
                            {item.formulaName && (
                              <span className="text-xs text-slate-400 font-medium block truncate mt-0.5">
                                <HighlightText text={item.formulaName} query={search} />
                              </span>
                            )}
                          </div>

                          {/* NFPA 704 Diamond Pictogram (Item 5) */}
                          {hazard && (
                            <div className="flex-shrink-0 scale-90 group-hover:scale-100 transition-transform">
                              <NFPA704Diamond rating={hazard.nfpa} size={50} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-40 bg-[#060c18] p-3 flex items-center justify-center border-b border-cyan-950/60 relative group/img">
                          {item.image ? (
                            <>
                              {/* Responsive Picture with WebP and Lazy Loading (Item 5) */}
                              <picture className="flex items-center justify-center w-full h-full">
                                <source srcSet={webpUrl} type="image/webp" />
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  width={280}
                                  height={220}
                                  loading="lazy"
                                  decoding="async"
                                  className="max-h-28 max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </picture>

                              {/* Lightbox Zoom Viewer Trigger Overlay (Item 5) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomViewerItem({
                                    url: item.image!,
                                    title: item.name,
                                    subtitle: item.tag,
                                  });
                                }}
                                title="Inspect image in high resolution"
                                aria-label={`Zoom view for ${item.name}`}
                                className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-[#07162e]/90 border border-cyan-500/40 text-cyan-300 flex items-center justify-center opacity-0 group-hover/img:opacity-100 hover:scale-110 transition-all shadow-md"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-4xl text-cyan-400">⚗</span>
                          )}
                        </div>
                      )}

                      {/* Card Content Body (Unboxed metadata per frontend constitution) */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-cyan-400">
                          <span>{item.tag}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 capitalize">{item.category}</span>
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                          <HighlightText text={item.name} query={search} />
                        </h3>

                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          <HighlightText text={item.description} query={search} />
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => setActiveModalItem(item)}
                        className="w-full text-center py-2 px-3 rounded-xl bg-[#091832] hover:bg-cyan-500/20 hover:text-cyan-200 border border-cyan-900/60 text-xs font-bold text-slate-300 transition"
                      >
                        Inspect item details →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal / Mobile Bottom Sheet with Full NFPA Diamond & Chemical Explanations */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeModalItem.name}
          onClick={() => setActiveModalItem(null)}
          className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 bg-black/80 backdrop-blur-md anim-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: sheetDragY > 0 ? `translate3d(0, ${sheetDragY}px, 0)` : undefined,
              transition: isSheetDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative w-full md:max-w-lg bg-[#091325] border-t md:border border-cyan-500/40 rounded-t-[28px] md:rounded-3xl overflow-hidden shadow-2xl anim-popup max-h-[92dvh] md:max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom,16px)] md:pb-0"
          >
            {/* Mobile Drag Handle Bar */}
            <div
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none md:hidden bg-[#060c18]"
              aria-label="Drag down to dismiss item details"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-500/80 active:bg-cyan-400 transition-colors" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-cyan-950 bg-[#060c18] flex-shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  {activeModalItem.tag} · {activeModalItem.category}
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
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Formula & NFPA Diamond or Image Preview */}
              {activeModalItem.formula ? (
                <div className="p-5 rounded-2xl bg-[#0c1a30] border border-cyan-900/60 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-cyan-400 font-mono uppercase block mb-1">
                      Chemical Formula
                    </span>
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      {activeModalItem.formula}
                    </span>
                    {activeModalItem.formulaName && (
                      <span className="block text-sm text-slate-300 mt-1 font-medium">
                        {activeModalItem.formulaName}
                      </span>
                    )}
                  </div>
                  <NFPA704Diamond
                    rating={getChemicalHazard(activeModalItem.id, activeModalItem.name, activeModalItem.formula).nfpa}
                    size={64}
                  />
                </div>
              ) : activeModalItem.image ? (
                <div className="relative h-48 bg-[#050b14] rounded-2xl border border-cyan-950 flex items-center justify-center p-4">
                  <picture>
                    <source srcSet={activeModalItem.image.replace(/\.png$/, '.webp')} type="image/webp" />
                    <img
                      src={activeModalItem.image}
                      alt={activeModalItem.name}
                      width={400}
                      height={300}
                      className="max-h-40 max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
                    />
                  </picture>
                  <button
                    onClick={() =>
                      setZoomViewerItem({
                        url: activeModalItem.image!,
                        title: activeModalItem.name,
                        subtitle: activeModalItem.tag,
                      })
                    }
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5 hover:bg-cyan-900 transition"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                </div>
              ) : null}

              {/* Hazard Warning if Chemical */}
              {(activeModalItem.isChemical || activeModalItem.formula) && (
                <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {getChemicalHazard(activeModalItem.id, activeModalItem.name, activeModalItem.formula).warning}
                  </p>
                </div>
              )}

              {/* Overview & Laboratory Info */}
              <div>
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                  Overview
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeModalItem.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                  Laboratory Usage &amp; Handling
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#06101d] p-3.5 rounded-xl border border-cyan-950">
                  {activeModalItem.info}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-cyan-950 bg-[#060c18] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                {onAskAI && (
                  <button
                    onClick={() => {
                      setActiveModalItem(null);
                      onAskAI(activeModalItem.name);
                    }}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                )}

                {(activeModalItem.isChemical || activeModalItem.formula) && (
                  <button
                    type="button"
                    onClick={() => {
                      const q = activeModalItem.formulaName || activeModalItem.name;
                      setActiveModalItem(null);
                      setBioscienceInitialQuery(q);
                      setActiveTab('bioscience');
                      playSoftClick();
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition font-bold"
                  >
                    <Dna className="w-3.5 h-3.5" />
                    <span>Open in 3D Bioscience</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="ml-auto px-4 py-1.5 rounded-xl bg-[#0e1d35] hover:bg-[#122442] text-xs font-bold text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
