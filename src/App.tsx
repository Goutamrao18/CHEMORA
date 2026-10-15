import React, { useState, useEffect } from 'react';
import { ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
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

  // URL Hash synchronization for direct bookmarks
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
      <main className={`relative z-10 lg:ml-[172px] ${activeTab === 'lab' ? 'pt-16 p-0 max-w-none w-full min-h-[calc(100vh-4rem)]' : 'pt-20 px-4 sm:px-8 pb-12 max-w-[1300px] mx-auto min-h-screen'}`}>
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

      {/* CHEMORA AI Chemistry Assistant Modal & Launcher */}
      <AIAssistant
        isOpen={isAssistantOpen}
        onOpen={() => setIsAssistantOpen(true)}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
