import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Atom, Sparkles, Orbit, Layers, ChevronRight } from 'lucide-react';
import { PERIODIC_ELEMENTS, ElementData, CATEGORY_COLORS } from '../data/periodicTableData';
import { ElementDetailModal } from './ElementDetailModal';
import { playSoftClick } from '../utils/soundEffects';

interface PeriodicTableProps {
  onAskAI?: (topic: string) => void;
}

export const PeriodicTable: React.FC<PeriodicTableProps> = ({ onAskAI }) => {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ElementData['category'] | 'all'>('all');
  const [selectedPhase, setSelectedPhase] = useState<'all' | 'Solid' | 'Liquid' | 'Gas'>('all');

  // Filtered elements for search highlighting
  const matchingNumbers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const set = new Set<number>();
    PERIODIC_ELEMENTS.forEach((el) => {
      const matchSearch =
        !q ||
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase().includes(q) ||
        String(el.number) === q;

      const matchCat = selectedCategory === 'all' || el.category === selectedCategory;
      const matchPhase = selectedPhase === 'all' || el.phase.includes(selectedPhase);

      if (matchSearch && matchCat && matchPhase) {
        set.add(el.number);
      }
    });
    return set;
  }, [search, selectedCategory, selectedPhase]);

  const handleElementClick = (element: ElementData) => {
    playSoftClick();
    setSelectedElement(element);
  };

  // Group elements into grid slots
  // Main table: Period 1..7, Group 1..18
  // Lanthanoids: 57-71 (slot at period 6, group 3)
  // Actinoids: 89-103 (slot at period 7, group 3)
  const getGridPosition = (el: ElementData): { gridRow: number; gridColumn: number } => {
    if (el.number >= 57 && el.number <= 71) {
      // Lanthanide series row (row 9, column 4..18)
      return { gridRow: 9, gridColumn: el.number - 57 + 4 };
    }
    if (el.number >= 89 && el.number <= 103) {
      // Actinide series row (row 10, column 4..18)
      return { gridRow: 10, gridColumn: el.number - 89 + 4 };
    }
    return { gridRow: el.period, gridColumn: el.group };
  };

  const categories = Object.keys(CATEGORY_COLORS) as Array<ElementData['category']>;

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      {selectedElement && (
        <ElementDetailModal
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
          onAskAI={onAskAI}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#061224] border border-cyan-500/20 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search element by name, symbol, or number (e.g. Iron, Fe, 26)..."
            className="w-full bg-[#030914] border border-cyan-900/60 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#030914] border border-cyan-950/60">
          {(['all', 'Solid', 'Liquid', 'Gas'] as const).map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => {
                setSelectedPhase(phase);
                playSoftClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPhase === phase
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {phase === 'all' ? 'All Phases' : phase}
            </button>
          ))}
        </div>
      </div>

      {/* Category Legend Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            playSoftClick();
          }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
              : 'bg-[#061224] border-cyan-950 text-slate-400 hover:text-white'
          }`}
        >
          All Categories (118)
        </button>

        {categories.map((catKey) => {
          const cfg = CATEGORY_COLORS[catKey];
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => {
                setSelectedCategory(isSelected ? 'all' : catKey);
                playSoftClick();
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${cfg.bg} ${cfg.text} ${
                isSelected ? `border-white ring-2 ring-cyan-400/50 scale-105` : `${cfg.border} opacity-85 hover:opacity-100`
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Periodic Table 18-Column Interactive Grid */}
      <div className="relative rounded-3xl bg-[#040c1a] border border-cyan-500/25 p-4 sm:p-6 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
            <Atom className="w-4 h-4 text-cyan-400" />
            IUPAC Standard 18-Column Periodic Grid (Click any element for PubChem properties)
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Showing {matchingNumbers.size} of 118 elements
          </span>
        </div>

        {/* Scrollable Container with horizontal indicator */}
        <div className="overflow-x-auto pb-4 no-scrollbar">
          <div
            className="grid gap-1.5 min-w-[940px] select-none"
            style={{
              gridTemplateColumns: 'repeat(18, minmax(48px, 1fr))',
              gridTemplateRows: 'repeat(10, minmax(54px, auto))',
            }}
          >
            {/* Header Column Numbers (1-18) */}
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={`group-${i + 1}`}
                style={{ gridRow: 1, gridColumn: i + 1 }}
                className="text-center text-[10px] font-mono text-slate-500 font-bold py-1 pointer-events-none"
              >
                {i + 1}
              </div>
            ))}

            {/* Lanthanide / Actinide place-holder tiles in the main table */}
            <div
              style={{ gridRow: 6, gridColumn: 3 }}
              className="rounded-xl border border-dashed border-indigo-500/40 bg-indigo-950/20 flex flex-col items-center justify-center p-1 text-center"
            >
              <span className="text-[9px] font-mono text-indigo-300 font-bold leading-none">57-71</span>
              <span className="text-[10px] font-bold text-indigo-200 mt-0.5">La-Lu</span>
            </div>

            <div
              style={{ gridRow: 7, gridColumn: 3 }}
              className="rounded-xl border border-dashed border-fuchsia-500/40 bg-fuchsia-950/20 flex flex-col items-center justify-center p-1 text-center"
            >
              <span className="text-[9px] font-mono text-fuchsia-300 font-bold leading-none">89-103</span>
              <span className="text-[10px] font-bold text-fuchsia-200 mt-0.5">Ac-Lr</span>
            </div>

            {/* Spacer row between Main Grid and Lanthanoid / Actinoid Subgrid */}
            <div
              style={{ gridRow: 8, gridColumn: '1 / span 18' }}
              className="h-4 flex items-center justify-center"
            >
              <div className="w-full h-px bg-cyan-950/40" />
            </div>

            {/* Label for Lanthanides */}
            <div
              style={{ gridRow: 9, gridColumn: '1 / span 3' }}
              className="flex items-center justify-end pr-3 text-[11px] font-bold text-indigo-400 font-mono tracking-wider"
            >
              Lanthanoids ➔
            </div>

            {/* Label for Actinides */}
            <div
              style={{ gridRow: 10, gridColumn: '1 / span 3' }}
              className="flex items-center justify-end pr-3 text-[11px] font-bold text-fuchsia-400 font-mono tracking-wider"
            >
              Actinoids ➔
            </div>

            {/* Elements */}
            {PERIODIC_ELEMENTS.map((el) => {
              const pos = getGridPosition(el);
              // Shift rows down by 1 because Row 1 is group numbers (1..18)
              const actualRow = pos.gridRow >= 8 ? pos.gridRow + 1 : pos.gridRow + 1;
              const isMatch = matchingNumbers.has(el.number);
              const catConfig = CATEGORY_COLORS[el.category];

              return (
                <button
                  key={el.number}
                  type="button"
                  onClick={() => handleElementClick(el)}
                  style={{
                    gridRow: actualRow,
                    gridColumn: pos.gridColumn,
                  }}
                  className={`relative flex flex-col items-center justify-between p-1 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    catConfig.bg
                  } ${
                    isMatch
                      ? `${catConfig.border} hover:scale-110 hover:z-20 hover:border-cyan-300 hover:shadow-[0_0_16px_rgba(56,189,248,0.4)]`
                      : 'opacity-20 border-transparent saturate-50'
                  }`}
                  title={`${el.name} (${el.symbol}) - Atomic #${el.number}, Mass ${el.atomicMass}`}
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span className="text-[9px] font-mono font-bold text-slate-400 leading-none">
                      {el.number}
                    </span>
                    <span className="text-[7.5px] font-mono text-slate-500 leading-none truncate max-w-[28px]">
                      {el.atomicMass.split('.')[0]}
                    </span>
                  </div>

                  <span className={`text-base sm:text-lg font-black font-mono leading-none tracking-tight ${catConfig.text}`}>
                    {el.symbol}
                  </span>

                  <span className="text-[8px] font-bold text-slate-300 truncate w-full text-center leading-none">
                    {el.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom helper footnote */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-cyan-950/60 font-mono">
          <span>Click any element tile to open atomic radii, electron configurations, and PubChem live data.</span>
          <span className="text-cyan-400 font-bold mt-1 sm:mt-0">PubChem PUG REST Integrated</span>
        </div>
      </div>
    </div>
  );
};
