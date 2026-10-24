import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('chemora_cookie_consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(false);
    }

    const handleOpen = () => setIsVisible(true);
    window.addEventListener('chemora:open_cookie_preferences', handleOpen);
    return () => window.removeEventListener('chemora:open_cookie_preferences', handleOpen);
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('chemora_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('chemora_cookie_consent', 'essential');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent Banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-2xl bg-[#071329]/95 border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl anim-popup"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
          <Cookie className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm">Privacy &amp; Cookie Preferences</h4>
            <button
              onClick={handleEssentialOnly}
              aria-label="Close and keep essential only"
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-300 mt-1 leading-relaxed">
            CHEMORA uses first-party session cookies and browser storage strictly to maintain researcher authentication and record learning streaks. We do not use third-party advertising or commercial tracking cookies.
          </p>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-cyan-950">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs transition shadow-sm"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
            >
              Essential Only
            </button>
            <a
              href="/cookie-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
            >
              Policy &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
