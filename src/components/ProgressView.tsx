import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  ChevronRight
} from 'lucide-react';
import { getStoredProfile } from '../data/userProfile';
import { DropperDrip } from './Loaders/DropperDrip';
import { fireConfetti } from '../utils/confetti';
import { GlassCard, GlassPanel, GlassBadge, GlassButton } from './ui/Glass';

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
  const [hoveredDate, setHoveredDate] = useState<{ date: string; count: number } | null>(null);

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
      fireConfetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
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

  // Topics breakdown - authentic per-category completion and accuracy
  const topicBreakdown = useMemo(() => {
    const categories = [
      { name: 'Chemistry Fundamentals', minLvl: 1, maxLvl: 20 },
      { name: 'Acids, Bases & Salts', minLvl: 21, maxLvl: 40 },
      { name: 'Redox & Electrochemistry', minLvl: 41, maxLvl: 60 },
      { name: 'Reactivity & Metals', minLvl: 61, maxLvl: 80 },
      { name: 'Qualitative & Quantitative Analysis', minLvl: 81, maxLvl: 100 },
    ];

    return categories.map((cat) => {
      const catLevels = challengeState.levels.filter((lvl) => lvl >= cat.minLvl && lvl <= cat.maxLvl);
      let catCorrect = 0;
      let catAttempts = 0;

      catLevels.forEach((lvl) => {
        const res = challengeState.levelResults?.[lvl];
        if (res) {
          catCorrect += (res.correct || 0);
          catAttempts += ((res.correct || 0) + (res.wrong || 0));
        }
      });

      const catAccuracy = catAttempts > 0
        ? Math.round((catCorrect / catAttempts) * 100)
        : (catLevels.length > 0 && accuracy > 0 ? accuracy : 0);

      return {
        name: cat.name,
        levels: catLevels.length,
        total: cat.maxLvl - cat.minLvl + 1,
        accuracy: catAccuracy
      };
    });
  }, [challengeState.levels, challengeState.levelResults, accuracy]);

  // Streak Milestones
  const streakMilestones = [
    { days: 3, label: 'Spark Ignition', bonus: '+50 XP', achieved: streakState.currentStreak >= 3 },
    { days: 7, label: 'Chemistry Scholar', bonus: '+150 XP', achieved: streakState.currentStreak >= 7 },
    { days: 14, label: 'Reaction Dynamo', bonus: '+350 XP', achieved: streakState.currentStreak >= 14 },
    { days: 30, label: 'Elemental Legend', bonus: '+1,000 XP', achieved: streakState.currentStreak >= 30 },
  ];

  // 4 Core Disciplines for Pure-SVG Rings (Item 8)
  // Truly authentic calculations starting at 0% with no artificial minimums
  const organicLevelsCount = challengeState.levels.filter((lvl) => lvl >= 1 && lvl <= 25).length;
  const inorganicLevelsCount = challengeState.levels.filter((lvl) => lvl >= 26 && lvl <= 50).length;
  const physicalLevelsCount = challengeState.levels.filter((lvl) => lvl >= 51 && lvl <= 75).length;
  const analyticalChallengeCount = challengeState.levels.filter((lvl) => lvl >= 76 && lvl <= 100).length;
  const totalAnalyticalItems = 25 + EXPERIMENTS.length; // 25 challenge levels + 20 practicals = 45
  const completedAnalyticalItems = analyticalChallengeCount + completedExperiments.length;

  const disciplines = [
    {
      name: 'Organic Chemistry',
      subtitle: 'Hydrocarbons & Mechanisms',
      color: '#38bdf8',
      accentClass: 'text-sky-400',
      bgClass: 'border-sky-500/20 bg-sky-950/20',
      percent: Math.min(100, Math.round((organicLevelsCount / 25) * 100)),
      topics: 'Alkanes, Alkenes, Functional Groups'
    },
    {
      name: 'Inorganic Chemistry',
      subtitle: 'Periodic Trends & Metals',
      color: '#34d399',
      accentClass: 'text-emerald-400',
      bgClass: 'border-emerald-500/20 bg-emerald-950/20',
      percent: Math.min(100, Math.round((inorganicLevelsCount / 25) * 100)),
      topics: 'Transition Metals, Coordination, Salts'
    },
    {
      name: 'Physical Chemistry',
      subtitle: 'Thermodynamics & Rates',
      color: '#f59e0b',
      accentClass: 'text-amber-400',
      bgClass: 'border-amber-500/20 bg-amber-950/20',
      percent: Math.min(100, Math.round((physicalLevelsCount / 25) * 100)),
      topics: 'Kinetics, Equilibria, Energetics'
    },
    {
      name: 'Analytical Chemistry',
      subtitle: 'Quantitative & Qualitative',
      color: '#a855f7',
      accentClass: 'text-purple-400',
      bgClass: 'border-purple-500/20 bg-purple-950/20',
      percent: Math.min(100, Math.round((completedAnalyticalItems / totalAnalyticalItems) * 100)),
      topics: 'Titrations, Flame Tests, Gas Laws'
    }
  ];

  // Rank Progression (Item 8)
  const RANK_TIERS = [
    { name: 'Apprentice Chemist', minXp: 0, maxXp: 500, badge: '🌱', level: 1 },
    { name: 'Junior Synthesizer', minXp: 500, maxXp: 1500, badge: '⚗️', level: 2 },
    { name: 'Laboratory Analyst', minXp: 1500, maxXp: 3500, badge: '🔬', level: 3 },
    { name: 'Senior Chemist', minXp: 3500, maxXp: 7500, badge: '🧪', level: 4 },
    { name: 'Principal Investigator', minXp: 7500, maxXp: 15000, badge: '🛡️', level: 5 },
    { name: 'Master of Elements', minXp: 15000, maxXp: 50000, badge: '👑', level: 6 }
  ];

  const currentXp = challengeState.xp;
  let currentTierIndex = 0;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (currentXp >= RANK_TIERS[i].minXp) {
      currentTierIndex = i;
      break;
    }
  }
  const currentTier = RANK_TIERS[currentTierIndex] || RANK_TIERS[0];
  const nextTier = RANK_TIERS[currentTierIndex + 1] || null;
  const rankProgressPercent = nextTier
    ? Math.min(100, Math.max(0, Math.round(((currentXp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100)))
    : 100;
  const xpNeededForNext = nextTier ? Math.max(0, nextTier.minXp - currentXp) : 0;

  // 52-Week Practice Calendar Heatmap (Item 8)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const activeSet = new Set(streakState.activeDates || []);
    const weeks: Array<Array<{ dateStr: string; count: number; dateFormatted: string; isToday: boolean; isCompleted: boolean }>> = [];

    const totalDays = 52 * 7;
    const start = new Date(today);
    start.setDate(today.getDate() - totalDays + 1);

    let week: Array<{ dateStr: string; count: number; dateFormatted: string; isToday: boolean; isCompleted: boolean }> = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isCompleted = activeSet.has(dateStr);
      let count = isCompleted ? 2 : 0;
      if (isToday && streakState.hasCompletedToday) count = 3;

      week.push({
        dateStr,
        count,
        isToday,
        isCompleted,
        dateFormatted: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  }, [streakState.activeDates, streakState.hasCompletedToday]);

  const userProfile = getStoredProfile();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-[0.18em] uppercase">
          ANALYTICS &amp; GAMIFIED LEARNING
        </span>
        <h1 className="text-2xl sm:text-5xl font-black text-white mt-1.5 mb-2">
          Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">Progress</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Track your daily study streaks, challenge completions, discipline strengths, and milestone badges.
        </p>
      </div>

      {/* ================================================================
          MOBILE PHONE GLASS DASHBOARD (< 768px)
          - Staggered Entrance
          - Profile Header with Avatar
          - 2x2 Stat Cards (XP, Levels, Streak, Rank)
          - Dual SVG Circular Progress Rings (Organic Chemistry & Titration)
          - Recent Activity Card
          ================================================================ */}
      <div className="md:hidden space-y-4 chemora-stagger">
        {/* 1. Profile Header Glass Card */}
        <div className="chemora-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/30 border border-cyan-400/40 p-1 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <img
                src={userProfile.avatar || '/favicon.png'}
                alt={userProfile.name}
                className="w-full h-full object-contain rounded-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#040a17]" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                RESEARCHER PROFILE
              </span>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                {userProfile.name}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
                <Shield className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="truncate max-w-[150px]">{userProfile.rank}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={streakState.hasCompletedToday ? undefined : handleClaimToday}
            aria-label={`Daily streak: ${streakState.currentStreak} days`}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-center transition ${
              streakState.hasCompletedToday
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 active:scale-[0.96]'
            }`}
          >
            <span className="text-base leading-none">🔥</span>
            <span className="text-[10px] font-mono font-black mt-0.5">{streakState.currentStreak}d</span>
          </button>
        </div>

        {/* 2. 2x2 Stat Cards Row (XP, Levels, Daily Streak, Rank) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="chemora-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Total XP</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300">
              {challengeState.xp.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Earned in Arena</span>
          </div>

          <div className="chemora-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Levels</span>
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-white">
              {doneCount}<span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <span className="text-[9px] text-cyan-400 font-medium">Challenges Done</span>
          </div>

          <div className="chemora-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Streak</span>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl font-black text-orange-300">
              {streakState.currentStreak}<span className="text-xs text-slate-400 font-normal">d</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Best: {streakState.bestStreak}d</span>
          </div>

          <div className="chemora-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Rank</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xs font-black text-purple-200 truncate mt-1">
              {userProfile.rank}
            </div>
            <span className="text-[9px] text-purple-300/80 font-medium">Active Rank</span>
          </div>
        </div>

        {/* 3. Pure-SVG Discipline Mastery Rings (Organic, Inorganic, Physical, Analytical) */}
        <div className="chemora-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Discipline Mastery Rings
            </span>
            <span className="text-[10px] font-mono text-cyan-400">Pure-SVG</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {disciplines.map((d, idx) => {
              const radius = 26;
              const circumference = 2 * Math.PI * radius;
              const dashoffset = circumference * (1 - d.percent / 100);

              return (
                <div key={idx} className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white/[0.03] border border-cyan-500/15">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="4.5"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={d.color}
                        strokeWidth="4.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-white">{d.percent}%</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-white mt-1 leading-tight">{d.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[110px]">{d.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Recent Activity Card */}
        <div className="chemora-card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Recent Activity
            </span>
            <span className="text-[10px] font-mono text-slate-400">{historyList.length} logs</span>
          </div>

          {historyList.length > 0 ? (
            <div className="space-y-1.5">
              {historyList.slice(0, 3).map((item) => (
                <div
                  key={item.level}
                  className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-[10px] flex items-center justify-center">
                      L{item.level}
                    </span>
                    <div>
                      <span className="font-bold text-white block leading-tight">
                        Level {item.level} Cleared
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.correct} correct
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    +{item.xp} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-slate-400">
              No challenge runs yet. Start Level 1 to build your activity history!
            </div>
          )}

          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={onGoToChallenge}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <span>Continue Challenge Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* GAMIFIED DAILY STREAK CARD (Desktop & Tablet) */}
      <section className="hidden md:block relative rounded-[28px] overflow-hidden border border-amber-500/40 bg-gradient-to-br from-[#1b120c]/90 via-[#0e1628]/95 to-[#060c18] p-6 sm:p-8 shadow-[0_20px_60px_rgba(245,158,11,0.2)] glass-top-edge">
        {/* Top Specular Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none z-30" />

        {/* Ambient Warm Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Streak Flame & Number */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500/25 via-orange-500/20 to-red-500/20 border-2 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex-shrink-0">
              <span className="text-4xl sm:text-5xl animate-bounce filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                🔥
              </span>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-md">
                {streakState.currentStreak}D
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <GlassBadge variant="amber" dot={true}>
                  DAILY PRACTICE STREAK
                </GlassBadge>
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
                className="glass-btn-emerald px-6 py-3 text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(16,185,129,0.35)] transition transform hover:-translate-y-0.5"
              >
                <Zap className="w-4 h-4 fill-emerald-950" />
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
              let bg = 'bg-[#091120]/80 border-cyan-950/80 text-slate-500';
              if (day.isCompleted) {
                bg = 'bg-gradient-to-t from-amber-500/25 to-orange-500/30 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
              } else if (day.isToday) {
                bg = 'bg-[#13223d]/90 border-amber-400/50 text-amber-300 animate-pulse';
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

      {/* Main KPI Stats with GlassCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Levels */}
        <GlassCard variant="cyan" interactive={true} className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Challenge Levels</span>
            <Trophy className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white mb-2">{doneCount} / 100</div>
          <div className="w-full bg-[#090d16] h-2 rounded-full overflow-hidden border border-cyan-950">
            <div
              className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_10px_#00f0ff]"
              style={{ width: `${Math.min(100, doneCount)}%` }}
            />
          </div>
        </GlassCard>

        {/* XP */}
        <GlassCard variant="amber" interactive={true} className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Total XP Gained</span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 mb-2">
            {challengeState.xp.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 font-medium">Recorded from challenges</span>
        </GlassCard>

        {/* Accuracy */}
        <GlassCard variant="purple" interactive={true} className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Overall Accuracy</span>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 mb-2">{accuracy}%</div>
          <span className="text-xs text-slate-400 font-medium">
            {challengeState.correct} of {challengeState.answers} answered correctly
          </span>
        </GlassCard>

        {/* Experiments */}
        <GlassCard variant="emerald" interactive={true} className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Guided Practicals</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 mb-2">
            {completedExperiments.length} / {EXPERIMENTS.length}
          </div>
          <div className="w-full bg-[#090d16] h-2 rounded-full overflow-hidden border border-cyan-950">
            <div
              className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_10px_#10b981]"
              style={{ width: `${(completedExperiments.length / EXPERIMENTS.length) * 100}%` }}
            />
          </div>
        </GlassCard>
      </div>

      {/* ================================================================
          RANK BADGE PROGRESSION (Item 8)
          ================================================================ */}
      <section className="chemora-card p-6 sm:p-8 bg-gradient-to-br from-[#0c1628] via-[#09101f] to-[#040813] border border-cyan-900/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-cyan-950">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/30 to-purple-500/30 border-2 border-cyan-400/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(20,163,196,0.3)]">
              {currentTier.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  TIER {currentTier.level} RESEARCHER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  {currentXp.toLocaleString()} Total XP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {currentTier.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {nextTier ? `Progressing towards ${nextTier.name} (${nextTier.badge})` : 'Highest researcher rank achieved!'}
              </p>
            </div>
          </div>

          {nextTier && (
            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-slate-400 block mb-0.5">Next Rank Unlock</span>
              <strong className="text-sm font-bold text-cyan-300">
                {xpNeededForNext.toLocaleString()} XP remaining
              </strong>
            </div>
          )}
        </div>

        {/* Progress bar to next rank */}
        {nextTier && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">{currentTier.name}</span>
              <span className="text-cyan-400 font-bold">{rankProgressPercent}% Complete</span>
              <span className="text-slate-400 font-semibold">{nextTier.name}</span>
            </div>
            <div className="w-full bg-[#050b16] h-3 rounded-full overflow-hidden border border-cyan-900/60 p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(20,163,196,0.5)]"
                style={{ width: `${rankProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          FOUR PURE-SVG DISCIPLINE MASTERY RINGS (Item 8)
          ================================================================ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase block">
              CORE DOMAINS
            </span>
            <h2 className="text-2xl font-black text-white">
              Discipline Mastery Rings
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Curriculum coverage calculated across Organic, Inorganic, Physical, and Analytical chemistry benchmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {disciplines.map((d, idx) => {
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const dashoffset = circumference * (1 - d.percent / 100);

            return (
              <div
                key={idx}
                className={`chemora-card p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${d.bgClass}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${d.accentClass}`}>
                      {d.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                      {d.name}
                    </h3>
                  </div>
                </div>

                {/* Pure-SVG Ring */}
                <div className="flex items-center justify-center my-3">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={d.color}
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${d.color}40)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-white tracking-tight">
                        {d.percent}%
                      </span>
                      <span className="text-[9px] font-mono uppercase text-slate-400">
                        Mastery
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-950/80">
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {d.topics}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================
          52-WEEK PRACTICE CALENDAR HEATMAP (Item 8)
          ================================================================ */}
      <section className="chemora-card p-6 sm:p-8 border border-cyan-900/60 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                52-WEEK ACTIVITY HEATMAP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Annual Study Consistency
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">CURRENT STREAK</span>
              <strong className="text-amber-300 font-bold">{streakState.currentStreak} Days</strong>
            </div>
            <div className="h-6 w-px bg-cyan-950" />
            <div>
              <span className="text-slate-400 block text-[10px]">LONGEST STREAK</span>
              <strong className="text-emerald-400 font-bold">{streakState.bestStreak} Days</strong>
            </div>
            <div className="h-6 w-px bg-cyan-950" />
            <div>
              <span className="text-slate-400 block text-[10px]">ACTIVE DAYS</span>
              <strong className="text-cyan-300 font-bold">{streakState.activeDates.length} Days</strong>
            </div>
          </div>
        </div>

        {/* Heatmap Grid (52 Columns x 7 Rows) */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-[720px] w-full">
            <div className="flex gap-1.5 justify-between">
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                  {week.map((day) => {
                    let cellClass = 'bg-[#060c18] border-cyan-950/60 hover:border-cyan-400/60';
                    if (day.count === 3 || (day.isToday && streakState.hasCompletedToday)) {
                      cellClass = 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
                    } else if (day.count === 2 || day.isCompleted) {
                      cellClass = 'bg-cyan-500 border-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]';
                    } else if (day.count === 1) {
                      cellClass = 'bg-cyan-900/60 border-cyan-800/60';
                    } else if (day.isToday) {
                      cellClass = 'bg-[#060c18] border-cyan-400/70 ring-1 ring-cyan-400/30';
                    }

                    return (
                      <div
                        key={day.dateStr}
                        onMouseEnter={() => setHoveredDate({ date: day.dateFormatted, count: day.count })}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`w-full aspect-square rounded-[3px] border transition-all cursor-pointer ${cellClass}`}
                        title={`${day.dateFormatted}: ${day.count > 0 ? `${day.count} sessions completed` : 'No study logged'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Heatmap Legend & Tooltip */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-cyan-950 text-xs text-slate-400 font-mono">
              <div>
                {hoveredDate ? (
                  <span className="text-cyan-300">
                    <strong>{hoveredDate.date}</strong>: {hoveredDate.count > 0 ? 'Study session completed 🔥' : 'No recorded activity'}
                  </span>
                ) : (
                  <span>Hover any cell to inspect daily session logs</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#060c18] border border-cyan-950" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-900/60 border border-cyan-800" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-cyan-500 border border-cyan-400" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-400 border border-amber-300" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Topic Strengths */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 sm:p-8">
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
                      {t.levels > 0 ? `${t.accuracy}%` : 'Not Started'}
                    </span>
                  </div>
                  <div className="w-full bg-[#090d16] h-2.5 rounded-full overflow-hidden border border-cyan-950">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500 shadow-[0_0_8px_#00f0ff]"
                      style={{ width: `${t.accuracy > 0 ? t.accuracy : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {t.levels} of {t.total} levels completed
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Level History Table */}
          <div className="glass-panel p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2">Recent Level History</h2>
            <p className="text-xs text-slate-400 mb-6">
              Your most recently recorded challenge results and score improvements.
            </p>

            {historyList.length === 0 ? (
              <div className="text-center py-10 bg-[#0a0f19]/80 rounded-2xl border border-cyan-950" role="status" aria-live="polite">
                <div className="mb-3">
                  <DropperDrip size="md" label="No challenge progress recorded yet" />
                </div>
                <p className="text-xs text-slate-400">
                  No recorded level results yet. Complete a challenge level to see your history.
                </p>
                <button
                  onClick={onGoToChallenge}
                  className="mt-4 px-5 py-2 rounded-xl glass-btn-cyan text-slate-950 font-bold text-xs"
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
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Recommendations
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl glass-card border border-cyan-950 hover:border-cyan-500/40 transition">
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

              <div className="p-4 rounded-2xl glass-card border border-cyan-950 hover:border-emerald-500/40 transition">
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

              <div className="p-4 rounded-2xl glass-card border border-cyan-950">
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
