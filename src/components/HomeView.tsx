import React, { useState } from 'react';
import { ActiveTab } from './Navbar';
import { Play, Sparkles, BookOpen, Trophy, Compass, Beaker, ChevronRight, ArrowRight } from 'lucide-react';
import { ReviewsSection } from './ReviewsSection';
import { GlassCard, GlassPanel, GlassBadge, GlassButton } from './ui/Glass';

interface HomeViewProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTab }) => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is CHEMORA?",
      a: "CHEMORA is a comprehensive chemistry learning platform combining an interactive 130+ item knowledge library, guided practical experiments with video explainers, 100 progressive challenges, and an AI chemistry tutor."
    },
    {
      q: "Can I track my learning progress?",
      a: "Yes! Challenge results, completed practical experiments, earned XP, accuracy metrics, and strengths across topics are automatically saved in your browser and account."
    },
    {
      q: "Does CHEMORA replace a real laboratory?",
      a: "No. The virtual simulation and interactive activities are designed for safe learning, exploration, and pre-lab preparation. Always follow institution and laboratory safety protocols when conducting physical experiments."
    },
    {
      q: "How does CHEMORA AI work?",
      a: "CHEMORA AI provides instant, intelligent chemistry guidance, balancing equations, safety warnings, and contextual explanations for questions across organic, inorganic, and physical chemistry."
    },
    {
      q: "Is an account required?",
      a: "All learning materials, practicals, and challenge levels are completely open without signing in. Creating a profile allows you to customize learning preferences and maintain your researcher rank."
    }
  ];

  return (
    <div className="text-slate-100 pb-16 space-y-12">
      {/* Authentic CHEMORA Hero Card - Rounded 34px with High-Visibility Beaker Video */}
      <section className="relative rounded-[34px] overflow-hidden border border-cyan-500/35 bg-gradient-to-r from-[#05142b]/95 via-[#051228]/90 to-[#020814]/95 shadow-[0_30px_90px_rgba(0,0,0,0.45)] min-h-[520px] lg:min-h-[560px] flex items-center p-8 sm:p-12 lg:p-16 glass-top-edge">
        {/* Top Specular Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none z-30" />

        {/* Background Beaker Video with High Visibility */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center filter saturate-[1.15] contrast-[1.08] brightness-[0.88]"
          >
            <source src="/videos/chemora-intro.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Luminous Glass Overlays - Soft Scrim Preserving Video Detail */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#05142b]/90 via-[#051228]/60 to-[#020814]/20 backdrop-blur-[1px]" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_30%_50%,rgba(34,146,255,0.15),transparent_60%)]" />

        {/* Hero Content on Left Side */}
        <div className="relative z-20 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 mb-3">
            <GlassBadge variant="cyan" dot={true}>
              LEARN · EXPERIMENT · CREATE
            </GlassBadge>
          </div>

          {/* Heading - FIXED: "CHEMORA" will NEVER break into CHEMOR \n A */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-2">
            Welcome to{' '}
            <span
              style={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                wordBreak: 'keep-all',
              }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#b77bff] to-[#58d6ff] drop-shadow-[0_0_35px_rgba(63,202,255,0.35)]"
            >
              CHEMORA
            </span>
          </h1>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Explore. Learn. Experiment. Create.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Your complete chemistry learning platform with interactive tools, 20 guided practical experiments, 100 progressive challenges, and AI assistance — all in one luminous workspace.
          </p>

          {/* Actions with Gloss Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelectTab('know')}
              className="glass-btn glass-btn-cyan px-7 py-3.5 rounded-full text-sm font-black text-slate-950 shadow-[0_12px_35px_rgba(6,182,212,0.45)] hover:shadow-[0_16px_40px_rgba(6,182,212,0.65)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
            >
              <span>Start Exploring</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="glass-btn px-6 py-3.5 text-sm font-bold flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Explore Workspace Cards */}
      <section className="space-y-6">
        <div>
          <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-[0.18em] uppercase">
            CHEMORA WORKSPACE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-2">
            Everything you need for chemistry
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Jump directly into the part of the platform you want to use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Know Card */}
          <GlassCard
            variant="cyan"
            interactive={true}
            onClick={() => onSelectTab('know')}
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center p-2.5 text-cyan-300 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">KNOW</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-cyan-200 transition">
                Know Library
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Explore 134 chemicals, laboratory tools, apparatus, plus a searchable Chemistry Glossary &amp; Dictionary.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
              Open library <ChevronRight className="w-4 h-4" />
            </span>
          </GlassCard>

          {/* Challenge Card */}
          <GlassCard
            variant="purple"
            interactive={true}
            onClick={() => onSelectTab('challenge')}
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center p-2.5 text-purple-300 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider">CHALLENGE</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-purple-200 transition">
                Chemistry Challenge
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Test and elevate your knowledge across 100 progressive levels with 1,000 curriculum-aligned questions and instant explanations.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition">
              Start challenge <ChevronRight className="w-4 h-4" />
            </span>
          </GlassCard>

          {/* Experiments Card */}
          <GlassCard
            variant="emerald"
            interactive={true}
            onClick={() => onSelectTab('experiments')}
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center p-2.5 text-emerald-300 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition">
                <Beaker className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">EXPERIMENTS</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-emerald-200 transition">
                Guided Practicals
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Follow 20 step-by-step practical laboratory protocols complete with video demonstrations, balanced equations, and observations.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
              Open experiments <ChevronRight className="w-4 h-4" />
            </span>
          </GlassCard>

          {/* Progress Card */}
          <GlassCard
            variant="amber"
            interactive={true}
            onClick={() => onSelectTab('progress')}
            className="p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center p-2.5 text-amber-300 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">PROGRESS</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-amber-200 transition">
                Learning Dashboard
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Track completed levels, best accuracy scores, XP streaks, and topic strengths across organic, physical, and inorganic chemistry.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
              View your progress <ChevronRight className="w-4 h-4" />
            </span>
          </GlassCard>

          {/* Dedicated 3D Lab Launcher Card */}
          <GlassCard
            variant="cyan"
            interactive={true}
            onClick={() => { window.location.href = '/play'; }}
            className="md:col-span-2 p-6 flex flex-col justify-between group border-cyan-400/50 shadow-[0_20px_60px_rgba(35,129,255,0.25)]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center p-2.5 text-cyan-300 mb-4 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition shadow-inner">
                <span className="text-xl font-black">⚗</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">PLAY</span>
                <GlassBadge variant="cyan">
                  DEDICATED 60FPS SIMULATION
                </GlassBadge>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-cyan-200 transition">
                Virtual Chemistry Laboratory
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl">
                Enter an interactive virtual laboratory room in a dedicated separate screen for max performance. Dispense reagents, measure accurate volumes, heat samples on the Bunsen burner, observe chemical reactions, and analyze spectral signatures in real-time.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 group-hover:translate-x-1 transition">
              Launch dedicated 3D lab →
            </span>
          </GlassCard>
        </div>
      </section>

      {/* FAQ Section with GlassPanel */}
      <GlassPanel glow="cyan" className="p-6 sm:p-10">
        <div className="mb-6">
          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.18em] uppercase">
            HELP &amp; TRUST
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card bg-[#071324]/80 border border-cyan-900/40 rounded-xl overflow-hidden transition hover:border-cyan-500/40"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-slate-100 hover:text-cyan-300 transition"
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
      </GlassPanel>

      {/* Database-Backed Learner Reviews & Feedback System */}
      <ReviewsSection />

      {/* Demo Video Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#0e1524] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-950 bg-[#0a101b]">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">CHEMORA Platform Showcase</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-md text-base"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                src="/videos/chemora-showcase.mp4"
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-6 border-t border-cyan-950/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-400">⚗ CHEMORA</span>
          <span>•</span>
          <span>TOUCH · MIX · REACT</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onSelectTab('know')} className="hover:text-cyan-300">Library</button>
          <button onClick={() => onSelectTab('challenge')} className="hover:text-cyan-300">Challenge</button>
          <button onClick={() => onSelectTab('experiments')} className="hover:text-cyan-300">Experiments</button>
          <a href="mailto:support@chemora.work.gd" className="hover:text-cyan-300">Support</a>
        </div>
      </footer>
    </div>
  );
};
