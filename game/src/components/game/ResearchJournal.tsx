import React from 'react';
import { BookOpen, CheckCircle2, FlaskConical, LockKeyhole, X } from 'lucide-react';
import { useGameStore } from '../../gameplay/gameState';
import { PROTOCOLS_LIST, REAGENTS_CATALOG } from '../../gameplay/chemistry';

/** Research notebook overlay. Reads authoritative progression and analysis data from the game store. */
export const ResearchJournal: React.FC = () => {
  const isOpen = useGameStore((s) => s.isJournalOpen);
  const setOpen = useGameStore((s) => s.setJournalOpen);
  const unlockedTier = useGameStore((s) => s.unlockedTier);
  const completedProtocolIds = useGameStore((s) => s.completedProtocolIds);
  const activeProtocolIndex = useGameStore((s) => s.activeProtocolIndex);
  const reports = useGameStore((s) => s.analysisReports);
  const vessels = useGameStore((s) => s.vessels);

  if (!isOpen) return null;
  const activeProtocol = PROTOCOLS_LIST[activeProtocolIndex] ?? PROTOCOLS_LIST[0];
  const formatRequirements = (requirements: Record<string, { min: number; max: number; unit: 'mL' | 'g' }>) =>
    Object.entries(requirements).map(([id, range]) => {
      const reagent = REAGENTS_CATALOG[id];
      return `${reagent?.name ?? id}: ${range.min}–${range.max} ${range.unit}`;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="research-journal-title">
      <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border border-slate-700 bg-[#101820] text-slate-100 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700 bg-[#151f29] px-5 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-sky-400" />
            <div>
              <h2 id="research-journal-title" className="text-lg font-black tracking-widest">RESEARCH JOURNAL</h2>
              <p className="text-xs text-slate-400">CHEMORA · LAB TIER {unlockedTier} · {completedProtocolIds.length}/{PROTOCOLS_LIST.length} protocols verified</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded border border-slate-600 p-2 text-slate-300 transition hover:border-sky-400 hover:text-white" aria-label="Close research journal"><X className="h-4 w-4" /></button>
        </header>
        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-4 border-b border-slate-700 p-5 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-sky-300"><FlaskConical className="h-4 w-4" /> ACTIVE RESEARCH PROTOCOL</div>
            {activeProtocol ? <article className="border border-slate-700 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-start justify-between gap-3"><h3 className="font-bold">{activeProtocol.title}</h3><span className="shrink-0 border border-sky-800 bg-sky-950 px-2 py-1 text-[10px] text-sky-300">TIER {activeProtocol.tier}</span></div>
              <p className="text-sm leading-6 text-slate-300">{activeProtocol.description}</p>
              <h4 className="mt-4 text-xs font-bold tracking-wider text-slate-400">REQUIRED REAGENT RANGES</h4>
              <ul className="mt-2 space-y-2">{formatRequirements(activeProtocol.requiredReagents).map((item) => <li key={item} className="border-l-2 border-sky-500 pl-3 text-sm text-slate-200">{item}</li>)}</ul>
              <p className="mt-4 text-xs leading-5 text-slate-400">Complete the procedure at the appropriate stations, then analyze the sample to verify the result.</p>
            </article> : <p className="text-sm text-slate-400">No protocols are configured yet.</p>}
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400">PROTOCOL PROGRESSION</h3>
              <div className="space-y-2">{PROTOCOLS_LIST.map((protocol, index) => {
                const completed = completedProtocolIds.includes(protocol.id);
                const unlocked = protocol.tier <= unlockedTier;
                return <div key={protocol.id} className={`flex items-center gap-3 border p-3 ${completed ? 'border-emerald-900 bg-emerald-950/30' : unlocked ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-black/20 opacity-60'}`}>
                  {completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : unlocked ? <FlaskConical className="h-4 w-4 shrink-0 text-sky-400" /> : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />}
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{protocol.title}</p><p className="mt-1 text-[11px] text-slate-400">{completed ? 'Verified and recorded' : unlocked ? 'Available for research' : `Unlock at lab tier ${protocol.tier}`}</p></div>
                  {index === activeProtocolIndex && <span className="text-[10px] font-bold text-sky-300">ACTIVE</span>}
                </div>;
              })}</div>
            </div>
          </div>
          <div className="space-y-5 p-5">
            <section><h3 className="mb-3 text-xs font-bold tracking-widest text-sky-300">LATEST ANALYSIS REPORTS</h3>
              {reports.length === 0 ? <p className="border border-dashed border-slate-700 p-4 text-sm leading-6 text-slate-400">No analysis reports yet. Prepare a sample and run the spectrophotometer at the analysis station to create a report.</p> : <div className="space-y-3">{reports.map((report) => <article key={report.id} className="border border-slate-700 bg-slate-900/50 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">{report.sampleName}</h4><p className="text-xs text-slate-400">{report.sampleFormula} · {report.timestamp}</p></div><span className={`text-[10px] font-bold ${report.isReactionVerified ? 'text-emerald-400' : 'text-amber-300'}`}>{report.isReactionVerified ? 'VERIFIED' : 'UNVERIFIED'}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><p className="bg-black/20 p-2">Volume <b className="block pt-1">{report.volumeMl.toFixed(2)} mL</b></p><p className="bg-black/20 p-2">Mass <b className="block pt-1">{report.massG.toFixed(2)} g</b></p><p className="bg-black/20 p-2">pH <b className="block pt-1">{report.ph.toFixed(2)}</b></p><p className="bg-black/20 p-2">Purity <b className="block pt-1">{report.purity.toFixed(1)}%</b></p></div><p className="mt-3 text-xs leading-5 text-slate-300">{report.notes}</p></article>)}</div>}
            </section>
            <section><h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400">VESSEL STATUS</h3><div className="space-y-2">{Object.values(vessels).map((vessel) => <div key={vessel.id} className="flex items-center justify-between gap-3 border border-slate-800 px-3 py-2 text-xs"><span className="text-slate-300">{vessel.name}</span><span className="shrink-0 text-sky-300">{vessel.content.volumeMl.toFixed(1)} / {vessel.capacityMl} mL</span></div>)}</div></section>
            <p className="text-[10px] leading-4 text-slate-500">Reports contain simulated results generated by the current CHEMORA model. They are educational game data, not real laboratory measurements.</p>
          </div>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-700 bg-[#151f29] px-5 py-3 text-[10px] text-slate-500"><span>FIELD RECORDS · LOCAL SESSION</span><span>Press TAB to toggle this journal</span></footer>
      </section>
    </div>
  );
};
