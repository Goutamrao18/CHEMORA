import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { MobileDock } from './components/MobileDock';
import { FloatingAskPill } from './components/FloatingAskPill';

// Code-split heavy views to keep initial bundle size minimal
const HomeView = lazy(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })));
const KnowView = lazy(() => import('./components/KnowView').then((m) => ({ default: m.KnowView })));
const ChallengeView = lazy(() => import('./components/ChallengeView').then((m) => ({ default: m.ChallengeView })));
const ExperimentsView = lazy(() => import('./components/ExperimentsView').then((m) => ({ default: m.ExperimentsView })));
const ProgressView = lazy(() => import('./components/ProgressView').then((m) => ({ default: m.ProgressView })));
const AccountView = lazy(() => import('./components/AccountView').then((m) => ({ default: m.AccountView })));
const AIAssistant = lazy(() => import('./components/AIAssistant').then((m) => ({ default: m.AIAssistant })));

import { AtomSpinner } from './components/Loaders/AtomSpinner';

function ViewSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center" role="status" aria-live="polite">
      <div className="mb-4">
        <AtomSpinner size="lg" label={label} />
      </div>
      <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2">
        INITIALIZING CHAMBER
      </p>
      <p className="text-slate-400 text-sm max-w-xs">{label}</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chemora-theme') === 'light';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize light/dark class on body & document
  useEffect(() => {
    try {
      if (isLightMode) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        localStorage.setItem('chemora-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
        localStorage.setItem('chemora-theme', 'dark');
      }
    } catch {}
  }, [isLightMode]);

  // URL Hash synchronization for direct bookmarks
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (['home', 'know', 'challenge', 'experiments', 'progress', 'account'].includes(hash)) {
        setActiveTab(hash as ActiveTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setActiveTab('know');
    window.location.hash = 'know';
  };

  const handleAskAI = (_topic?: string) => {
    setIsAssistantOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#020816] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative">
      {/* Background radial ambiance */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[25%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[28%] right-[15%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Left Sidebar App Rail */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Top Utility Header */}
      <TopBar
        onSearch={handleSearch}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
        onGoToProgress={() => handleSelectTab('progress')}
      />

      {/* Main Content Area - Shifted 172px for Desktop Sidebar */}
      <main className="relative z-10 lg:ml-[172px] pt-20 px-4 sm:px-8 pb-12 max-w-[1300px] mx-auto min-h-screen">
        {activeTab === 'home' && (
          <ErrorBoundary tabName="Home">
            <Suspense fallback={<ViewSkeleton label="Loading Laboratory Chamber..." />}>
              <HomeView onSelectTab={handleSelectTab} />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'know' && (
          <ErrorBoundary tabName="Knowledge Library">
            <Suspense fallback={<ViewSkeleton label="Retrieving Apparatus & Reaction Library..." />}>
              <KnowView
                initialSearch={searchQuery}
                onAskAI={handleAskAI}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'challenge' && (
          <ErrorBoundary tabName="Challenge Arena">
            <Suspense fallback={<ViewSkeleton label="Compiling Chemistry Challenge Sets..." />}>
              <ChallengeView onAskAI={handleAskAI} />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'experiments' && (
          <ErrorBoundary tabName="Guided Experiments">
            <Suspense fallback={<ViewSkeleton label="Preparing Practical Procedures..." />}>
              <ExperimentsView onAskAI={handleAskAI} />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'progress' && (
          <ErrorBoundary tabName="Researcher Progress">
            <Suspense fallback={<ViewSkeleton label="Synchronizing Research Milestones..." />}>
              <ProgressView
                onGoToChallenge={() => handleSelectTab('challenge')}
                onGoToExperiments={() => handleSelectTab('experiments')}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {activeTab === 'account' && (
          <ErrorBoundary tabName="Researcher Account">
            <Suspense fallback={<ViewSkeleton label="Connecting to Researcher Profile..." />}>
              <AccountView onThemeChanged={() => setIsLightMode(!isLightMode)} />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {/* CHEMORA AI Chemistry Assistant Modal & Launcher */}
      <ErrorBoundary tabName="CHEMORA AI Assistant">
        <Suspense fallback={null}>
          <AIAssistant
            isOpen={isAssistantOpen}
            onOpen={() => setIsAssistantOpen(true)}
            onClose={() => setIsAssistantOpen(false)}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Floating Ask CHEMORA Pill (Mobile screens <= 768px) */}
      <FloatingAskPill
        onOpen={() => setIsAssistantOpen(true)}
        isAssistantOpen={isAssistantOpen}
      />

      {/* Floating Capsule Bottom Dock (Mobile screens <= 768px) */}
      <MobileDock
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Cookie & Storage Compliance Consent Banner */}
      <CookieConsent />
    </div>
  );
}
