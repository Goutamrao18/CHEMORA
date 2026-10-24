import React from 'react';
import { ActiveTab } from './Navbar';
import { Shield, Cookie, FileText, Mail, ExternalLink, Sparkles, BookOpen, Trophy, Beaker, TrendingUp, User } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const currentYear = new Date().getFullYear();

  const handleOpenCookiePreferences = () => {
    try {
      localStorage.removeItem('chemora_cookie_consent');
      window.dispatchEvent(new CustomEvent('chemora:open_cookie_preferences'));
    } catch {}
  };

  return (
    <footer className="w-full mt-20 pt-10 pb-20 border-t border-cyan-950/70 text-xs text-slate-400 space-y-8 select-none">
      {/* Brand & Mission Colophon Banner */}
      <div className="p-5 rounded-2xl bg-[#061224]/80 border border-cyan-900/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
            <img
              src="/assets/chemora-mark.svg"
              alt="CHEMORA"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wider">CHEMORA LAB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">Active System</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Virtual Chemistry Laboratory &bull; Molecular Discovery &bull; Interactive Arena
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/40 text-cyan-200 font-mono text-[11px]">
            TOUCH &bull; MIX &bull; REACT
          </span>
          <span className="px-3 py-1 rounded-lg bg-blue-950/70 border border-blue-800/40 text-blue-200 font-mono text-[11px]">
            100 Levels &bull; 134 Reagents
          </span>
        </div>
      </div>

      {/* Main Multi-Column Footer Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
        {/* Col 1: Platform Sections */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('home')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Home Chamber
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('know')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Apparatus &amp; Know Library
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('challenge')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Challenge Arena
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('experiments')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Guided Practical Labs
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('progress')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Learning Progress
              </button>
            </li>
          </ul>
        </div>

        {/* Col 2: Scientific Tools */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Scientific Tools</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="/periodic-table.html"
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Interactive Periodic Table
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.sessionStorage?.setItem('chemora:know_tab', 'bioscience');
                  } catch {}
                  onSelectTab('know');
                }}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                3D Macromolecule Visualizer
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectTab('account')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Researcher Workspace
              </button>
            </li>
            <li>
              <a
                href="#admin"
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Admin Control Enclave
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Compliance & Legal */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Legal &amp; Trust</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="/terms.html"
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Terms of Service
              </a>
            </li>
            <li>
              <a
                href="/privacy.html"
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Privacy Policy
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={handleOpenCookiePreferences}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px] cursor-pointer text-left"
              >
                <Cookie className="w-3.5 h-3.5 text-cyan-400" />
                Cookie Preferences
              </button>
            </li>
            <li>
              <a
                href="/cookie-policy.html"
                className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 min-h-[32px]"
              >
                Cookie Information
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Support & Contact */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Lab Inquiries</h4>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            For academic partnerships, scientific bug reports, or laboratory inquiries:
          </p>
          <a
            href="mailto:chemora_lab@agentmail.to"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 hover:text-white hover:border-cyan-400 transition min-h-[44px] text-xs font-semibold"
          >
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">chemora_lab@agentmail.to</span>
          </a>
        </div>
      </div>

      {/* Dynamic Copyright & Standards Notice */}
      <div className="pt-6 border-t border-cyan-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
        <p>&copy; {currentYear} Chemora lab &bull; All rights reserved.</p>
        <p className="font-mono text-[10px] text-slate-500">
          Strictly Non-Hazardous Educational Virtual Laboratory Simulation
        </p>
      </div>
    </footer>
  );
};
