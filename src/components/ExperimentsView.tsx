import React, { useState, useEffect, useRef } from 'react';
import { EXPERIMENTS, Experiment } from '../data/experimentsData';
import { recordStreakActivity } from '../data/streakManager';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle2,
  AlertTriangle,
  X,
  Shield,
  Sparkles,
  Filter,
  Beaker,
  Check,
  FastForward,
  Rewind
} from 'lucide-react';
import { fireConfetti } from '../utils/confetti';
import { hasVideoAsset, videoUrl } from '../utils/videoUrl';
import { BeakerFill, Skeleton } from './Loaders';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { playSoftClick, playSuccessChime } from '../utils/soundEffects';

interface ExperimentsViewProps {
  onAskAI?: (topic: string) => void;
}

const STORAGE_KEY = 'chemoraExperimentProgress';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
  const [mediaLoadFailed, setMediaLoadFailed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const showBuffering = useDelayedLoading(isBuffering, { delay: 200, minDuration: 400 });

  // Custom Video Player Controls (Item 7)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<number | null>(null);

  // Mobile Bottom Sheet Drag-to-Dismiss State
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartY = useRef<number>(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!isSheetDragging) return;
    const delta = e.touches[0].clientY - sheetTouchStartY.current;
    if (delta > 0) {
      setSheetDragY(delta);
    } else {
      setSheetDragY(0);
    }
  };

  const handleSheetTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 80) {
      setSelectedExperiment(null);
    }
    setSheetDragY(0);
  };

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
        try { fireConfetti({ particleCount: 50, spread: 70, origin: { y: 0.65 } }); } catch {}
        playSuccessChime();
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
    setMediaLoadFailed(false);
    setIsBuffering(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Restore saved step checklist for this practical
    try {
      const savedSteps = localStorage.getItem(`chemora_steps_${exp.id}`);
      setCompletedSteps(savedSteps ? JSON.parse(savedSteps) : {});
    } catch {
      setCompletedSteps({});
    }
  };

  // Keyboard shortcuts for video (Space: Play/Pause, Left/Right: Seek 5s, M: Mute, F: Fullscreen)
  useEffect(() => {
    if (!selectedExperiment) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        setSelectedExperiment(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedExperiment, isPlaying, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta));
    setCurrentTime(videoRef.current.currentTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current || !selectedExperiment) return;
    setDuration(videoRef.current.duration || 0);

    // Restore persistent playback position
    try {
      const savedPos = localStorage.getItem(`chemora_playback_${selectedExperiment.id}`);
      if (savedPos) {
        const time = parseFloat(savedPos);
        if (time > 0 && time < (videoRef.current.duration - 2)) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      }
    } catch {}
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !selectedExperiment) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    try {
      localStorage.setItem(`chemora_playback_${selectedExperiment.id}`, time.toString());
    } catch {}
  };

  const toggleStep = (idx: number) => {
    playSoftClick();
    if (!selectedExperiment) return;
    setCompletedSteps((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      try {
        localStorage.setItem(`chemora_steps_${selectedExperiment.id}`, JSON.stringify(next));
      } catch {}

      // If all steps now completed, celebrate
      const allDone = selectedExperiment.steps.every((_, i) => (i === idx ? !prev[idx] : prev[i]));
      if (allDone) {
        playSuccessChime();
        try { fireConfetti({ particleCount: 60, spread: 75, origin: { y: 0.6 } }); } catch {}
      }
      return next;
    });
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
              type="button"
              onClick={() => setActiveLevel(lvl)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition active:scale-[0.96] ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 chemora-stagger">
        {filteredExperiments.map((exp) => {
          const isDone = completedIds.includes(exp.id);

          return (
            <article
              key={exp.id}
              onClick={() => openExperiment(exp)}
              className={`chemora-card content-visibility-auto cursor-pointer p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/20'
                  : 'hover:border-cyan-500/40 shadow-cyan-950/40'
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

      {/* Practical Details Modal / Mobile Bottom Sheet */}
      {selectedExperiment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedExperiment.title}
          onClick={() => setSelectedExperiment(null)}
          className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: sheetDragY > 0 ? `translate3d(0, ${sheetDragY}px, 0)` : undefined,
              transition: isSheetDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative w-full md:max-w-4xl bg-[#0d1524] border-t md:border border-cyan-800/70 rounded-t-[28px] md:rounded-3xl overflow-hidden shadow-2xl max-h-[92dvh] md:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom,16px)] md:pb-0"
          >
            {/* Mobile Drag Handle Bar */}
            <div
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none md:hidden bg-[#090f1a]"
              aria-label="Drag down to dismiss practical details"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-500/80 active:bg-cyan-400 transition-colors" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-cyan-950 bg-[#090f1a] flex-shrink-0">
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
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Video & Scientific Theory (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Video Player with Custom Minimal Controls (Item 7) */}
                  {hasVideoAsset(selectedExperiment.id) && (
                    <div
                      ref={videoContainerRef}
                      className="group relative rounded-2xl overflow-hidden bg-black border border-cyan-950 aspect-video shadow-2xl flex flex-col justify-end"
                      onMouseEnter={() => setShowControls(true)}
                      onMouseMove={() => {
                        setShowControls(true);
                        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
                        hideControlsTimer.current = window.setTimeout(() => {
                          if (isPlaying) setShowControls(false);
                        }, 2500);
                      }}
                      onMouseLeave={() => {
                        if (isPlaying) setShowControls(false);
                      }}
                    >
                      <Skeleton variant="video" className="absolute inset-0 w-full h-full pointer-events-none z-0" />

                      {showBuffering && !mediaLoadFailed && (
                        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none anim-fade-in z-20" role="status" aria-live="polite">
                          <BeakerFill size="lg" label="Buffering experiment video..." />
                          <span className="text-xs font-mono font-bold text-cyan-300">Buffering experiment...</span>
                        </div>
                      )}

                      {mediaLoadFailed ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-[#090f1a] relative z-10">
                          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                          <p className="text-sm font-semibold text-slate-200">Demonstration Video Unavailable</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            Please review the experimental procedure and chemical observations below.
                          </p>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            key={selectedExperiment.id}
                            playsInline
                            preload="metadata"
                            poster={videoUrl(selectedExperiment.id, 'poster')}
                            className="w-full h-full object-contain cursor-pointer relative z-10"
                            style={{ aspectRatio: '16 / 9' }}
                            onClick={togglePlay}
                            onWaiting={() => setIsBuffering(true)}
                            onSeeking={() => setIsBuffering(true)}
                            onPlaying={() => {
                              setIsBuffering(false);
                              setIsPlaying(true);
                            }}
                            onPause={() => setIsPlaying(false)}
                            onCanPlay={() => setIsBuffering(false)}
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onError={() => {
                              setIsBuffering(false);
                              setMediaLoadFailed(true);
                            }}
                          >
                            <source src={videoUrl(selectedExperiment.id, 'webm')} type="video/webm" />
                            <source
                              src={videoUrl(selectedExperiment.id, 'mp4')}
                              type="video/mp4"
                              onError={() => {
                                setIsBuffering(false);
                                setMediaLoadFailed(true);
                              }}
                            />
                          </video>

                          {/* Center Play Button Overlay when paused */}
                          {!isPlaying && (
                            <div
                              onClick={togglePlay}
                              className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 cursor-pointer transition-opacity"
                            >
                              <div className="w-14 h-14 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 transition transform hover:scale-110">
                                <Play className="w-7 h-7 fill-slate-950 ml-1" />
                              </div>
                            </div>
                          )}

                          {/* Minimal Custom Control Bar */}
                          <div
                            className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 transition-opacity duration-200 ${
                              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            {/* Scrubber track */}
                            <div className="relative mb-2 flex items-center">
                              <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                step="any"
                                value={currentTime}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (videoRef.current) {
                                    videoRef.current.currentTime = val;
                                    setCurrentTime(val);
                                  }
                                }}
                                className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                              />
                            </div>

                            {/* Button actions row */}
                            <div className="flex items-center justify-between text-xs text-white">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                  onClick={togglePlay}
                                  className="p-1 rounded-md text-slate-200 hover:text-cyan-400 transition"
                                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                                >
                                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                                </button>
                                <button
                                  onClick={() => seekRelative(-5)}
                                  className="p-1 rounded-md text-slate-300 hover:text-white transition"
                                  title="Rewind 5s (←)"
                                >
                                  <Rewind className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => seekRelative(5)}
                                  className="p-1 rounded-md text-slate-300 hover:text-white transition"
                                  title="Forward 5s (→)"
                                >
                                  <FastForward className="w-3.5 h-3.5" />
                                </button>

                                <span className="font-mono text-[11px] text-slate-300 pl-1">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={toggleMute}
                                  className="p-1 rounded-md text-slate-300 hover:text-cyan-400 transition"
                                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                                >
                                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={toggleFullscreen}
                                  className="p-1 rounded-md text-slate-300 hover:text-cyan-400 transition"
                                  title="Fullscreen (F)"
                                >
                                  <Maximize className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Keyboard Shortcuts Hint Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#090f1a] border border-cyan-950 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span>⌨</span> Player Shortcuts
                    </span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-[#10192a] border border-cyan-900/60 text-slate-300">Space</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#10192a] border border-cyan-900/60 text-slate-300">← / → 5s</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#10192a] border border-cyan-900/60 text-slate-300">M (mute)</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#10192a] border border-cyan-900/60 text-slate-300">F (full)</span>
                    </div>
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

                  {/* Balanced Chemical Equation */}
                  <div className="p-4 rounded-xl bg-[#111c2e] border border-cyan-900/60">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                      Balanced Chemical Equation
                    </span>
                    <div className="text-sm sm:text-base font-bold font-mono text-cyan-200 bg-[#090f1a] p-3 rounded-lg border border-cyan-950 overflow-x-auto">
                      {selectedExperiment.equation}
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

                  {/* Observations & Conclusion */}
                  <div className="p-4 rounded-xl bg-[#090f1a] border border-cyan-950 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
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
                    <div className="pt-2 border-t border-cyan-950">
                      <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        Conclusion
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedExperiment.conclusion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sticky Step Checklist with Progress Ring (Item 7) */}
                <div className="lg:col-span-5 lg:sticky lg:top-0 space-y-4">
                  {(() => {
                    const totalSteps = selectedExperiment.steps.length;
                    const checkedCount = selectedExperiment.steps.filter((_, i) => Boolean(completedSteps[i])).length;
                    const pct = totalSteps > 0 ? Math.round((checkedCount / totalSteps) * 100) : 0;
                    const radius = 30;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (pct / 100) * circumference;

                    return (
                      <div className="p-5 rounded-2xl bg-[#0b1322] border border-cyan-900/60 shadow-xl">
                        {/* Progress Ring Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-cyan-950">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                              INVESTIGATION CHECKLIST
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">
                              Lab Procedure
                            </h3>
                            <p className="text-xs text-slate-400">
                              {checkedCount} of {totalSteps} steps completed
                            </p>
                          </div>

                          {/* Pure SVG Progress Ring */}
                          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 72 72">
                              <circle
                                cx="36"
                                cy="36"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                className="text-slate-800"
                              />
                              <circle
                                cx="36"
                                cy="36"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="5"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                className={`transition-all duration-500 ${
                                  pct === 100 ? 'text-emerald-400' : 'text-cyan-400'
                                }`}
                              />
                            </svg>
                            <span className="absolute font-mono text-xs font-bold text-white">
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Interactive Steps List */}
                        <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-1">
                          {selectedExperiment.steps.map((step, idx) => {
                            const isChecked = Boolean(completedSteps[idx]);
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleStep(idx)}
                                className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                  isChecked
                                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-sm'
                                    : 'bg-[#090f1a] border-cyan-950 text-slate-200 hover:border-cyan-800 hover:bg-[#0e1628]'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 transition-colors ${
                                  isChecked ? 'bg-emerald-500 text-slate-950' : 'bg-[#121c2d] text-cyan-400'
                                }`}>
                                  {isChecked ? '✓' : idx + 1}
                                </span>
                                <span className={`text-xs leading-relaxed ${isChecked ? 'line-through opacity-70' : ''}`}>
                                  {step}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick action buttons for checklist */}
                        <div className="mt-4 pt-3 border-t border-cyan-950 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => {
                              playSoftClick();
                              const allDone: Record<number, boolean> = {};
                              selectedExperiment.steps.forEach((_, i) => { allDone[i] = true; });
                              setCompletedSteps(allDone);
                              try {
                                localStorage.setItem(`chemora_steps_${selectedExperiment.id}`, JSON.stringify(allDone));
                              } catch {}
                              playSuccessChime();
                              try { fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch {}
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            Mark All Done
                          </button>
                          <button
                            onClick={() => {
                              playSoftClick();
                              setCompletedSteps({});
                              try {
                                localStorage.removeItem(`chemora_steps_${selectedExperiment.id}`);
                              } catch {}
                            }}
                            className="text-slate-400 hover:text-rose-400 transition"
                          >
                            Reset Checklist
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
