import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Search, CheckCircle2, Flame, Award, ArrowUpRight, Filter } from 'lucide-react';

interface ChallengeStatsItem {
  level: number;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  completions: number;
  accuracy: number;
  avgTime: string;
}

const SAMPLE_CHALLENGES: ChallengeStatsItem[] = [
  { level: 1, title: 'Atomic Foundations & Protons', category: 'General', difficulty: 'Beginner', completions: 489, accuracy: 94.2, avgTime: '1m 12s' },
  { level: 2, title: 'Electron Configuration (Aufbau)', category: 'Physical', difficulty: 'Beginner', completions: 462, accuracy: 91.5, avgTime: '1m 45s' },
  { level: 3, title: 'Balancing Combustion Reactions', category: 'Inorganic', difficulty: 'Beginner', completions: 430, accuracy: 88.0, avgTime: '2m 10s' },
  { level: 15, title: 'Acid-Base Neutralization Titration', category: 'Analytical', difficulty: 'Intermediate', completions: 341, accuracy: 82.4, avgTime: '3m 05s' },
  { level: 28, title: 'Gas Laws & Ideal PV=nRT', category: 'Physical', difficulty: 'Intermediate', completions: 288, accuracy: 76.1, avgTime: '3m 40s' },
  { level: 42, title: 'Organic Nomenclature (IUPAC Alkanes)', category: 'Organic', difficulty: 'Intermediate', completions: 215, accuracy: 73.8, avgTime: '4m 12s' },
  { level: 57, title: 'Thermodynamics & Gibbs Free Energy', category: 'Physical', difficulty: 'Advanced', completions: 168, accuracy: 64.2, avgTime: '4m 55s' },
  { level: 69, title: 'Electrochemical Half-Cells & Nernst', category: 'Physical', difficulty: 'Advanced', completions: 132, accuracy: 58.7, avgTime: '5m 20s' },
  { level: 84, title: 'SN1 vs SN2 Nucleophilic Substitution', category: 'Organic', difficulty: 'Expert', completions: 98, accuracy: 52.3, avgTime: '6m 10s' },
  { level: 92, title: 'Coordination Chemistry & Crystal Field', category: 'Inorganic', difficulty: 'Expert', completions: 74, accuracy: 48.9, avgTime: '6m 45s' },
  { level: 100, title: 'Grand Grandmaster Synthesis Matrix', category: 'Organic', difficulty: 'Expert', completions: 41, accuracy: 41.2, avgTime: '8m 30s' },
];

export const AdminChallengesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filtered = SAMPLE_CHALLENGES.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.level.toString().includes(searchQuery);

    const matchesDiff = selectedDifficulty === 'all' || c.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <input
            type="text"
            placeholder="Search level number, topic, or discipline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--admin-card-border)]">
          {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                selectedDifficulty === d
                  ? 'bg-[var(--admin-card-bg)] text-[var(--admin-text-main)] shadow-sm'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Matrix Table */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] overflow-hidden">
        <div className="divide-y divide-[var(--admin-card-border)] overflow-x-auto">
          {/* Header */}
          <div className="px-6 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider grid grid-cols-12 gap-4 min-w-[700px]">
            <div className="col-span-1">Level</div>
            <div className="col-span-4">Challenge Module</div>
            <div className="col-span-2">Discipline</div>
            <div className="col-span-2">Difficulty</div>
            <div className="col-span-2">Pass Accuracy</div>
            <div className="col-span-1 text-right">Solves</div>
          </div>

          {/* Rows */}
          {filtered.map((item) => (
            <div
              key={item.level}
              className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition text-xs min-w-[700px]"
            >
              <div className="col-span-1 font-mono font-bold text-[var(--admin-text-main)]">
                #{item.level.toString().padStart(3, '0')}
              </div>

              <div className="col-span-4 font-semibold text-[var(--admin-text-main)] truncate">
                {item.title}
              </div>

              <div className="col-span-2 text-[var(--admin-text-muted)]">
                {item.category}
              </div>

              <div className="col-span-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.difficulty === 'Beginner'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : item.difficulty === 'Intermediate'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : item.difficulty === 'Advanced'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {item.difficulty}
                </span>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.accuracy >= 80
                          ? 'bg-emerald-500'
                          : item.accuracy >= 65
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-[11px] text-[var(--admin-text-main)]">
                    {item.accuracy}%
                  </span>
                </div>
              </div>

              <div className="col-span-1 text-right font-mono text-[11px] text-[var(--admin-text-muted)] tabular-nums">
                {item.completions}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
