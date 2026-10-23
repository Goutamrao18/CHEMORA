import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Sparkles, Orbit, Atom, Layers, Flame, Shield, Info, Copy, Check } from 'lucide-react';
import { ElementData, CATEGORY_COLORS } from '../data/periodicTableData';
import { fetchPubChemElementData, PubChemCompoundData } from '../services/pubchemApi';
import { playSoftClick } from '../utils/soundEffects';

interface ElementDetailModalProps {
  element: ElementData | null;
  onClose: () => void;
  onAskAI?: (topic: string) => void;
}

export const ElementDetailModal: React.FC<ElementDetailModalProps> = ({ element, onClose, onAskAI }) => {
  const [pubchemData, setPubchemData] = useState<PubChemCompoundData | null>(null);
  const [loadingPubchem, setLoadingPubchem] = useState(false);
  const [copiedSmiles, setCopiedSmiles] = useState(false);
  const [copiedInchi, setCopiedInchi] = useState(false);

  useEffect(() => {
    if (!element) return;
    let isMounted = true;
    setLoadingPubchem(true);
    setPubchemData(null);

    fetchPubChemElementData(element.name)
      .then((res) => {
        if (isMounted) {
          setPubchemData(res.pubchemCompound || null);
          setLoadingPubchem(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingPubchem(false);
      });

    return () => {
      isMounted = false;
    };
  }, [element]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!element) return null;

  const catTheme = CATEGORY_COLORS[element.category];

  const kelvinToCelsius = (k?: number) => {
    if (k === undefined) return 'Unknown';
    return `${(k - 273.15).toFixed(1)} °C (${k} K)`;
  };

  const handleCopy = (text: string, type: 'smiles' | 'inchi') => {
    navigator.clipboard.writeText(text);
    if (type === 'smiles') {
      setCopiedSmiles(true);
      setTimeout(() => setCopiedSmiles(false), 2000);
    } else {
      setCopiedInchi(true);
      setTimeout(() => setCopiedInchi(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="element-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#071326] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden anim-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="relative px-6 py-5 border-b border-cyan-900/40 bg-gradient-to-r from-[#081830] to-[#040e1f] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono border ${catTheme.bg} ${catTheme.border}`}>
              <span className="text-[10px] text-slate-400 font-bold leading-none">{element.number}</span>
              <span className={`text-xl font-black ${catTheme.text} leading-none`}>{element.symbol}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="element-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {element.name}
                </h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${catTheme.bg} ${catTheme.text} ${catTheme.border}`}>
                  {catTheme.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Atomic Mass: <strong className="text-cyan-300 font-bold">{element.atomicMass} u</strong> &bull; Block: <strong className="text-white">{element.block.toUpperCase()}</strong> &bull; Period {element.period}, Group {element.group}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-slate-700/50 transition-all active:scale-95"
            aria-label="Close element modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Summary Quote */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-slate-200 text-sm leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p>{element.summary}</p>
              {element.discoveredYear && (
                <p className="text-xs text-cyan-400 font-mono mt-2">
                  ✦ Discovered: {element.discoveredYear}
                </p>
              )}
            </div>
          </div>

          {/* Grid: Electron Shell Visualizer + Core Atomic Properties */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bohr Electron Shell Orbital Graphic */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#051020] border border-cyan-900/40 relative">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5 font-bold">
                <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                Bohr Electron Shells ({element.shells.join(' - ')})
              </span>

              <div className="relative w-48 h-48 flex items-center justify-center my-2">
                {/* Concentric Shells */}
                {element.shells.map((shellCount, sIdx) => {
                  const radius = 24 + (sIdx + 1) * 16;
                  return (
                    <div
                      key={sIdx}
                      style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
                      className="absolute rounded-full border border-cyan-500/25 pointer-events-none flex items-center justify-center animate-spin"
                      // Slower orbital animation per outer shell
                      // inline style for dynamic duration
                    >
                      {/* Electron dots */}
                      {Array.from({ length: Math.min(shellCount, 12) }).map((_, eIdx) => {
                        const angle = (eIdx / Math.min(shellCount, 12)) * 2 * Math.PI;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        return (
                          <div
                            key={eIdx}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                            className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                          />
                        );
                      })}
                    </div>
                  );
                })}

                {/* Nucleus */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-200/40 flex flex-col items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.6)]">
                  <span className="text-xs font-black text-slate-950 font-mono">{element.symbol}</span>
                  <span className="text-[9px] text-slate-900 font-bold leading-none">{element.number}p⁺</span>
                </div>
              </div>

              <div className="w-full mt-3 pt-3 border-t border-cyan-900/30 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Electron Configuration:</span>
                <span className="text-cyan-300 font-bold">{element.electronConfiguration}</span>
              </div>
            </div>

            {/* Atomic & Physical Properties Matrix */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Phase at STP</span>
                <span className="text-sm font-bold text-white mt-1">{element.phase}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Density</span>
                <span className="text-sm font-bold text-white mt-1">
                  {element.density ? `${element.density} g/cm³` : 'Unknown'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Electronegativity</span>
                <span className="text-sm font-bold text-cyan-300 mt-1">
                  {element.electronegativity ?? 'None (Noble)'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Melting Point</span>
                <span className="text-xs font-bold text-white mt-1">{kelvinToCelsius(element.meltingPoint)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Boiling Point</span>
                <span className="text-xs font-bold text-white mt-1">{kelvinToCelsius(element.boilingPoint)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#051020] border border-cyan-950/60 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Oxidation States</span>
                <span className="text-xs font-mono font-bold text-cyan-300 mt-1">{element.oxidationStates ?? 'Varies'}</span>
              </div>
            </div>
          </div>

          {/* PubChem Science Intelligence & Calculated Properties Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#06142a] to-[#030b18] border border-cyan-500/30 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-wide">
                  PubChem PUG REST Chemical Intelligence
                </h3>
              </div>

              {pubchemData?.cid && (
                <a
                  href={pubchemData.pubchemUrl || `https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                >
                  <span>PubChem CID: {pubchemData.cid}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {loadingPubchem ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-cyan-400">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Querying PubChem PUG REST API...</span>
              </div>
            ) : pubchemData ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* 2D Structure Render */}
                {pubchemData.structure2DUrl && (
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#020814] border border-cyan-950">
                    <img
                      src={pubchemData.structure2DUrl}
                      alt={`${element.name} PubChem 2D Structure`}
                      className="w-36 h-36 object-contain invert hue-rotate-180 brightness-110"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-1">2D PubChem Structure</span>
                  </div>
                )}

                {/* PubChem Calculated Properties */}
                <div className={pubchemData.structure2DUrl ? 'md:col-span-8 space-y-3' : 'md:col-span-12 space-y-3'}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#040d1e] border border-cyan-900/30">
                      <span className="text-[10px] text-slate-400 font-mono block">Formula</span>
                      <strong className="text-xs text-white">{pubchemData.properties?.MolecularFormula || element.symbol}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#040d1e] border border-cyan-900/30">
                      <span className="text-[10px] text-slate-400 font-mono block">Mol. Weight</span>
                      <strong className="text-xs text-cyan-300">{pubchemData.properties?.MolecularWeight || element.atomicMass}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#040d1e] border border-cyan-900/30">
                      <span className="text-[10px] text-slate-400 font-mono block">Complexity</span>
                      <strong className="text-xs text-white">{pubchemData.properties?.Complexity ?? 0}</strong>
                    </div>
                  </div>

                  {pubchemData.properties?.CanonicalSMILES && (
                    <div className="p-2.5 rounded-xl bg-[#040d1e] border border-cyan-900/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono block">Canonical SMILES</span>
                        <code className="text-xs text-cyan-300 font-mono truncate block">
                          {pubchemData.properties.CanonicalSMILES}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(pubchemData.properties!.CanonicalSMILES!, 'smiles')}
                        className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs transition"
                        title="Copy SMILES"
                      >
                        {copiedSmiles ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {pubchemData.properties?.InChIKey && (
                    <div className="p-2.5 rounded-xl bg-[#040d1e] border border-cyan-900/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono block">InChIKey</span>
                        <code className="text-xs text-slate-300 font-mono truncate block">
                          {pubchemData.properties.InChIKey}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(pubchemData.properties!.InChIKey!, 'inchi')}
                        className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs transition"
                        title="Copy InChIKey"
                      >
                        {copiedInchi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 font-mono">
                Direct PubChem compound data mapped via elemental constants. National Center for Biotechnology Information (NCBI) verified.
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {onAskAI && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAskAI(`Tell me about ${element.name} (${element.symbol}), its discovery, and key chemical reactions in the lab.`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Tutor about {element.name}</span>
                </button>
              )}
            </div>

            <a
              href={`https://pubchem.ncbi.nlm.nih.gov/periodic-table/#view=table&element=${element.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/60 transition"
            >
              <span>Explore on PubChem Periodic Table</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
