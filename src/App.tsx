import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { KnowView } from './components/KnowView';
import { ChallengeView } from './components/ChallengeView';
import { ExperimentsView } from './components/ExperimentsView';
import { ProgressView } from './components/ProgressView';
import { AccountView } from './components/AccountView';
import { VirtualLabView } from './components/VirtualLabView';
import { AIAssistant } from './components/AIAssistant';

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

  // URL Hash synchronization for bookmarks / direct links (#know, #challenge, #experiments, #progress, #lab, #account)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (['home', 'know', 'challenge', 'experiments', 'progress', 'lab', 'account'].includes(hash)) {
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

  const handleAskAI = (topic: string) => {
    setIsAssistantOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080d17] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans antialiased">
      {/* Top Application Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
        onSearch={handleSearch}
      />

      {/* Main Screen Views */}
      <main className="flex-1">
        {activeTab === 'home' && <HomeView onSelectTab={handleSelectTab} />}
        {activeTab === 'know' && (
          <KnowView
            initialSearch={searchQuery}
            onAskAI={handleAskAI}
          />
        )}
        {activeTab === 'challenge' && (
          <ChallengeView onAskAI={handleAskAI} />
        )}
        {activeTab === 'experiments' && (
          <ExperimentsView onAskAI={handleAskAI} />
        )}
        {activeTab === 'progress' && (
          <ProgressView
            onGoToChallenge={() => handleSelectTab('challenge')}
            onGoToExperiments={() => handleSelectTab('experiments')}
          />
        )}
        {activeTab === 'lab' && <VirtualLabView />}
        {activeTab === 'account' && (
          <AccountView onThemeChanged={() => setIsLightMode(!isLightMode)} />
        )}
      </main>

      {/* Floating AI Chemistry Tutor */}
      <AIAssistant
        isOpen={isAssistantOpen}
        onOpen={() => setIsAssistantOpen(true)}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
