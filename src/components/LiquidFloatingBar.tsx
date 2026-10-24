import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { ActiveTab } from './Navbar';
import {
  Home,
  BookOpen,
  Trophy,
  FlaskConical,
  TrendingUp,
  User,
  Sparkles,
  MoreHorizontal,
  FileText,
  Shield,
  Cookie,
  Mail,
  Table,
  Lock,
  X,
} from 'lucide-react';

interface LiquidFloatingBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAITutor: () => void;
  isAITutorOpen?: boolean;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'know', label: 'Know', icon: BookOpen },
  { id: 'challenge', label: 'Arena', icon: Trophy },
  { id: 'experiments', label: 'Labs', icon: FlaskConical },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'account', label: 'Account', icon: User },
];

export const LiquidFloatingBar: React.FC<LiquidFloatingBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAITutor,
  isAITutorOpen = false,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [indicatorRect, setIndicatorRect] = useState<{ left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Map<ActiveTab, HTMLButtonElement>>(new Map());

  // Close "More" drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  // Check reduced motion preference
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      return undefined;
    }
  }, []);

  // Compute active tab pill position & width
  const updateIndicator = useCallback(() => {
    const btn = tabsRef.current.get(activeTab);
    const container = containerRef.current;
    if (btn && container) {
      const btnRect = btn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorRect({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, activeTab]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator, { passive: true });
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // Scroll listener: Hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.pageYOffset || document.documentElement.scrollTop;

        // Keep visible near top of screen
        if (currentY <= 40) {
          setIsHidden(false);
          lastY = currentY;
          ticking = false;
          return;
        }

        const delta = currentY - lastY;
        if (Math.abs(delta) > 8) {
          if (delta > 0 && currentY > 70) {
            // Scrolling down -> hide
            setIsHidden(true);
          } else {
            // Scrolling up -> reveal
            setIsHidden(false);
          }
          lastY = currentY;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard avoidance when an input is focused on mobile
  useEffect(() => {
    const isTextInput = (el: Element | null): boolean => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'textarea') return true;
      if (tag === 'input') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return ['text', 'search', 'email', 'password', 'number', 'tel', 'url'].includes(type);
      }
      return false;
    };

    const onFocusIn = (e: FocusEvent) => {
      if (isTextInput(e.target as Element)) {
        setIsHidden(true);
      }
    };

    const onFocusOut = (e: FocusEvent) => {
      if (isTextInput(e.target as Element)) {
        setTimeout(() => {
          if (!isTextInput(document.activeElement)) {
            setIsHidden(false);
          }
        }, 120);
      }
    };

    document.addEventListener('focusin', onFocusIn, { passive: true });
    document.addEventListener('focusout', onFocusOut, { passive: true });
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <>
      {/* Cheap SVG Gooey Filter applied strictly to liquid indicator elements */}
      <svg
        className="absolute w-0 h-0 pointer-events-none opacity-0 overflow-hidden"
        aria-hidden="true"
      >
        <defs>
          <filter id="chemora-liquid-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Floating Bottom Dock Container: Navigation Bar & AI Tutor at the exact same bottom level */}
      <div
        className={`fixed bottom-[calc(14px+env(safe-area-inset-bottom,12px))] inset-x-0 mx-auto w-full px-3 sm:px-6 z-40 pointer-events-none transition-all duration-300 ${
          isHidden || isAITutorOpen
            ? 'translate-y-[calc(100%+40px)] opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="relative max-w-7xl mx-auto flex items-center justify-center">
          {/* Liquid Floating Bar Navigation - Centered in the middle */}
          <nav
            aria-label="Main Navigation"
            className="pointer-events-auto w-fit max-w-[calc(100vw-24px)]"
          >
            <div
              ref={containerRef}
              role="tablist"
              className="relative h-[52px] sm:h-[56px] px-1.5 sm:px-2 rounded-[26px] sm:rounded-[28px] bg-[#050c1c]/90 border border-white/14 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl flex items-center justify-center gap-0.5 sm:gap-1.5 select-none overflow-hidden mx-auto"
            >
              {/* Subtle Top Specular Reflection Highlight */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none z-20" />

              {/* Liquid Gooey Indicator Highlight (Only applied to this sliding layer!) */}
              {indicatorRect && (
                <div
                  className="absolute top-1.5 bottom-1.5 pointer-events-none z-10"
                  style={{
                    left: `${indicatorRect.left}px`,
                    width: `${indicatorRect.width}px`,
                    filter: prefersReducedMotion ? 'none' : 'url(#chemora-liquid-gooey)',
                    transition: prefersReducedMotion
                      ? 'opacity 160ms ease'
                      : 'left 280ms cubic-bezier(0.2, 0.9, 0.28, 1), width 280ms cubic-bezier(0.2, 0.9, 0.28, 1)',
                  }}
                >
                  <div className="w-full h-full rounded-[22px] bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-teal-400/25 border border-cyan-400/60 shadow-[0_0_16px_rgba(6,182,212,0.35)] relative overflow-hidden">
                    {/* Secondary inner specular dot for gooey organic elasticity */}
                    <div className="absolute top-1 left-2 w-3 h-1.5 rounded-full bg-cyan-200/50 blur-[1px]" />
                  </div>
                </div>
              )}

              {/* Tab Buttons (44px min tap targets, haptic active scale 0.96) */}
              {NAV_ITEMS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      if (el) tabsRef.current.set(tab.id, el);
                      else tabsRef.current.delete(tab.id);
                    }}
                    type="button"
                    role="tab"
                    id={`floating-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={tab.label}
                    onClick={() => {
                      setIsMoreOpen(false);
                      onSelectTab(tab.id);
                    }}
                    className={`relative z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[18px] sm:rounded-[20px] transition-transform duration-100 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050c1c] ${
                      isActive ? 'px-2.5 sm:px-3 text-cyan-300 font-bold' : 'px-1.5 sm:px-2 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-200 ${
                          isActive
                            ? 'stroke-cyan-300 scale-105 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                            : 'stroke-current'
                        }`}
                      />
                      {isActive && (
                        <span className="text-[11px] sm:text-xs tracking-tight font-extrabold text-white whitespace-nowrap animate-in fade-in duration-150">
                          {tab.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* More Secondary Menu Trigger */}
              <button
                type="button"
                aria-label="More navigation and legal options"
                aria-expanded={isMoreOpen}
                aria-haspopup="dialog"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`relative z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[18px] sm:rounded-[20px] transition-all duration-100 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isMoreOpen
                    ? 'text-cyan-300 bg-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </nav>

          {/* AI Tutor Floating Trigger - Elevated on mobile to float cleanly without clipping; untouched on PC */}
          <button
            type="button"
            onClick={onOpenAITutor}
            aria-label="Open CHEMORA AI Assistant"
            className={`pointer-events-auto fixed sm:absolute right-3.5 sm:right-0 bottom-[calc(76px+env(safe-area-inset-bottom,12px))] sm:bottom-0 ml-0 h-[44px] sm:h-[56px] px-3 sm:px-5 rounded-full sm:rounded-[28px] bg-gradient-to-r from-cyan-500/25 via-blue-600/35 to-indigo-600/30 bg-[#061124]/90 border border-cyan-400/50 hover:border-cyan-400/80 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_16px_rgba(6,182,212,0.3)] backdrop-blur-xl flex items-center gap-1.5 sm:gap-2 text-white font-bold text-xs active:scale-[0.96] transition-all duration-200 select-none ${
              isAITutorOpen
                ? 'opacity-0 pointer-events-none scale-90'
                : 'opacity-100 scale-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse flex-shrink-0" />
            <span className="tracking-wide text-cyan-100 hidden sm:inline">AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Accessible "More" Slide-up Drawer for Secondary Pages (Item 3) */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More Resources & Laboratory Settings"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[#071329] border-t sm:border border-cyan-500/40 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl shadow-black/80 max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-cyan-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">More Resources</h3>
                  <p className="text-[11px] text-slate-400">Policies, tools &amp; support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Close more options"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block px-3 py-1">
                Scientific Utilities
              </span>
              <a
                href="/periodic-table.html"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <Table className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Interactive Periodic Table of Elements</span>
              </a>

              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block px-3 py-1 mt-3">
                Legal &amp; Privacy
              </span>
              <a
                href="/terms.html"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Terms of Service</span>
              </a>
              <a
                href="/privacy.html"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Privacy Policy</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  localStorage.removeItem('chemora_cookie_consent');
                  window.dispatchEvent(new CustomEvent('chemora:open_cookie_preferences'));
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition text-left cursor-pointer"
              >
                <Cookie className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Cookie Preferences</span>
              </button>
              <a
                href="/cookie-policy.html"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <Cookie className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Cookie Policy</span>
              </a>

              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block px-3 py-1 mt-3">
                Laboratory Operations
              </span>
              <a
                href="mailto:chemora_lab@agentmail.to"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Contact Academic Support</span>
              </a>
              <a
                href="#admin"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 min-h-[44px] transition"
              >
                <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Administrative Control Room</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
