import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ActiveTab } from './components/Navbar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { LiquidFloatingBar } from './components/LiquidFloatingBar';

// Code-split heavy views to keep initial bundle size minimal
const HomeView = lazy(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })));
const KnowView = lazy(() => import('./components/KnowView').then((m) => ({ default: m.KnowView })));
const ChallengeView = lazy(() => import('./components/ChallengeView').then((m) => ({ default: m.ChallengeView })));
const ExperimentsView = lazy(() => import('./components/ExperimentsView').then((m) => ({ default: m.ExperimentsView })));
const AccountView = lazy(() => import('./components/AccountView').then((m) => ({ default: m.AccountView })));
const AIAssistant = lazy(() => import('./components/AIAssistant').then((m) => ({ default: m.AIAssistant })));
const AdminView = lazy(() => import('./components/admin/AdminView'));

import { LiquidLoaderScreen } from './components/ui/LiquidLoader';
import { BubbleTransition } from './components/BubbleTransition';
import { CommandPalette } from './components/CommandPalette';
import { playBubblePop } from './utils/soundEffects';

function ViewSkeleton({ label }: { label: string }) {
  return (
    <LiquidLoaderScreen
      label={label}
      subtitle="INITIALIZING CHAMBER"
      className="min-h-[500px]"
    />
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [isBubbleTransitioning, setIsBubbleTransitioning] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock dark mode permanently & clear any legacy theme keys
  useEffect(() => {
    try {
      localStorage.removeItem('chemora-theme');
      localStorage.removeItem('chemora-admin-theme');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } catch {}
  }, []);

  // Global Ctrl/Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#admin');
  });

  useEffect(() => {
    const checkRoute = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#admin'));
    };
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, []);

  // URL Hash synchronization for direct bookmarks (does not trigger transition on direct initial link)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (['home', 'know', 'challenge', 'experiments', 'account'].includes(hash)) {
        setActiveTab(hash as ActiveTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Navigation with Signature Bubble Transition (Item 2)
  const handleSelectTab = (targetTab: ActiveTab) => {
    if (targetTab === activeTab && !pendingTab) return;
    if (isBubbleTransitioning) return;

    playBubblePop();
    setPendingTab(targetTab);
    setIsBubbleTransitioning(true);
  };

  const handleSwapView = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
      window.location.hash = pendingTab === 'home' ? '' : pendingTab;
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleTransitionComplete = () => {
    setIsBubbleTransitioning(false);
    setPendingTab(null);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    handleSelectTab('know');
  };

  const handleAskAI = (_topic?: string) => {
    setIsAssistantOpen(true);
  };

  if (isAdminRoute) {
    return (
      <ErrorBoundary tabName="Chemora Admin Control Room">
        <Suspense fallback={<ViewSkeleton label="Accessing Secure Administrative Enclave..." />}>
          <AdminView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[#020816] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased relative">
      {/* Signature Bubble Page Transition (Item 2) */}
      <BubbleTransition
        isTransitioning={isBubbleTransitioning}
        onSwapView={handleSwapView}
        onComplete={handleTransitionComplete}
      />

      {/* Global Command Palette (Item 9) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Background radial ambiance */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[25%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[28%] right-[15%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Utility Header */}
      <TopBar
        onSearch={handleSearch}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSelectHome={() => handleSelectTab('home')}
      />

      {/* Main Content Area - Fully Centered in the middle */}
      <main className="relative z-10 pt-20 px-4 sm:px-8 pb-28 max-w-[1300px] mx-auto min-h-screen">
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

        {activeTab === 'account' && (
          <ErrorBoundary tabName="Researcher Account">
            <Suspense fallback={<ViewSkeleton label="Connecting to Researcher Profile..." />}>
              <AccountView />
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

      {/* Liquid Floating Bar Navigation with integrated AI Tutor trigger (Mobile screens < 1024px) */}
      <LiquidFloatingBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAITutor={() => setIsAssistantOpen(true)}
        isAITutorOpen={isAssistantOpen}
      />

      {/* Cookie & Storage Compliance Consent Banner */}
      <CookieConsent />
    </div>
  );
}
