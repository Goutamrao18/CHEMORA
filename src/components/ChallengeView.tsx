import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Question,
  ChallengeState,
  getInitialChallengeState,
  saveChallengeState,
  fetchLevelQuestions
} from '../data/challengeData';
import { recordStreakActivity } from '../data/streakManager';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, Flame, Clock, Award, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { fireConfetti } from '../utils/confetti';
import { playBubblePop, playSuccessChime, playWrongTap, playSoftClick } from '../utils/soundEffects';
import { LiquidLoaderScreen } from './ui/LiquidLoader';

interface ChallengeViewProps {
  onAskAI?: (topic: string) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({ onAskAI }) => {
  const [state, setState] = useState<ChallengeState>(getInitialChallengeState);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);
  
  // Quiz run stats
  const [streak, setStreak] = useState(0);
  const [levelCorrect, setLevelCorrect] = useState(0);
  const [levelWrong, setLevelWrong] = useState(0);
  const [levelXpGained, setLevelXpGained] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isLevelFinished, setIsLevelFinished] = useState(false);
  const [unlockedReward, setUnlockedReward] = useState<{ title: string; desc: string; xp: number } | null>(null);
  
  // Chemistry Feedback States (Item 6)
  const [isShaking, setIsShaking] = useState(false);
  const [showBubbleBurst, setShowBubbleBurst] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Sync state to localStorage
  const updateState = useCallback((updater: (prev: ChallengeState) => ChallengeState) => {
    setState((prev) => {
      const next = updater(prev);
      saveChallengeState(next);
      return next;
    });
  }, []);

  // Timer countdown
  useEffect(() => {
    if (activeLevel === null || isLevelFinished || hasChecked || unlockedReward) return;

    timerRef.current = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Time expired for question
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeLevel, currentIdx, hasChecked, isLevelFinished, unlockedReward]);

  const handleTimeExpire = () => {
    if (hasChecked) return;
    setHasChecked(true);
    setStreak(0);
    setLevelWrong((w) => w + 1);
  };

  // Keyboard shortcut 1-4
  useEffect(() => {
    if (activeLevel === null || isLevelFinished || hasChecked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        if (questions[currentIdx] && questions[currentIdx].options[idx]) {
          setSelectedAnswer(idx);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLevel, currentIdx, questions, hasChecked, isLevelFinished]);

  const startLevel = async (level: number) => {
    setLevelError(null);
    setLoadingQuestions(true);
    const qs = await fetchLevelQuestions(level);
    setLoadingQuestions(false);

    if (!qs.length) {
      setLevelError(`Could not load questions for level ${level}. Please try another level or check your connection.`);
      return;
    }

    setQuestions(qs);
    setActiveLevel(level);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setHasChecked(false);
    setStreak(0);
    setLevelCorrect(0);
    setLevelWrong(0);
    setLevelXpGained(0);
    setTimer(30);
    setIsLevelFinished(false);
    setUnlockedReward(null);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null || hasChecked) return;

    const currentQ = questions[currentIdx];
    if (!currentQ) return;
    const isCorrect = selectedAnswer === currentQ.answer;
    setHasChecked(true);

    if (isCorrect) {
      const bonusXp = currentQ.points || 100;
      setLevelCorrect((c) => c + 1);
      setLevelXpGained((x) => x + bonusXp);
      setStreak((s) => s + 1);
      setShowBubbleBurst(true);
      playBubblePop();
      playSuccessChime();
      setTimeout(() => setShowBubbleBurst(false), 850);

      // Light confetti on streak milestones
      if ((streak + 1) % 3 === 0) {
        try { fireConfetti({ particleCount: 40, spread: 65, origin: { y: 0.65 } }); } catch {}
      }
    } else {
      setLevelWrong((w) => w + 1);
      setStreak(0);
      setIsShaking(true);
      playWrongTap();
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNextQuestion = () => {
    playSoftClick();
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasChecked(false);
      setTimer(30);
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    setIsLevelFinished(true);
    const levelNum = activeLevel!;
    const finalCorrect = levelCorrect + (hasChecked && selectedAnswer === questions[currentIdx]?.answer ? 0 : 0);
    const totalQ = questions.length;
    const passed = finalCorrect >= Math.ceil(totalQ * 0.6); // 60% passing requirement

    try {
      fireConfetti({
        particleCount: passed ? 120 : 45,
        spread: passed ? 90 : 60,
        origin: { y: 0.55 },
        colors: ['#14a3c4', '#38bdf8', '#34d399', '#f59e0b', '#04212b']
      });
    } catch {}
    if (passed) {
      playSuccessChime();
    }
    recordStreakActivity();

    updateState((prev) => {
      const alreadyCleared = prev.levels.includes(levelNum);
      const newLevels = passed && !alreadyCleared ? [...prev.levels, levelNum].sort((a, b) => a - b) : prev.levels;
      
      const prevResult = prev.levelResults[String(levelNum)];
      const bestCorrect = Math.max(prevResult?.correct || 0, finalCorrect);

      const nextResults = {
        ...prev.levelResults,
        [String(levelNum)]: {
          correct: bestCorrect,
          wrong: totalQ - bestCorrect,
          xp: Math.max(prevResult?.xp || 0, levelXpGained),
          earnedAt: Date.now()
        }
      };

      // Milestone rewards
      let milestone: { title: string; desc: string; xp: number } | null = null;
      const rewards = [...prev.rewards];
      if (newLevels.length >= 1 && !rewards.includes('first_step')) {
        rewards.push('first_step');
        milestone = { title: "First Reaction", desc: "Completed your first CHEMORA challenge level!", xp: 150 };
      } else if (newLevels.length >= 5 && !rewards.includes('apprentice')) {
        rewards.push('apprentice');
        milestone = { title: "Junior Alchemist", desc: "Cleared 5 progressive challenge levels!", xp: 300 };
      } else if (newLevels.length >= 25 && !rewards.includes('chemist')) {
        rewards.push('chemist');
        milestone = { title: "Senior Chemist", desc: "Quarter-century mastery: 25 levels conquered!", xp: 1000 };
      } else if (newLevels.length >= 100 && !rewards.includes('master')) {
        rewards.push('master');
        milestone = { title: "CHEMORA Grandmaster", desc: "All 100 challenge levels conquered!", xp: 5000 };
      }

      if (milestone) {
        setUnlockedReward(milestone);
      }

      return {
        ...prev,
        levels: newLevels,
        xp: prev.xp + levelXpGained + (milestone ? milestone.xp : 0),
        answers: prev.answers + totalQ,
        correct: prev.correct + finalCorrect,
        levelResults: nextResults,
        rewards
      };
    });
  };

  const handleSkipQuestion = () => {
    if (hasChecked) {
      handleNextQuestion();
      return;
    }
    setHasChecked(true);
    setLevelWrong((w) => w + 1);
    setStreak(0);
  };

  // 1. Loading State
  if (loadingQuestions) {
    return (
      <LiquidLoaderScreen
        label="Loading Challenge Questions"
        subtitle="Fetching curriculum materials from level vault..."
        className="min-h-[500px]"
      />
    );
  }

  // 2. Active Quiz Screen
  if (activeLevel !== null && !isLevelFinished) {
    const currentQ = questions[currentIdx];
    if (!currentQ) return null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveLevel(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#121929] border border-cyan-950 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Levels
          </button>
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
              LEVEL {activeLevel}
            </span>
            <strong className="text-sm text-white font-bold">
              QUESTION {currentIdx + 1} / {questions.length}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 text-xs font-bold">
            <span>+{levelXpGained} XP</span>
          </div>
        </div>

        {/* Liquid-Fill Meniscus Wave Progress Track (Item 6) */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/80 mb-1.5 px-0.5">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px]">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Reaction Progress
            </span>
            <span className="font-bold text-cyan-300">
              {Math.round(((currentIdx + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="relative w-full h-3.5 rounded-full bg-[#040e1d] border border-cyan-800/60 overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
            {/* Lab graduated tick marks */}
            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none z-10 opacity-30">
              <div className="w-px h-full bg-white/40" />
              <div className="w-px h-full bg-white/40" />
              <div className="w-px h-full bg-white/40" />
              <div className="w-px h-full bg-white/40" />
            </div>

            {/* Liquid fill */}
            <div
              className="relative h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-teal-300 transition-all duration-500 rounded-full overflow-hidden shadow-[0_0_12px_rgba(20,163,196,0.6)]"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            >
              {/* Liquid meniscus wave highlight */}
              <div className="absolute inset-0 liquid-wave-layer opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 to-transparent" />
              {/* Surface meniscus shine */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/70" />
            </div>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#131c2d] border border-cyan-950 text-cyan-300 font-medium">
              {currentQ.topic || 'General Chemistry'}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#131c2d] border border-cyan-950 text-slate-400 font-medium">
              {currentQ.difficulty}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold anim-flame-pulse shadow-sm shadow-amber-500/30">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-300" />
                {streak} streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#121929] border border-cyan-900/50 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className={timer <= 5 ? 'text-red-400 font-bold' : ''}>{timer}s</span>
          </div>
        </div>

        {/* Question Card with Chemistry Bubble Burst & Shake */}
        <div className={`chemora-card p-5 sm:p-8 shadow-2xl mb-6 relative overflow-hidden transition-all duration-300 ${
          isShaking ? 'anim-shake ring-2 ring-rose-500/60 shadow-rose-950/50' : ''
        }`}>
          {/* Chemical Bubble Burst particles on correct answer */}
          {showBubbleBurst && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
              <div className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/80 animate-ping opacity-75" />
              <div className="absolute w-44 h-44 rounded-full border border-teal-300/60 animate-ping opacity-50 animation-delay-150" />
              {[
                { x: 30, y: -45, s: 12 },
                { x: -45, y: -35, s: 16 },
                { x: 50, y: 25, s: 10 },
                { x: -35, y: 40, s: 14 },
                { x: 0, y: -60, s: 18 },
                { x: -55, y: -10, s: 12 },
                { x: 45, y: -20, s: 14 },
                { x: -20, y: -50, s: 10 }
              ].map((b, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-gradient-to-tr from-cyan-400 to-teal-200 anim-bubble-pop shadow-[0_0_10px_#14a3c4]"
                  style={{
                    width: `${b.s}px`,
                    height: `${b.s}px`,
                    ['--tx' as string]: `${b.x * 1.5}px`,
                    ['--ty' as string]: `${b.y * 1.5}px`,
                    animationDelay: `${i * 35}ms`
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold">
              {String(currentIdx + 1).padStart(2, '0')}
            </span>
            <span>SELECT ONE ANSWER</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectAnswer = currentQ.answer === idx;

              let btnClass = 'bg-[#121b2d] border-cyan-950/80 text-slate-200 hover:bg-[#18233a] hover:border-cyan-800';
              if (hasChecked) {
                if (isCorrectAnswer) {
                  btnClass = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 shadow-sm shadow-emerald-500/20';
                } else if (isSelected && !isCorrectAnswer) {
                  btnClass = 'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-sm shadow-rose-500/20';
                } else {
                  btnClass = 'bg-[#0f1726] border-slate-800 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                btnClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-500/20';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !hasChecked && setSelectedAnswer(idx)}
                  disabled={hasChecked}
                  className={`w-full min-h-[54px] text-left px-4 py-3.5 rounded-2xl border font-medium text-sm sm:text-base flex items-center justify-between transition-all active:scale-[0.98] select-none ${btnClass}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-7 h-7 rounded-lg bg-[#0a0f18] text-xs font-mono flex items-center justify-center font-bold text-cyan-400 border border-white/5 flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>
                  {hasChecked && (
                    <div className="flex-shrink-0 ml-2">
                      {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Explanation */}
          {hasChecked && (
            <div className={`mt-6 p-4 rounded-xl border text-sm leading-relaxed ${
              selectedAnswer === currentQ.answer
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              <div className="font-bold mb-1 flex items-center gap-2">
                {selectedAnswer === currentQ.answer ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Correct! +{currentQ.points || 100} XP
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Incorrect
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300">{currentQ.explanation}</p>
            </div>
          )}

          {/* Actions (Desktop/Tablet Card Footer) */}
          <div className="hidden sm:flex items-center justify-between mt-8 pt-4 border-t border-cyan-950">
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#121b2d] hover:bg-[#18233a] border border-cyan-950 text-xs font-bold text-slate-400 active:scale-[0.97] transition"
            >
              {hasChecked ? 'Next →' : 'Skip'}
            </button>
            {!hasChecked ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={selectedAnswer === null}
                className="min-h-[44px] px-7 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase active:scale-[0.97] transition shadow-md shadow-cyan-500/30"
              >
                Check answer →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="min-h-[44px] px-7 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase active:scale-[0.97] transition shadow-md shadow-cyan-500/30"
              >
                {currentIdx + 1 === questions.length ? 'View Results →' : 'Next Question →'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sticky Action Bar in Thumb Zone (Phones < 640px) */}
        <div className="sm:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom,12px))] left-3 right-3 z-30 bg-[#061022]/95 border border-cyan-500/50 rounded-2xl p-2 shadow-[0_-8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center gap-2">
          <button
            type="button"
            onClick={handleSkipQuestion}
            className="min-h-[46px] min-w-[72px] px-3 rounded-xl bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider active:scale-[0.96] transition flex items-center justify-center"
          >
            {hasChecked ? 'Next' : 'Skip'}
          </button>
          {!hasChecked ? (
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={selectedAnswer === null}
              className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 disabled:opacity-35 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-[0.96] transition shadow-md shadow-cyan-500/30 flex items-center justify-center gap-1.5"
            >
              <span>Check Answer</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-[0.96] transition shadow-md shadow-cyan-500/30 flex items-center justify-center gap-1.5"
            >
              <span>{currentIdx + 1 === questions.length ? 'View Results' : 'Next Question'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Level Finished Summary Screen
  if (activeLevel !== null && isLevelFinished) {
    const totalQ = questions.length;
    const accuracy = Math.round((levelCorrect / totalQ) * 100);
    const passed = levelCorrect >= Math.ceil(totalQ * 0.6);

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0e1626] border border-cyan-900/60 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center text-3xl font-black mb-4">
            {passed ? '🏆' : '🧪'}
          </div>

          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            {passed ? 'LEVEL MASTERED' : 'PRACTICE COMPLETE'}
          </span>
          <h2 className="text-3xl font-black text-white mt-2 mb-2">
            Level {activeLevel} Results
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            {passed
              ? "Brilliant work! You've met the accuracy threshold to advance in the CHEMORA curriculum."
              : "Good effort! Review the core explanations and try again to unlock your mastery star."}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-[#121c2e] p-3.5 rounded-xl border border-cyan-950">
              <span className="text-xs text-slate-400 block mb-1">Score</span>
              <strong className="text-xl font-bold text-white">{levelCorrect} / {totalQ}</strong>
            </div>
            <div className="bg-[#121c2e] p-3.5 rounded-xl border border-cyan-950">
              <span className="text-xs text-slate-400 block mb-1">Accuracy</span>
              <strong className="text-xl font-bold text-cyan-400">{accuracy}%</strong>
            </div>
            <div className="bg-[#121c2e] p-3.5 rounded-xl border border-cyan-950">
              <span className="text-xs text-slate-400 block mb-1">XP Gained</span>
              <strong className="text-xl font-bold text-emerald-400">+{levelXpGained}</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => startLevel(activeLevel)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#121c2e] hover:bg-[#18253e] border border-cyan-950 text-xs font-bold text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Level
            </button>
            {passed && activeLevel < 100 && (
              <button
                onClick={() => startLevel(activeLevel + 1)}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold tracking-wider uppercase transition shadow-md shadow-cyan-500/30"
              >
                Next Level {activeLevel + 1} →
              </button>
            )}
            <button
              onClick={() => setActiveLevel(null)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              Back to Arena
            </button>
          </div>
        </div>

        {/* Milestone Unlocked Modal */}
        {unlockedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0e1626] border border-amber-500/60 rounded-3xl p-8 max-w-sm text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 mx-auto flex items-center justify-center text-3xl mb-4 animate-bounce">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                MILESTONE UNLOCKED
              </span>
              <h3 className="text-2xl font-black text-white mt-1 mb-2">{unlockedReward.title}</h3>
              <p className="text-xs text-slate-300 mb-6">{unlockedReward.desc}</p>
              <div className="inline-block px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm mb-6">
                +{unlockedReward.xp} XP BONUS
              </div>
              <button
                onClick={() => setUnlockedReward(null)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
              >
                Continue Learning
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Main Arena Level Grid Screen
  const completedCount = state.levels.length;
  const accuracyOverall = state.answers ? Math.round((state.correct / state.answers) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero row */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          CHEMISTRY TRAINING ARENA
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 mb-3">
          CHEMORA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">CHALLENGE</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base">
          100 progressive levels · 1,000 curriculum-aligned questions · 10 questions per level
        </p>
      </div>

      {/* Error notification banner */}
      {levelError && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg anim-slide-down">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{levelError}</span>
          </div>
          <button
            onClick={() => setLevelError(null)}
            className="p-1 hover:text-white transition text-rose-400 font-mono text-sm"
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl">
            🏆
          </div>
          <div>
            <strong className="block text-2xl font-black text-white">{completedCount} / 100</strong>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">LEVELS COMPLETED</span>
          </div>
        </div>

        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
            ✓
          </div>
          <div>
            <strong className="block text-2xl font-black text-white">{state.answers}</strong>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">QUESTIONS ANSWERED</span>
          </div>
        </div>

        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl">
            ⚡
          </div>
          <div>
            <strong className="block text-2xl font-black text-amber-300">{state.xp.toLocaleString()}</strong>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">TOTAL XP EARNED</span>
          </div>
        </div>

        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl">
            🎯
          </div>
          <div>
            <strong className="block text-2xl font-black text-purple-300">{accuracyOverall}%</strong>
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">OVERALL ACCURACY</span>
          </div>
        </div>
      </div>

      {/* Level Selection Grid */}
      <div className="chemora-card p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-950/80">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
              YOUR JOURNEY
            </span>
            <h2 className="text-xl font-bold text-white">Choose a Challenge Level</h2>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/40">
            {completedCount} / 100 Cleared
          </span>
        </div>

        {/* 100-Level Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((lvl) => {
            const isCompleted = state.levels.includes(lvl);
            const isUnlocked = lvl === 1 || state.levels.includes(lvl - 1) || isCompleted;
            const res = state.levelResults[String(lvl)];

            let bg = 'bg-[#101726]/50 border-cyan-950/60 text-slate-500 opacity-60';
            if (isCompleted) {
              bg = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/10';
            } else if (isUnlocked) {
              bg = 'bg-[#121c2e] border-cyan-800/60 text-cyan-200 hover:border-cyan-400 hover:bg-[#18253e] hover:scale-105';
            }

            return (
              <button
                key={lvl}
                onClick={() => isUnlocked && startLevel(lvl)}
                disabled={!isUnlocked}
                className={`aspect-square min-h-[44px] min-w-[44px] rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all duration-200 group relative active:scale-95 ${bg}`}
              >
                <span className="text-xs font-mono font-bold">{lvl}</span>
                {isCompleted ? (
                  <span className="text-[9px] text-emerald-400 font-bold mt-0.5">
                    {res?.correct || 10}/10
                  </span>
                ) : !isUnlocked ? (
                  <span className="text-[9px] text-slate-600">🔒</span>
                ) : (
                  <span className="text-[9px] text-cyan-400/80 group-hover:text-cyan-300">Start</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
