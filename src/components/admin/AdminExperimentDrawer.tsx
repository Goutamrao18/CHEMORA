import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FlaskConical,
  Clock,
  Layers,
  Video,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Check,
  Atom,
} from 'lucide-react';
import { Experiment } from '../../data/experimentsData';

interface AdminExperimentDrawerProps {
  experiment: Experiment | null;
  onClose: () => void;
  videoStatus?: { status: 'ok' | 'missing' | 'error'; contentType?: string; responseTimeMs?: number };
}

export const AdminExperimentDrawer: React.FC<AdminExperimentDrawerProps> = ({
  experiment,
  onClose,
  videoStatus,
}) => {
  if (!experiment) return null;

  const isVideoOk = videoStatus ? videoStatus.status === 'ok' : true;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl h-full bg-[var(--admin-card-bg)] text-[var(--admin-text-main)] shadow-2xl border-l border-[var(--admin-card-border)] flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--admin-card-border)] flex items-start justify-between bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-white shadow-md text-2xl">
                {experiment.emoji || <FlaskConical className="w-6 h-6 text-cyan-300" />}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                  {experiment.topic} &bull; {experiment.level}
                </span>
                <h3 className="text-xl font-bold font-sans tracking-tight text-[var(--admin-text-main)]">
                  {experiment.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)] mb-1">
                  <Clock className="w-3.5 h-3.5" /> Duration
                </div>
                <div className="text-sm font-semibold tabular-nums">15–20 min</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)] mb-1">
                  <Layers className="w-3.5 h-3.5" /> Level
                </div>
                <div className="text-sm font-semibold capitalize">{experiment.level}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)] mb-1">
                  <Atom className="w-3.5 h-3.5" /> Topic
                </div>
                <div className="text-xs font-semibold truncate">{experiment.topic}</div>
              </div>
            </div>

            {/* Video Stream Health Badge */}
            <div className="p-4 rounded-2xl border border-[var(--admin-card-border)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isVideoOk
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Video Streaming Pipeline</div>
                  <div className="text-[11px] text-[var(--admin-text-muted)] font-mono truncate max-w-xs">
                    Supabase Video CDN ({experiment.id}.mp4)
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isVideoOk
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                {isVideoOk ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Live (200 OK)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Degradation
                  </>
                )}
              </span>
            </div>

            {/* Objective & Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-2">
                Experiment Objective
              </h4>
              <p className="text-sm text-[var(--admin-text-main)] leading-relaxed p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)]">
                {experiment.summary}
              </p>
            </div>

            {/* Chemical Equation if provided */}
            {experiment.equation && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-2">
                  Chemical Reaction Equation
                </h4>
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 font-mono text-xs text-cyan-900 dark:text-cyan-200">
                  {experiment.equation}
                </div>
              </div>
            )}

            {/* Safety & Protocol notes */}
            {experiment.safety && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  Mandatory Safety Checklist
                </h4>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                  {experiment.safety}
                </div>
              </div>
            )}

            {/* Apparatus & Reagents */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                  Apparatus
                </span>
                <ul className="text-xs space-y-1">
                  {experiment.equipment.map((eq, i) => (
                    <li key={i} className="flex items-center gap-1 text-[var(--admin-text-muted)] truncate">
                      <Check className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate">{eq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                  Chemicals
                </span>
                <ul className="text-xs space-y-1">
                  {experiment.chemicals.map((chem, i) => (
                    <li key={i} className="flex items-center gap-1 text-[var(--admin-text-muted)] truncate">
                      <Check className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate">{chem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Steps / Procedure Breakdown */}
            {experiment.steps && experiment.steps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-3">
                  Simulation Steps ({experiment.steps.length})
                </h4>
                <div className="space-y-2.5">
                  {experiment.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] flex items-start gap-3 text-xs"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[var(--admin-rail-active)] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 text-[var(--admin-text-main)] leading-relaxed">
                        {st}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-[var(--admin-card-border)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs text-[var(--admin-text-muted)]">
              ID: <span className="font-mono">{experiment.id}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--admin-card-border)] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition"
              >
                Dismiss
              </button>
              <a
                href="#experiments"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#04212b] to-[#14a3c4] text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Play className="w-3.5 h-3.5" /> Launch Lab
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
