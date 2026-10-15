import React, { useState } from 'react';
import { Flame, Droplet, Beaker, RotateCcw, Sparkles, Thermometer, Info, ShieldAlert, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Reagent {
  id: string;
  name: string;
  formula: string;
  color: string;
  type: 'acid' | 'base' | 'salt' | 'indicator' | 'oxidizer' | 'solvent';
  ph: number;
}

const REAGENTS: Reagent[] = [
  { id: 'hcl', name: 'Hydrochloric Acid (1M)', formula: 'HCl', color: '#f8fafc', type: 'acid', ph: 1 },
  { id: 'naoh', name: 'Sodium Hydroxide (1M)', formula: 'NaOH', color: '#f8fafc', type: 'base', ph: 14 },
  { id: 'cuso4', name: 'Copper(II) Sulfate', formula: 'CuSO₄', color: '#38bdf8', type: 'salt', ph: 5 },
  { id: 'ki', name: 'Potassium Iodide', formula: 'KI', color: '#f8fafc', type: 'salt', ph: 7 },
  { id: 'pbno3', name: 'Lead(II) Nitrate', formula: 'Pb(NO₃)₂', color: '#f8fafc', type: 'salt', ph: 5 },
  { id: 'h2o2', name: 'Hydrogen Peroxide (3%)', formula: 'H₂O₂', color: '#f8fafc', type: 'oxidizer', ph: 6 },
  { id: 'phenolphthalein', name: 'Phenolphthalein Indicator', formula: 'C₂₀H₁₄O₄', color: '#fdf2f8', type: 'indicator', ph: 7 },
  { id: 'universal', name: 'Universal Indicator', formula: 'UI', color: '#22c55e', type: 'indicator', ph: 7 },
  { id: 'water', name: 'Distilled Water', formula: 'H₂O', color: '#f0f9ff', type: 'solvent', ph: 7 },
];

const FLAME_TEST_ELEMENTS = [
  { name: 'Sodium (Na⁺)', color: '#fbbf24', flameName: 'Intense Yellow-Orange', wavelength: '589 nm' },
  { name: 'Copper (Cu²⁺)', color: '#06b6d4', flameName: 'Brilliant Blue-Green', wavelength: '510 nm' },
  { name: 'Potassium (K⁺)', color: '#c084fc', flameName: 'Pale Lilac-Violet', wavelength: '766 nm' },
  { name: 'Calcium (Ca²⁺)', color: '#f97316', flameName: 'Brick Red-Orange', wavelength: '622 nm' },
  { name: 'Barium (Ba²⁺)', color: '#84cc16', flameName: 'Apple Green', wavelength: '524 nm' },
];

export const VirtualLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bench' | 'flame' | 'ph'>('bench');
  
  // Workbench state
  const [vesselVolume, setVesselVolume] = useState<number>(0);
  const [addedReagents, setAddedReagents] = useState<string[]>([]);
  const [isHeating, setIsHeating] = useState(false);
  const [temperature, setTemperature] = useState(22); // Celsius
  const [reactionLog, setReactionLog] = useState<string[]>([
    "Laboratory bench initialized. Clean Erlenmeyer flask on stand."
  ]);
  
  // Flame test state
  const [selectedFlameElement, setSelectedFlameElement] = useState(FLAME_TEST_ELEMENTS[0]);
  const [burnerActive, setBurnerActive] = useState(true);

  // Compute visual state of bench vessel
  const hasHCl = addedReagents.includes('hcl');
  const hasNaOH = addedReagents.includes('naoh');
  const hasPhenol = addedReagents.includes('phenolphthalein');
  const hasCuSO4 = addedReagents.includes('cuso4');
  const hasKI = addedReagents.includes('ki');
  const hasPb = addedReagents.includes('pbno3');
  const hasH2O2 = addedReagents.includes('h2o2');

  let liquidColor = '#38bdf820';
  let precipitate = null;
  let effervescence = false;
  let reactionNote = '';

  if (hasKI && hasPb) {
    precipitate = 'Bright Golden-Yellow PbI₂ Precipitate';
    liquidColor = '#facc15';
    reactionNote = 'Pb(NO₃)₂ + 2KI → PbI₂(s)↓ + 2KNO₃ (Golden Rain)';
  } else if (hasHCl && hasNaOH && hasPhenol) {
    liquidColor = '#f472b620';
    reactionNote = 'HCl + NaOH → NaCl + H₂O (Neutralised, pink indicator cleared)';
  } else if (hasNaOH && hasPhenol && !hasHCl) {
    liquidColor = '#ec4899';
    reactionNote = 'Phenolphthalein in alkaline pH 14 turns intense magenta pink!';
  } else if (hasCuSO4 && hasNaOH) {
    precipitate = 'Pale Blue Cu(OH)₂ Gelatinous Precipitate';
    liquidColor = '#0284c7';
    reactionNote = 'CuSO₄ + 2NaOH → Cu(OH)₂(s)↓ + Na₂SO₄';
  } else if (hasCuSO4) {
    liquidColor = '#38bdf8';
  } else if (hasH2O2 && isHeating) {
    effervescence = true;
    reactionNote = '2H₂O₂ → 2H₂O + O₂(g)↑ (Thermal decomposition yielding oxygen gas)';
  }

  const handleAddReagent = (reagent: Reagent) => {
    if (vesselVolume >= 100) return;

    setAddedReagents((prev) => [...prev, reagent.id]);
    setVesselVolume((v) => Math.min(100, v + 20));

    // Dynamic log update
    const note = `Added 20 mL of ${reagent.name} (${reagent.formula}).`;
    setReactionLog((prev) => [note, ...prev.slice(0, 7)]);

    // Check reaction combinations
    if (reagent.id === 'ki' && addedReagents.includes('pbno3')) {
      try { confetti({ particleCount: 30, spread: 50 }); } catch {}
    }
  };

  const toggleBurner = () => {
    setIsHeating((h) => {
      const next = !h;
      if (next) {
        setTemperature((t) => Math.min(100, t + 45));
        setReactionLog((prev) => ["Bunsen burner ignited. Heating mixture to 67°C.", ...prev.slice(0, 7)]);
      } else {
        setTemperature(22);
        setReactionLog((prev) => ["Bunsen burner extinguished. Cooling down to room temp.", ...prev.slice(0, 7)]);
      }
      return next;
    });
  };

  const handleResetBench = () => {
    setVesselVolume(0);
    setAddedReagents([]);
    setIsHeating(false);
    setTemperature(22);
    setReactionLog(["Flask rinsed and placed back onto workbench."]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          VIRTUAL SIMULATION ENVIRONMENT
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 mb-3">
          Virtual <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Chemistry Lab</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Interact with reagents, glassware, flame emission spectroscopy, and real-time chemical reactions directly on your screen.
        </p>

        {/* Tab Selection */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('bench')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'bench'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-[#121c2e] text-slate-300 hover:text-white border border-cyan-950'
            }`}
          >
            ⚗ Reaction Workbench
          </button>
          <button
            onClick={() => setActiveTab('flame')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'flame'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-[#121c2e] text-slate-300 hover:text-white border border-cyan-950'
            }`}
          >
            🔥 Flame Spectroscopy
          </button>
        </div>
      </div>

      {activeTab === 'bench' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Reagent Dispensing Rack (Left) */}
          <div className="lg:col-span-4 bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6">
            <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Droplet className="w-4 h-4" />
              Reagent Shelf ({REAGENTS.length})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tap any reagent bottle below to dispense 20 mL into the Erlenmeyer flask.
            </p>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {REAGENTS.map((reagent) => (
                <button
                  key={reagent.id}
                  onClick={() => handleAddReagent(reagent)}
                  className="w-full text-left p-3 rounded-xl bg-[#0a0f19] hover:bg-[#121b2d] border border-cyan-950/70 hover:border-cyan-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border"
                      style={{
                        backgroundColor: `${reagent.color}15`,
                        borderColor: reagent.color,
                        color: reagent.color === '#f8fafc' ? '#38bdf8' : reagent.color,
                      }}
                    >
                      {reagent.formula.slice(0, 2)}
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {reagent.name}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-400">
                        {reagent.formula} · pH {reagent.ph}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                    + Add
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Workbench Stage (Center) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[#0b101c] border border-cyan-950 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden shadow-2xl">
              {/* Top Workbench HUD */}
              <div className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-[#121c2e] px-3.5 py-1.5 rounded-xl border border-cyan-900/60 text-xs">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  <span className="font-mono text-white font-bold">{temperature}°C</span>
                  <span className="text-slate-400">({isHeating ? 'Heating' : 'Ambient'})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBurner}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      isHeating
                        ? 'bg-rose-500 text-slate-950 animate-pulse'
                        : 'bg-[#121c2e] border border-cyan-900/60 text-rose-300 hover:bg-rose-950/40'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    {isHeating ? 'Extinguish Burner' : 'Light Bunsen Burner'}
                  </button>

                  <button
                    onClick={handleResetBench}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#121c2e] border border-cyan-900/60 text-slate-300 hover:text-white text-xs font-bold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Rinse Flask
                  </button>
                </div>
              </div>

              {/* Flask Visual Representation */}
              <div className="relative my-8 flex flex-col items-center">
                {/* Flask Glass Outline */}
                <div className="relative w-44 h-56 flex flex-col items-center justify-end">
                  {/* Flask Neck */}
                  <div className="w-12 h-14 border-x-2 border-t-2 border-cyan-400/40 bg-white/5 rounded-t-sm relative">
                    {/* Effervescence Bubbles */}
                    {effervescence && (
                      <div className="absolute inset-0 flex justify-around">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping"></span>
                        <span className="w-1 h-1 rounded-full bg-white/80 animate-ping [animation-delay:0.3s]"></span>
                      </div>
                    )}
                  </div>

                  {/* Flask Conical Body */}
                  <div
                    className="w-44 h-42 border-2 border-t-0 border-cyan-400/50 rounded-b-3xl relative overflow-hidden flex items-end justify-center shadow-inner"
                    style={{
                      clipPath: 'polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    {/* Liquid fill */}
                    <div
                      className="w-full transition-all duration-500 flex flex-col items-center justify-end"
                      style={{
                        height: `${Math.min(100, (vesselVolume / 100) * 85)}%`,
                        backgroundColor: liquidColor,
                      }}
                    >
                      {/* Precipitate layer at bottom */}
                      {precipitate && (
                        <div className="w-full h-4 bg-amber-400/90 shadow-lg border-t border-amber-300"></div>
                      )}
                    </div>
                  </div>

                  {/* Volume graduations */}
                  <div className="absolute right-2 bottom-6 text-[10px] font-mono text-cyan-400/60 flex flex-col gap-3 pointer-events-none">
                    <span>- 100 mL</span>
                    <span>- 50 mL</span>
                    <span>- 20 mL</span>
                  </div>
                </div>

                {/* Flame beneath flask */}
                {isHeating && (
                  <div className="mt-1 flex items-center justify-center">
                    <div className="w-8 h-10 bg-gradient-to-t from-blue-600 via-cyan-400 to-amber-300 rounded-full blur-[2px] animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Reaction Note Banner */}
              {reactionNote && (
                <div className="w-full bg-[#131d2e] border border-cyan-500/40 rounded-2xl p-4 text-center z-10 animate-in fade-in">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    Reaction Observed
                  </span>
                  <strong className="text-sm font-mono text-white block mb-1">{reactionNote}</strong>
                  {precipitate && (
                    <span className="text-xs text-amber-300 font-semibold block">{precipitate}</span>
                  )}
                </div>
              )}

              {/* Live Laboratory Log */}
              <div className="w-full bg-[#0a0e17] border border-cyan-950/80 rounded-2xl p-4 mt-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Workbench Observation Log
                </span>
                <div className="space-y-1 font-mono text-xs text-slate-300 max-h-24 overflow-y-auto">
                  {reactionLog.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-cyan-500">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flame Spectroscopy Tab */}
      {activeTab === 'flame' && (
        <div className="max-w-4xl mx-auto bg-[#0b101c] border border-cyan-950 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Atomic Flame Emission Tests</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When metal salts are introduced to a non-luminous Bunsen flame, thermal energy excites electrons to higher quantum states. When relaxing back down, light of distinct emission wavelengths is observed.
            </p>
          </div>

          {/* Flame Visualizer Stage */}
          <div className="h-72 bg-[#05080f] rounded-3xl border border-cyan-950 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-inner">
            {/* The Flame */}
            <div
              className="w-16 h-36 rounded-full blur-[3px] transition-all duration-300 transform -translate-y-2 animate-pulse"
              style={{
                backgroundColor: selectedFlameElement.color,
                boxShadow: `0 0 60px ${selectedFlameElement.color}aa, 0 0 100px ${selectedFlameElement.color}44`,
              }}
            />
            {/* Burner Base */}
            <div className="w-10 h-10 bg-slate-700 border border-slate-600 rounded-t-md mt-1"></div>

            {/* Readout overlay */}
            <div className="absolute bottom-4 left-6 bg-[#0d1624]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-950 text-xs font-mono">
              <span className="text-slate-400 block">Observed Color</span>
              <strong className="text-white text-sm">{selectedFlameElement.flameName}</strong>
            </div>
            <div className="absolute bottom-4 right-6 bg-[#0d1624]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-950 text-xs font-mono text-right">
              <span className="text-slate-400 block">Peak Emission</span>
              <strong className="text-cyan-400 text-sm">{selectedFlameElement.wavelength}</strong>
            </div>
          </div>

          {/* Element Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FLAME_TEST_ELEMENTS.map((elem) => (
              <button
                key={elem.name}
                onClick={() => setSelectedFlameElement(elem)}
                className={`p-3.5 rounded-2xl border text-center transition ${
                  selectedFlameElement.name === elem.name
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-[#0e1626] border-cyan-950 text-slate-300 hover:border-cyan-800'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-2 border border-white/40"
                  style={{ backgroundColor: elem.color }}
                />
                <strong className="block text-xs font-bold">{elem.name}</strong>
                <span className="text-[10px] text-slate-400 block">{elem.flameName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
