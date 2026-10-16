import { Beaker, FlaskConical, Plus, Search, Sparkles, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { REAGENTS_CATALOG } from '../../gameplay/chemistry';
import { useGameStore, type VesselState } from '../../gameplay/gameState';

const vesselOptions: { type: VesselState['type']; name: string; capacity: string; description: string }[] = [
  { type: 'beaker_100', name: 'Small Beaker', capacity: '100 mL', description: 'Small-volume mixing and color tests' },
  { type: 'beaker_250', name: 'Reaction Beaker', capacity: '250 mL', description: 'General mixing and reaction vessel' },
  { type: 'flask_250', name: 'Erlenmeyer Flask', capacity: '250 mL', description: 'Swirling and titration practice' },
  { type: 'cylinder_50', name: 'Graduated Cylinder', capacity: '50 mL', description: 'Volume measurement practice' },
  { type: 'vial_30', name: 'Sample Vial', capacity: '30 mL', description: 'Small samples for analysis' },
];

export const ChemicalLabLibrary: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chemicals' | 'glassware'>('chemicals');
  const [query, setQuery] = useState('');
  const [targetId, setTargetId] = useState('beaker_main');
  const vessels = useGameStore((s) => s.vessels);
  const dispense = useGameStore((s) => s.dispenseReagentIntoVessel);
  const addVessel = useGameStore((s) => s.addLabVessel);
  const reagents = useMemo(() => Object.values(REAGENTS_CATALOG).filter((r) => `${r.name} ${r.formula} ${r.description}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <>
    <button onClick={() => setOpen(true)} className="pointer-events-auto fixed bottom-4 left-4 z-40 flex items-center gap-2 border border-cyan-400/50 bg-slate-950/90 px-4 py-3 text-xs font-bold tracking-widest text-cyan-200 shadow-xl backdrop-blur hover:bg-slate-900">
      <FlaskConical className="h-4 w-4" /> LAB LIBRARY <span className="rounded bg-cyan-500/20 px-1.5 py-0.5">{Object.keys(REAGENTS_CATALOG).length} CHEMICALS</span>
    </button>
    {open && <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm md:p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border border-cyan-400/30 bg-[#0b111a] text-slate-100 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 p-4">
          <div><div className="text-lg font-black tracking-[0.18em]">CHEMORA INVENTORY</div><div className="mt-1 text-xs text-slate-400">Virtual laboratory stock • educational simulation only</div></div>
          <button onClick={() => setOpen(false)} className="rounded border border-slate-700 p-2 hover:bg-slate-800" aria-label="Close library"><X className="h-5 w-5" /></button>
        </header>
        <nav className="flex gap-2 border-b border-slate-800 p-3">
          <button onClick={() => setTab('chemicals')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold ${tab === 'chemicals' ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'text-slate-400 hover:bg-slate-800'}`}><FlaskConical className="h-4 w-4"/> CHEMICAL LIBRARY</button>
          <button onClick={() => setTab('glassware')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold ${tab === 'glassware' ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'text-slate-400 hover:bg-slate-800'}`}><Beaker className="h-4 w-4"/> BEAKER & GLASSWARE LIBRARY</button>
        </nav>
        {tab === 'chemicals' ? <>
          <div className="grid gap-3 border-b border-slate-800 p-3 md:grid-cols-[1fr_240px]">
            <label className="flex items-center gap-2 border border-slate-700 bg-slate-950 px-3"><Search className="h-4 w-4 text-slate-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by chemical, formula, or use…" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-600"/></label>
            <label className="flex items-center gap-2 text-xs text-slate-400">DISPENSE INTO<select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="min-w-0 flex-1 border border-slate-700 bg-slate-950 p-2 text-slate-100">{Object.values(vessels).map((v) => <option key={v.id} value={v.id}>{v.name} ({v.content.volumeMl.toFixed(1)} mL)</option>)}</select></label>
          </div>
          <div className="grid flex-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3">
            {reagents.map((r) => <article key={r.id} className="flex min-h-[160px] flex-col border border-slate-800 bg-slate-900/70 p-3 transition hover:border-cyan-500/50">
              <div className="flex items-start gap-3"><div className="mt-1 h-10 w-3 shrink-0 rounded-full border border-white/20" style={{ background: r.color, boxShadow: `0 0 18px ${r.color}55` }}/><div className="min-w-0 flex-1"><h3 className="font-bold leading-tight">{r.name}</h3><div className="mt-1 text-sm text-cyan-200">{r.formula}</div></div><span className={`shrink-0 border px-1.5 py-0.5 text-[9px] uppercase ${r.hazard === 'none' ? 'border-emerald-700 text-emerald-300' : r.hazard === 'corrosive' ? 'border-rose-700 text-rose-300' : r.hazard === 'flammable' ? 'border-amber-700 text-amber-300' : 'border-orange-800 text-orange-300'}`}>{r.hazard}</span></div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{r.description}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2"><span className="text-[10px] text-slate-500">{r.state.toUpperCase()} · pH {r.ph}</span><button onClick={() => { const amount = r.state === 'solid' ? 2 : 5; dispense(targetId, r.id, amount); }} className="flex items-center gap-1 border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/20"><Plus className="h-3 w-3"/> ADD {r.state === 'solid' ? '2 g' : '5 mL'}</button></div>
            </article>)}
            {reagents.length === 0 && <div className="col-span-full py-12 text-center text-sm text-slate-500">No chemicals match that search.</div>}
          </div>
        </> : <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3">{vesselOptions.map((v) => <article key={v.type} className="border border-slate-800 bg-slate-900/70 p-4"><div className="mb-3 flex h-28 items-center justify-center bg-gradient-to-b from-cyan-950/40 to-slate-950"><div className="relative flex h-20 w-16 flex-col items-center"><div className="h-2 w-14 rounded-t border border-slate-300/70 bg-slate-300/10"/><div className="relative h-16 w-14 rounded-b-lg border-x-2 border-b-2 border-slate-300/60 bg-slate-300/5"><div className="absolute inset-x-1 bottom-1 h-7 rounded-b bg-cyan-400/30"/><div className="absolute inset-x-0 top-3 border-t border-slate-300/40"/></div></div></div><h3 className="font-bold">{v.name}</h3><div className="mt-1 text-sm text-cyan-200">Capacity: {v.capacity}</div><p className="mt-2 text-xs text-slate-400">{v.description}</p><button onClick={() => addVessel(v.type)} className="mt-4 flex w-full items-center justify-center gap-2 border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"><Plus className="h-4 w-4"/> ADD TO LAB</button></article>)}
          <div className="sm:col-span-2 lg:col-span-3 border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400"><Sparkles className="mr-2 inline h-4 w-4 text-cyan-300"/>Added vessels enter your inventory and become the held vessel. Existing vessels remain available.</div>
        </div>}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/80 px-4 py-3 text-[10px] text-slate-500"><span>{tab === 'chemicals' ? `${reagents.length} matching entries · ${Object.keys(REAGENTS_CATALOG).length} catalog entries total` : `${Object.keys(vessels).length} vessels currently in inventory`}</span><span>Virtual quantities are illustrative, not laboratory instructions.</span></footer>
      </div>
    </div>}
  </>;
};
