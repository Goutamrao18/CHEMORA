import React, { useState, useEffect } from 'react';
import { EXPERIMENTS, Experiment } from '../data/experimentsData';
import { recordStreakActivity } from '../data/streakManager';
import { Play, CheckCircle2, AlertTriangle, X, Shield, Sparkles, Filter, Beaker } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExperimentsViewProps {
  onAskAI?: (topic: string) => void;
}

const STORAGE_KEY = 'chemoraExperimentProgress';

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({ onAskAI }) => {
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeLevel, setActiveLevel] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
    } catch {}
  }, [completedIds]);

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (!exists) {
        try { confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } }); } catch {}
        recordStreakActivity();
      }
      return next;
    });
  };

  const filteredExperiments = EXPERIMENTS.filter((exp) => {
    if (activeLevel === 'all') return true;
    return exp.level.toLowerCase() === activeLevel.toLowerCase();
  });

  const openExperiment = (exp: Experiment) => {
    setSelectedExperiment(exp);
    setCompletedSteps({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          CHEMORA PRACTICAL CURRICULUM
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 mb-3">
          Guided <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Experiments</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Master 20 classical laboratory investigations with step-by-step procedure checklists, observations, video demonstrations, and safety protocols.
        </p>

        {/* Level Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
                activeLevel === lvl
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-[#101726] border border-cyan-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {lvl === 'all' ? 'All Practicals' : `${lvl} Level`}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Counter */}
      <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Your Practical Progress</h3>
            <p className="text-xs text-slate-400">
              Completed {completedIds.length} of {EXPERIMENTS.length} laboratory investigations
            </p>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-[#090d16] h-2.5 rounded-full overflow-hidden border border-cyan-950">
          <div
            className="bg-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(completedIds.length / EXPERIMENTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperiments.map((exp) => {
          const isDone = completedIds.includes(exp.id);

          return (
            <article
              key={exp.id}
              onClick={() => openExperiment(exp)}
              className={`cursor-pointer rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/20'
                  : 'bg-[#0e1626] border-cyan-950/80 hover:border-cyan-500/40 shadow-cyan-950/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#121c2e] border border-cyan-900/60 flex items-center justify-center text-2xl">
                    {exp.emoji}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    exp.level === 'Beginner'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                      : exp.level === 'Intermediate'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                  }`}>
                    {exp.level} · {exp.topic}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                  {exp.title}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-6">
                  {exp.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mb-4 pt-3 border-t border-cyan-950/60">
                  <span>{exp.equipment.length} tools</span>
                  <span>•</span>
                  <span>{exp.chemicals.length} reagents</span>
                  <span>•</span>
                  <span>{exp.steps.length} steps</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDone ? 'text-emerald-400' : 'text-cyan-400'
                  }`}>
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        COMPLETED
                      </>
                    ) : (
                      'OPEN PRACTICAL →'
                    )}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Practical Details Modal */}
      {selectedExperiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#0d1524] border border-cyan-800/70 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-[#090f1a] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedExperiment.emoji}</span>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                    {selectedExperiment.level} · {selectedExperiment.topic}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {selectedExperiment.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedExperiment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden bg-black border border-cyan-950 aspect-video relative flex items-center justify-center shadow-lg">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  src={`/videos/${selectedExperiment.id}.mp4`}
                >
                  <p className="text-slate-400 text-xs p-4">
                    Video explanation unavailable on this device. Review the procedure below.
                  </p>
                </video>
              </div>

              {/* Safety Warning */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 text-xs font-bold uppercase tracking-wide block mb-0.5">
                    Safety &amp; Handling Precautions
                  </strong>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {selectedExperiment.safety}
                  </p>
                </div>
              </div>

              {/* Equipment & Chemicals Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-950">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    Required Equipment ({selectedExperiment.equipment.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedExperiment.equipment.map((eq, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        {eq}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-950">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    Chemicals &amp; Reagents ({selectedExperiment.chemicals.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedExperiment.chemicals.map((ch, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {ch}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interactive Step-by-Step Procedure */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Step-by-step Procedure (Check off as you complete)
                </h4>
                <div className="space-y-2">
                  {selectedExperiment.steps.map((step, idx) => {
                    const isChecked = Boolean(completedSteps[idx]);
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                            : 'bg-[#090f1a] border-cyan-950 text-slate-200 hover:border-cyan-800'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 ${
                          isChecked ? 'bg-emerald-500 text-slate-950' : 'bg-[#121c2d] text-cyan-400'
                        }`}>
                          {isChecked ? '✓' : idx + 1}
                        </span>
                        <span className={`text-xs sm:text-sm leading-relaxed ${isChecked ? 'line-through opacity-70' : ''}`}>
                          {step}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chemical Equation & Observations */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#111c2e] border border-cyan-900/60">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                    Balanced Chemical Equation
                  </span>
                  <div className="text-base sm:text-lg font-bold font-mono text-cyan-200 bg-[#090f1a] p-3 rounded-lg border border-cyan-950">
                    {selectedExperiment.equation}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-950">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Key Observations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {selectedExperiment.observations.map((obs, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#0e1626] p-2 rounded-lg">
                        <span className="text-cyan-400">👁</span>
                        {obs}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-950">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Scientific Explanation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                    {selectedExperiment.explanation}
                  </p>
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Conclusion
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedExperiment.conclusion}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-6 border-t border-cyan-950 bg-[#090f1a] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              {onAskAI && (
                <button
                  onClick={() => {
                    const title = selectedExperiment.title;
                    setSelectedExperiment(null);
                    onAskAI(`Explain the chemistry behind ${title}`);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  Ask AI Tutor about this reaction
                </button>
              )}

              <button
                onClick={() => toggleComplete(selectedExperiment.id)}
                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md ${
                  completedIds.includes(selectedExperiment.id)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
                }`}
              >
                {completedIds.includes(selectedExperiment.id)
                  ? '✓ Mark as Incomplete'
                  : '✓ Mark Practical as Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
