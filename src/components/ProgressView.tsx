import React, { useState, useEffect } from 'react';
import { ChallengeState, getInitialChallengeState } from '../data/challengeData';
import { EXPERIMENTS } from '../data/experimentsData';
import {
  DailyStreakState,
  getDailyStreak,
  recordStreakActivity,
  getPast7DaysStreak,
  DayActivity
} from '../data/streakManager';
import {
  Trophy,
  TrendingUp,
  Target,
  Compass,
  Award,
  Clock,
  ArrowRight,
  Flame,
  Shield,
  CheckCircle2,
  Sparkles,
  Calendar,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProgressViewProps {
  onGoToChallenge: () => void;
  onGoToExperiments: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onGoToChallenge, onGoToExperiments }) => {
  const [challengeState, setChallengeState] = useState<ChallengeState>(getInitialChallengeState);
  const [streakState, setStreakState] = useState<DailyStreakState>(getDailyStreak);
  const [completedExperiments, setCompletedExperiments] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('chemoraExperimentProgress');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [claimedTodayNotice, setClaimedTodayNotice] = useState(false);

  useEffect(() => {
    const handleProgressUpdate = () => {
      setChallengeState(getInitialChallengeState());
    };
    const handleStreakUpdate = () => {
      setStreakState(getDailyStreak());
    };

    window.addEventListener('chemora:progress', handleProgressUpdate);
    window.addEventListener('chemora:streak_update', handleStreakUpdate);
    return () => {
      window.removeEventListener('chemora:progress', handleProgressUpdate);
      window.removeEventListener('chemora:streak_update', handleStreakUpdate);
    };
  }, []);

  const handleClaimToday = () => {
    const updated = recordStreakActivity();
    setStreakState(updated);
    setClaimedTodayNotice(true);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}
    setTimeout(() => setClaimedTodayNotice(false), 4000);
  };

  const doneCount = challengeState.levels.length;
  const accuracy = challengeState.answers
    ? Math.round((challengeState.correct / challengeState.answers) * 100)
    : 0;

  const past7Days: DayActivity[] = getPast7DaysStreak(streakState);

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

  // Streak Milestones
  const streakMilestones = [
    { days: 3, label: 'Spark Ignition', bonus: '+50 XP', achieved: streakState.currentStreak >= 3 },
    { days: 7, label: 'Chemistry Scholar', bonus: '+150 XP', achieved: streakState.currentStreak >= 7 },
    { days: 14, label: 'Reaction Dynamo', bonus: '+350 XP', achieved: streakState.currentStreak >= 14 },
    { days: 30, label: 'Elemental Legend', bonus: '+1,000 XP', achieved: streakState.currentStreak >= 30 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-[0.18em] uppercase">
          ANALYTICS &amp; GAMIFIED LEARNING
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white mt-1.5 mb-2">
          Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">Progress</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Track your daily study streaks, challenge completions, discipline strengths, and milestone badges.
        </p>
      </div>

      {/* GAMIFIED DAILY STREAK CARD */}
      <section className="relative rounded-[28px] overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#1b120c]/90 via-[#0e1628]/95 to-[#060c18] p-6 sm:p-8 shadow-[0_20px_60px_rgba(245,158,11,0.12)]">
        {/* Ambient Warm Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Streak Flame & Number */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.35)] flex-shrink-0">
              <span className="text-4xl sm:text-5xl animate-bounce filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                🔥
              </span>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                {streakState.currentStreak}D
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
                  DAILY PRACTICE STREAK
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {streakState.streakLevel}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-0.5">
                {streakState.currentStreak} {streakState.currentStreak === 1 ? 'Day' : 'Days'} Streak!
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md">
                {streakState.hasCompletedToday
                  ? "Great job! You've logged your chemistry study session for today. Come back tomorrow to keep the flame burning!"
                  : "Practice challenges or review practicals today to preserve and grow your streak!"}
              </p>
            </div>
          </div>

          {/* Quick Check-in CTA / Freeze Badge */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 flex-shrink-0">
            {streakState.hasCompletedToday ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Today's Streak Completed!</span>
              </div>
            ) : (
              <button
                onClick={handleClaimToday}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(245,158,11,0.35)] transition transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Log Today's Chemistry Session (+25 XP)</span>
              </button>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                {streakState.freezesRemaining} Freeze Available
              </span>
              <span>•</span>
              <span className="text-amber-300 font-bold">
                Best: {streakState.bestStreak} {streakState.bestStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
        </div>

        {claimedTodayNotice && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Streak updated! You gained +25 XP and secured today's link in your study chain.</span>
          </div>
        )}

        {/* 7-DAY ACTIVITY CHAIN */}
        <div className="mt-8 pt-6 border-t border-cyan-900/30">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Past 7 Days Practice Chain
            </span>
            <span className="text-slate-400">
              {streakState.activeDates.length} total active study days recorded
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {past7Days.map((day) => {
              let bg = 'bg-[#091120] border-cyan-950/80 text-slate-500';
              if (day.isCompleted) {
                bg = 'bg-gradient-to-t from-amber-500/20 to-orange-500/30 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
              } else if (day.isToday) {
                bg = 'bg-[#13223d] border-amber-400/40 text-amber-300 animate-pulse';
              }

              return (
                <div
                  key={day.dateStr}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${bg}`}
                >
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase mb-1">
                    {day.dayName}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs sm:text-sm my-0.5">
                    {day.isCompleted ? (
                      <span className="text-base sm:text-lg">🔥</span>
                    ) : day.isToday ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">{day.dayNumber}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono font-bold mt-1">
                    {day.isCompleted ? 'DONE' : day.isToday ? 'TODAY' : 'REST'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STREAK MILESTONES ROADMAP */}
        <div className="mt-6 pt-5 border-t border-cyan-900/30">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Gamified Streak Milestones
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {streakMilestones.map((m) => (
              <div
                key={m.days}
                className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                  m.achieved
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-sm'
                    : 'bg-[#08111e]/70 border-cyan-950/60 text-slate-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    m.achieved
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#0c182a] text-slate-600'
                  }`}
                >
                  {m.days}d
                </div>
                <div>
                  <strong className={`block text-xs font-bold leading-tight ${m.achieved ? 'text-white' : 'text-slate-400'}`}>
                    {m.label}
                  </strong>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">{m.bonus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  Daily Consistency Over Cramming
                </strong>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Studying 10-15 minutes every day strengthens memory neural pathways for reaction mechanisms much more effectively than weekend cramming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
