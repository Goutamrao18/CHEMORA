import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab } from './Navbar';
import {
  Sparkles,
  BookOpen,
  Trophy,
  Compass,
  Beaker,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
  CheckCircle2,
  Play
} from 'lucide-react';
import { videoUrl, localVideoUrl } from '../utils/videoUrl';
import { Skeleton } from './Loaders/Skeleton';
import { LiquidButton } from './ui/LiquidButton';

interface HomeViewProps {
  onSelectTab: (tab: ActiveTab) => void;
}

// Animated Stat Counter with IntersectionObserver (Item 4)
function AnimatedCounter({
  end,
  duration = 1200,
  suffix = '',
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const frame = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const current = Math.floor(progress * (2 - progress) * end);
            setVal(current);
            if (progress < 1) {
              requestAnimationFrame(frame);
            } else {
              setVal(end);
            }
          };
          requestAnimationFrame(frame);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTab }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroFallback, setHeroFallback] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Foreground parallax mouse tracking (Item 3)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const heroCardRef = useRef<HTMLDivElement>(null);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroCardRef.current) return;
    const rect = heroCardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setParallaxOffset({ x: x * 14, y: y * 14 });
  };

  const handleHeroMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  // Video visibility optimizer: pauses when scrolled offscreen
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !document.hidden) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else if (isVisible) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const faqs = [
    {
      q: 'What is CHEMORA?',
      a: 'CHEMORA is a comprehensive chemistry learning platform combining an interactive 134-item knowledge library, guided practical experiments with video explainers, 100 progressive challenges, and an AI chemistry tutor.',
    },
    {
      q: 'Can I track my learning progress?',
      a: 'Yes! Challenge results, completed practical experiments, earned XP, accuracy metrics, and strengths across topics are automatically saved in your browser and account.',
    },
    {
      q: 'Does CHEMORA replace a real laboratory?',
      a: 'No. The virtual simulation and interactive activities are designed for safe learning, exploration, and pre-lab preparation. Always follow institution and laboratory safety protocols when conducting physical experiments.',
    },
    {
      q: 'How does CHEMORA AI work?',
      a: 'CHEMORA AI provides instant, intelligent chemistry guidance, balancing equations, safety warnings, and contextual explanations for questions across organic, inorganic, and physical chemistry.',
    },
    {
      q: 'Is an account required?',
      a: 'All learning materials, practicals, and challenge levels are completely open without signing in. Creating a profile allows you to customize learning preferences and maintain your researcher rank.',
    },
  ];

  return (
    <div className="text-slate-100 pb-16 space-y-16">
      {/* =========================================================================
          HERO CARD (Item 3)
          - Video Background preserved
          - Staggered line-by-line reveal
          - Stronger scrim for high contrast
          - Sliding underline on primary CTA
          - Subtle parallax on foreground content only
          ========================================================================= */}
      <section
        ref={heroCardRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative rounded-[28px] sm:rounded-[34px] overflow-hidden border border-cyan-500/35 bg-[#030d1d] shadow-[0_30px_90px_rgba(0,0,0,0.65)] min-h-[360px] sm:min-h-[530px] lg:min-h-[570px] flex items-center p-6 py-9 sm:p-12 lg:p-16 transition-shadow duration-300"
      >
        {/* Top Specular Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none z-30" />

        {/* Video Background - Landscape-calibrated on Mobile & Desktop */}
        <div className="absolute inset-x-0 top-0 h-[260px] xs:h-[300px] sm:inset-0 sm:h-full z-0 overflow-hidden pointer-events-none">
          <Skeleton variant="video" className="absolute inset-0 w-full h-full opacity-20" />
          <video
            ref={heroVideoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={heroFallback ? localVideoUrl('chemora-intro-poster.webp') : videoUrl('chemora-intro', 'poster')}
            className="w-full h-full object-cover object-center transform-gpu opacity-75 scale-105"
            onError={() => {
              if (!heroFallback) setHeroFallback(true);
            }}
          >
            <source
              src={heroFallback ? localVideoUrl('chemora-intro.webm') : videoUrl('chemora-intro', 'webm')}
              type="video/webm"
            />
            <source
              src={heroFallback ? localVideoUrl('chemora-intro.mp4') : videoUrl('chemora-intro', 'mp4')}
              type="video/mp4"
              onError={() => {
                if (!heroFallback) setHeroFallback(true);
              }}
            />
          </video>
          {/* Mobile Bottom Fade: seamless blend of landscape video into the dark hero card surface */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#030d1d] via-[#030d1d]/85 to-transparent sm:hidden pointer-events-none" />
        </div>

        {/* Enhanced High-Contrast Scrim Gradient Overlays for Phone & Desktop */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#020816]/95 via-[#020918]/80 sm:from-[#020816]/95 sm:via-[#020918]/85 to-[#020814]/50" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#020816]/95 via-[#020816]/35 to-[#020816]/70 sm:from-[#020816]/90 sm:via-transparent sm:to-[#020816]/60" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_25%_45%,rgba(20,163,196,0.3),transparent_70%)]" />

        {/* Foreground Content with Subtle Mouse Parallax & Staggered Reveal */}
        <div
          style={{
            transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
            transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative z-20 max-w-xl text-left will-change-transform w-full"
        >
          {/* Line 1: Eyebrow Metadata (Unboxed text with bullet separators per constitution) */}
          <div className="hero-reveal-line-1 flex items-center gap-2 mb-3 text-xs font-mono font-semibold tracking-wider text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>LEARN</span>
            <span className="text-cyan-500/60">·</span>
            <span>EXPERIMENT</span>
            <span className="text-cyan-500/60">·</span>
            <span>REACT</span>
          </div>

          {/* Line 2: Headline with Unbroken Brand Title & Fluid Clamp Typography */}
          <h1 className="hero-reveal-line-2 text-[clamp(2.1rem,7.5vw,4.5rem)] font-black text-white leading-[1.08] tracking-tight mb-2">
            Welcome to{' '}
            <span
              style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                wordBreak: 'keep-all',
              }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#b77bff] via-[#7fdcef] to-[#14a3c4] drop-shadow-[0_0_35px_rgba(20,163,196,0.4)]"
            >
              CHEMORA
            </span>
          </h1>

          {/* Line 3: Subtitle */}
          <h2 className="hero-reveal-line-3 text-lg sm:text-2xl font-bold text-slate-200 mb-3 sm:mb-4 tracking-tight">
            Explore. Learn. Experiment. Create.
          </h2>

          {/* Line 4: Body and Stacked Phone Actions */}
          <div className="hero-reveal-line-4 space-y-6 sm:space-y-7">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
              Your comprehensive chemistry workspace with 134 apparatus &amp; chemicals, 20 guided practical experiments, 100 progressive challenges, and intelligent AI assistance.
            </p>

            {/* Actions: Full-Width Stacked CTA on Phone, Horizontal on Tablet/Desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
              <LiquidButton
                onClick={() => onSelectTab('know')}
                className="w-full sm:w-auto"
              >
                <span>Start Exploring</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </LiquidButton>
              <button
                type="button"
                onClick={() => onSelectTab('challenge')}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-full text-sm font-bold text-slate-200 bg-[#07162e]/90 border border-cyan-500/35 hover:border-purple-400/60 hover:text-white active:scale-[0.98] transition-all backdrop-blur-md flex items-center justify-center gap-2 shadow-sm"
              >
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>Take Challenge</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOME WORKSPACE BENTO GRID (Item 4)
          Asymmetric Bento Layout using exactly TWO card styles:
          - Style A: Primary Feature Bento (2-column span, interactive visual peek)
          - Style B: Compact Metric/Signal Bento (1-column span, animated counter)
          - Oversized numbered section indices (01, 02, 03, 04)
          ========================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-cyan-950/60">
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase">
              CHEMORA LAB MODULES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              Interactive Workspace Curriculum
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
            Curriculum-grounded modules spanning reagents, simulations, and laboratory certification.
          </p>
        </div>

        {/* 4-Item Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Style A (Primary Bento - 2 Columns) - Know Library */}
          <div
            onClick={() => onSelectTab('know')}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061830]/90 via-[#051428]/80 to-[#020b18]/90 border border-cyan-500/30 p-7 sm:p-8 flex flex-col justify-between hover:border-cyan-400/60 hover:shadow-[0_20px_60px_rgba(20,163,196,0.22)] transition-all duration-300 cursor-pointer"
          >
            {/* Oversized Numbered Section Index (Item 4) */}
            <span className="absolute right-6 top-3 text-7xl sm:text-8xl font-black font-mono text-cyan-400/10 select-none pointer-events-none group-hover:text-cyan-400/15 transition-colors">
              01
            </span>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                    KNOWLEDGE REPOSITORY
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                    Apparatus &amp; Chemical Library
                  </h3>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-xl mb-6">
                Master 134 precision instruments, glassware, and active chemical reagents. Complete with NFPA 704 hazard diamonds, formula breakdowns, and usage guidelines.
              </p>

              {/* Bento Content Preview Pills/Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091b33] border border-cyan-900/60">
                  <span className="text-cyan-400 font-black text-sm">
                    <AnimatedCounter end={134} suffix="+" />
                  </span>
                  <span className="text-slate-400">Items Cataloged</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091b33] border border-cyan-900/60">
                  <span className="text-emerald-400 font-black text-sm">NFPA 704</span>
                  <span className="text-slate-400">Safety Standards</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091b33] border border-cyan-900/60">
                  <span className="text-purple-400 font-black text-sm">Glossary</span>
                  <span className="text-slate-400">Chemistry Dictionary</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-cyan-900/40 pt-4">
              <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>Explore apparatus &amp; chemicals</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">Interactive Database</span>
            </div>
          </div>

          {/* Card 2: Style B (Compact Metric Bento - 1 Column) - Challenge Arena */}
          <div
            onClick={() => onSelectTab('challenge')}
            className="col-span-1 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1226]/90 via-[#070e1e]/85 to-[#040814]/90 border border-purple-500/30 p-7 sm:p-8 flex flex-col justify-between hover:border-purple-400/60 hover:shadow-[0_20px_60px_rgba(155,114,255,0.2)] transition-all duration-300 cursor-pointer"
          >
            {/* Oversized Numbered Section Index (Item 4) */}
            <span className="absolute right-6 top-3 text-7xl sm:text-8xl font-black font-mono text-purple-400/10 select-none pointer-events-none group-hover:text-purple-400/15 transition-colors">
              02
            </span>

            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5" />
              </div>

              <div className="text-[11px] font-mono text-purple-400 font-semibold tracking-wider uppercase mb-1">
                COMPETITIVE ARENA
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors mb-3">
                Chemistry Challenge
              </h3>

              {/* Animated Stat Counter */}
              <div className="my-4">
                <div className="text-4xl font-black font-mono text-white tracking-tight">
                  <AnimatedCounter end={100} />
                </div>
                <div className="text-xs font-mono text-purple-300/80 mt-1">
                  Progressive Curriculum Levels
                </div>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Test your mastery with 1,000 curriculum-aligned questions, streak multipliers, and instant answer explanations.
              </p>
            </div>

            <div className="mt-8 border-t border-purple-900/40 pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>Enter arena</span>
                <ChevronRight className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-purple-400">1,000+ Questions</span>
            </div>
          </div>

          {/* Card 3: Style B (Compact Metric Bento - 1 Column) - Progress Dashboard */}
          <div
            onClick={() => onSelectTab('progress')}
            className="col-span-1 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121624]/90 via-[#0d121c]/85 to-[#060912]/90 border border-amber-500/30 p-7 sm:p-8 flex flex-col justify-between hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(245,158,11,0.2)] transition-all duration-300 cursor-pointer"
          >
            {/* Oversized Numbered Section Index (Item 4) */}
            <span className="absolute right-6 top-3 text-7xl sm:text-8xl font-black font-mono text-amber-400/10 select-none pointer-events-none group-hover:text-amber-400/15 transition-colors">
              03
            </span>

            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>

              <div className="text-[11px] font-mono text-amber-400 font-semibold tracking-wider uppercase mb-1">
                RESEARCH METRICS
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors mb-3">
                Discipline Mastery
              </h3>

              {/* Animated Stat Counter */}
              <div className="my-4">
                <div className="text-4xl font-black font-mono text-white tracking-tight">
                  <AnimatedCounter end={4} suffix=" Disciplines" />
                </div>
                <div className="text-xs font-mono text-amber-300/80 mt-1">
                  Organic · Inorganic · Physical · Analytical
                </div>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Concentric pure-SVG progress rings, GitHub-style 52-week activity heatmap, and researcher milestone ranks.
              </p>
            </div>

            <div className="mt-8 border-t border-amber-900/40 pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>View analytics</span>
                <ChevronRight className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-amber-400">Activity Heatmap</span>
            </div>
          </div>

          {/* Card 4: Style A (Primary Bento - 2 Columns) - Guided Practicals */}
          <div
            onClick={() => onSelectTab('experiments')}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061c28]/90 via-[#041620]/80 to-[#020b12]/90 border border-emerald-500/30 p-7 sm:p-8 flex flex-col justify-between hover:border-emerald-400/60 hover:shadow-[0_20px_60px_rgba(70,226,176,0.22)] transition-all duration-300 cursor-pointer"
          >
            {/* Oversized Numbered Section Index (Item 4) */}
            <span className="absolute right-6 top-3 text-7xl sm:text-8xl font-black font-mono text-emerald-400/10 select-none pointer-events-none group-hover:text-emerald-400/15 transition-colors">
              04
            </span>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
                    PRACTICAL PROTOCOLS
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors">
                    Guided Laboratory Practicals
                  </h3>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-xl mb-6">
                Step-by-step chemical procedures for 20 essential experiments. Includes high-fidelity demonstration videos with custom keyboard controls, persistent playback, and interactive step completion rings.
              </p>

              {/* Bento Content Preview Pills/Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09221b] border border-emerald-900/60">
                  <span className="text-emerald-400 font-black text-sm">
                    <AnimatedCounter end={20} />
                  </span>
                  <span className="text-slate-400">Verified Practicals</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09221b] border border-emerald-900/60">
                  <span className="text-cyan-400 font-black text-sm">HD Video</span>
                  <span className="text-slate-400">Step Demonstrations</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09221b] border border-emerald-900/60">
                  <span className="text-amber-400 font-black text-sm">Safety</span>
                  <span className="text-slate-400">Hazchem Protocols</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-emerald-900/40 pt-4">
              <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>Start lab investigation</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono text-slate-400">Interactive Checklist</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="rounded-3xl bg-[#051124]/90 border border-cyan-900/50 p-6 sm:p-10 shadow-xl">
        <div className="mb-6">
          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.2em] uppercase">
            HELP &amp; INFORMATION
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#07162e]/80 border border-cyan-900/40 rounded-2xl overflow-hidden transition hover:border-cyan-500/40"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-100 hover:text-cyan-300 transition"
              >
                <span>{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-cyan-950/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 pb-4 border-t border-cyan-950/60 text-xs text-slate-400 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-bold text-cyan-400">⚗ CHEMORA</span>
            <span>•</span>
            <span className="tracking-wider text-[11px] font-mono text-cyan-300/80">TOUCH · MIX · REACT</span>
          </div>
          <div className="flex items-center flex-wrap justify-center gap-x-5 gap-y-2 text-slate-400">
            <button type="button" onClick={() => onSelectTab('know')} className="hover:text-cyan-300 transition-colors">Library</button>
            <button type="button" onClick={() => onSelectTab('challenge')} className="hover:text-cyan-300 transition-colors">Challenge</button>
            <button type="button" onClick={() => onSelectTab('experiments')} className="hover:text-cyan-300 transition-colors">Experiments</button>
            <a href="/privacy.html" className="hover:text-cyan-300 transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:text-cyan-300 transition-colors">Terms of Service</a>
            <a href="/cookie-policy.html" className="hover:text-cyan-300 transition-colors">Cookie Policy</a>
            <a href="mailto:support@chemora.work.gd" className="hover:text-cyan-300 transition-colors">Support</a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-cyan-950/40 text-[11px] text-slate-400 gap-2 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} CHEMORA Education &bull; Open Chemistry Simulation System</p>
          <p className="font-mono text-[10px] text-slate-400">Interactive chemistry learning platform &bull; No marketing trackers &bull; 100% Free</p>
        </div>
      </footer>
    </div>
  );
};
