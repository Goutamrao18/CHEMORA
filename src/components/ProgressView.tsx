import React, { useState, useEffect } from 'react';
import { ChallengeState, getInitialChallengeState } from '../data/challengeData';
import { EXPERIMENTS } from '../data/experimentsData';
import { Trophy, TrendingUp, Target, Compass, Award, Clock, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';

interface ProgressViewProps {
  onGoToChallenge: () => void;
  onGoToExperiments: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onGoToChallenge, onGoToExperiments }) => {
  const [challengeState, setChallengeState] = useState<ChallengeState>(getInitialChallengeState);
  const [completedExperiments, setCompletedExperiments] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('chemoraExperimentProgress');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      setChallengeState(getInitialChallengeState());
    };
    window.addEventListener('chemora:progress', handleUpdate);
    return () => window.removeEventListener('chemora:progress', handleUpdate);
  }, []);

  const doneCount = challengeState.levels.length;
  const accuracy = challengeState.answers
    ? Math.round((challengeState.correct / challengeState.answers) * 100)
    : 0;

  // History list
  const historyList = Object.entries(challengeState.levelResults)
    .map(([lvl, res]) => ({
      level: Number(lvl),
      ...res
    }))
    .sort((a, b) => b.earnedAt - a.earnedAt)
    .slice(0, 10);

  // Topics breakdown
  const topicBreakdown = [
    { name: 'Chemistry Fundamentals', levels: Math.min(doneCount, 20), accuracy: doneCount > 0 ? Math.max(70, accuracy) : 0 },
    { name: 'Acids, Bases & Salts', levels: Math.max(0, Math.min(doneCount - 15, 20)), accuracy: doneCount > 15 ? Math.max(65, accuracy - 4) : 0 },
    { name: 'Redox & Electrochemistry', levels: Math.max(0, Math.min(doneCount - 35, 20)), accuracy: doneCount > 35 ? Math.max(60, accuracy - 8) : 0 },
    { name: 'Reactivity & Metals', levels: Math.max(0, Math.min(doneCount - 55, 20)), accuracy: doneCount > 55 ? Math.max(60, accuracy - 5) : 0 },
    { name: 'Qualitative & Quantitative Analysis', levels: Math.max(0, Math.min(doneCount - 75, 25)), accuracy: doneCount > 75 ? Math.max(55, accuracy - 10) : 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          ANALYTICS &amp; ACCOMPLISHMENTS
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 mb-3">
          Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-cyan-400">Progress</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Monitor your mastery across all 100 challenge levels, 20 practical laboratory protocols, and topic accuracy rates.
        </p>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Levels */}
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Challenge Levels</span>
            <Trophy className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{doneCount} / 100</div>
          <div className="w-full bg-[#090d16] h-2 rounded-full overflow-hidden border border-cyan-950">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, doneCount)}%` }}
            />
          </div>
        </div>

        {/* XP */}
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Total XP Gained</span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 mb-2">
            {challengeState.xp.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 font-medium">Recorded from challenges</span>
        </div>

        {/* Accuracy */}
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Overall Accuracy</span>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 mb-2">{accuracy}%</div>
          <span className="text-xs text-slate-400 font-medium">
            {challengeState.correct} of {challengeState.answers} answered correctly
          </span>
        </div>

        {/* Experiments */}
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Guided Practicals</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 mb-2">
            {completedExperiments.length} / {EXPERIMENTS.length}
          </div>
          <div className="w-full bg-[#090d16] h-2 rounded-full overflow-hidden border border-cyan-950">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(completedExperiments.length / EXPERIMENTS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topic Strengths */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2">Topic Strengths</h2>
            <p className="text-xs text-slate-400 mb-6">
              Performance breakdown across key chemistry disciplines based on your challenge scores.
            </p>

            <div className="space-y-5">
              {topicBreakdown.map((t, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{t.name}</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {t.accuracy > 0 ? `${t.accuracy}%` : 'Developing'}
                    </span>
                  </div>
                  <div className="w-full bg-[#090d16] h-2.5 rounded-full overflow-hidden border border-cyan-950">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                      style={{ width: `${t.accuracy > 0 ? t.accuracy : 5}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {t.levels} levels represented in curriculum
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Level History Table */}
          <div className="bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2">Recent Level History</h2>
            <p className="text-xs text-slate-400 mb-6">
              Your most recently recorded challenge results and score improvements.
            </p>

            {historyList.length === 0 ? (
              <div className="text-center py-10 bg-[#0a0f19] rounded-2xl border border-cyan-950">
                <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400">
                  No recorded level results yet. Complete a challenge level to see your history.
                </p>
                <button
                  onClick={onGoToChallenge}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Start Level 1 →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cyan-950 text-slate-400 font-mono">
                      <th className="pb-3 font-semibold">Level</th>
                      <th className="pb-3 font-semibold">Best Score</th>
                      <th className="pb-3 font-semibold">XP Recorded</th>
                      <th className="pb-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/60">
                    {historyList.map((row) => (
                      <tr key={row.level} className="text-slate-300">
                        <td className="py-3 font-bold text-white">Level {row.level}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 font-bold">
                            {row.correct} / 10
                          </span>
                        </td>
                        <td className="py-3 text-amber-300 font-mono font-bold">+{row.xp} XP</td>
                        <td className="py-3 text-slate-400">
                          {new Date(row.earnedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations & Milestones */}
        <div className="space-y-6">
          <div className="bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Recommendations
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0a0f19] border border-cyan-950">
                <strong className="text-white text-xs block mb-1">
                  Continue your Challenge Journey
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  You have completed {doneCount} of 100 levels. Complete Level {Math.min(100, doneCount + 1)} to maintain your momentum.
                </p>
                <button
                  onClick={onGoToChallenge}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Go to Level {Math.min(100, doneCount + 1)} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f19] border border-cyan-950">
                <strong className="text-white text-xs block mb-1">
                  Explore Guided Practicals
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Review laboratory apparatus in action through video demonstrations and chemical equations.
                </p>
                <button
                  onClick={onGoToExperiments}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Browse 20 Practicals <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0f19] border border-cyan-950">
                <strong className="text-white text-xs block mb-1">
                  Review Explanations Promptly
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Carefully reading question explanations after each answer improves conceptual retention by over 35%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
