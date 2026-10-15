import React, { useState } from 'react';
import { ActiveTab } from './Navbar';
import { Play, Sparkles, BookOpen, Trophy, Compass, Beaker, ChevronRight, Mail } from 'lucide-react';

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
      <section className="relative rounded-[34px] overflow-hidden border border-cyan-500/25 bg-gradient-to-r from-[#05142b] via-[#051228] to-[#020814] shadow-[0_30px_90px_rgba(0,0,0,0.35)] min-h-[520px] lg:min-h-[560px] flex items-center p-8 sm:p-12 lg:p-16">
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
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#05142b]/90 via-[#051228]/60 to-[#020814]/20" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_30%_50%,rgba(34,146,255,0.12),transparent_60%)]" />

        {/* Hero Content on Left Side */}
        <div className="relative z-20 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-[0.18em] text-cyan-300 uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LEARN · EXPERIMENT · CREATE
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
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#b77bff] to-[#58d6ff] drop-shadow-[0_0_35px_rgba(63,202,255,0.25)]"
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

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelectTab('know')}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#5bceff] via-[#627dff] to-[#b06bff] hover:opacity-95 text-slate-950 font-bold text-sm tracking-wide shadow-[0_12px_35px_rgba(64,171,255,0.3)] transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Exploring →
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-3.5 rounded-full bg-[#08162b]/80 hover:bg-[#0d2242] border border-cyan-400/30 text-cyan-200 font-bold text-sm tracking-wide shadow-md transition flex items-center gap-2 backdrop-blur-md"
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
          {/* Know */}
          <div
            onClick={() => onSelectTab('know')}
            className="group cursor-pointer bg-gradient-to-br from-[#0d1c33]/85 to-[#071324]/85 border border-cyan-500/20 hover:border-cyan-400/60 rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(28,164,255,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center p-2.5 text-cyan-400 mb-4 group-hover:scale-110 transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">KNOW</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-cyan-300 transition">
                Know Library
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Explore 134 chemicals, laboratory tools, apparatus, plus a searchable Chemistry Glossary &amp; Dictionary.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
              Open library <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Challenge */}
          <div
            onClick={() => onSelectTab('challenge')}
            className="group cursor-pointer bg-gradient-to-br from-[#0d1c33]/85 to-[#071324]/85 border border-cyan-500/20 hover:border-purple-400/60 rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(190,74,255,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center p-2.5 text-purple-400 mb-4 group-hover:scale-110 transition">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider">CHALLENGE</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-purple-300 transition">
                Chemistry Challenge
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Test and elevate your knowledge across 100 progressive levels with 1,000 curriculum-aligned questions and instant explanations.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition">
              Start challenge <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Experiments */}
          <div
            onClick={() => onSelectTab('experiments')}
            className="group cursor-pointer bg-gradient-to-br from-[#0d1c33]/85 to-[#071324]/85 border border-cyan-500/20 hover:border-emerald-400/60 rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(51,255,206,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center p-2.5 text-emerald-400 mb-4 group-hover:scale-110 transition">
                <Beaker className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">EXPERIMENTS</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-emerald-300 transition">
                Guided Practicals
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Follow 20 step-by-step practical laboratory protocols complete with video demonstrations, balanced equations, and observations.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
              Open experiments <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Progress */}
          <div
            onClick={() => onSelectTab('progress')}
            className="group cursor-pointer bg-gradient-to-br from-[#0d1c33]/85 to-[#071324]/85 border border-cyan-500/20 hover:border-amber-400/60 rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,182,62,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2.5 text-amber-400 mb-4 group-hover:scale-110 transition">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider">PROGRESS</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-amber-300 transition">
                Learning Dashboard
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Track completed levels, best accuracy scores, XP streaks, and topic strengths across organic, physical, and inorganic chemistry.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
              View your progress <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* 3D Lab */}
          <div
            onClick={() => onSelectTab('lab')}
            className="md:col-span-2 group cursor-pointer bg-gradient-to-br from-[#0b1a33]/95 via-[#08152c]/90 to-[#030916]/95 border border-cyan-500/40 hover:border-cyan-400 rounded-[24px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(35,129,255,0.22)] flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center p-2.5 text-cyan-300 mb-4 group-hover:scale-110 transition shadow-inner">
                <span className="text-xl font-black">⚗</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">PLAY</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  INTERACTIVE SIMULATION
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 mb-2 group-hover:text-cyan-200 transition">
                Virtual Chemistry Laboratory
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl">
                Enter an interactive virtual laboratory room. Dispense reagents, measure accurate volumes, heat samples on the Bunsen burner, observe chemical reactions, and analyze spectral signatures in real-time.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 group-hover:translate-x-1 transition">
              Enter the lab <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-br from-[#0c192e]/80 to-[#061122]/80 border border-cyan-500/20 rounded-[28px] p-6 sm:p-10">
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
              className="bg-[#071324]/80 border border-cyan-900/40 rounded-xl overflow-hidden transition"
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
      </section>

      {/* Learner Feedback & Reviews */}
      <section className="bg-gradient-to-br from-[#0c192e]/80 to-[#061122]/80 border border-cyan-500/20 rounded-[28px] p-6 sm:p-10">
        <div className="mb-8">
          <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-[0.18em] uppercase">
            LEARNER FEEDBACK
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1 mb-1.5">Help CHEMORA get better</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Your honest feedback helps shape a better chemistry learning experience for students worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="bg-[#08152a] border border-cyan-500/20 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold mb-3 text-sm">
                ✦
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">YOUR VOICE MATTERS</span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 mb-2">Share your CHEMORA experience</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-6">
                Tell us what you learned, which features helped most, and what you would like to see added next.
              </p>
            </div>
            <div>
              <a
                href="mailto:support@chemora.work.gd?subject=CHEMORA%20Learner%20Review%20%26%20Feedback"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
                Write a review ↗
              </a>
              <small className="block text-slate-500 text-[10px] mt-2">
                Opens your email client with a structured feedback template.
              </small>
            </div>
          </article>

          <div className="bg-[#08152a] border border-cyan-950 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">What to include</h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono font-bold">01</span>
                <div>
                  <strong className="text-white block">Your experience</strong>
                  <p className="text-slate-400">Which practicals or challenge levels did you try?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono font-bold">02</span>
                <div>
                  <strong className="text-white block">Honest critique</strong>
                  <p className="text-slate-400">What worked well, and what could be clearer?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono font-bold">03</span>
                <div>
                  <strong className="text-white block">Publishing choice</strong>
                  <p className="text-slate-400">Confirm whether we may quote your feedback.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
