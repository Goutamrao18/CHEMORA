import React, { useState } from 'react';
import { UserProfile, getStoredProfile, saveStoredProfile } from '../data/userProfile';
import { getInitialChallengeState, saveChallengeState } from '../data/challengeData';
import { User, Shield, Settings, RotateCcw, Check, Sparkles, Trophy, Beaker, Award, LogOut } from 'lucide-react';

interface AccountViewProps {
  onThemeChanged?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onThemeChanged }) => {
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [challengeState, setChallengeState] = useState(getInitialChallengeState);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const completedExperimentsCount = (() => {
    try {
      const raw = localStorage.getItem('chemoraExperimentProgress');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  })();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: nameInput.trim() || profile.name,
      email: emailInput.trim() || profile.email,
    };
    setProfile(updated);
    saveStoredProfile(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const togglePreference = (key: keyof UserProfile['preferences']) => {
    const updated: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [key]: !profile.preferences[key],
      },
    };
    setProfile(updated);
    saveStoredProfile(updated);

    if (key === 'theme') {
      if (onThemeChanged) onThemeChanged();
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('chemoraChallengeState');
    localStorage.removeItem('chemoraExperimentProgress');
    setChallengeState({ levels: [], xp: 0, answers: 0, correct: 0, levelResults: {}, rewards: [] });
    setShowResetConfirm(false);
    window.dispatchEvent(new CustomEvent('chemora:progress'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
          RESEARCHER PROFILE
        </span>
        <h1 className="text-4xl font-black text-white mt-2 mb-2">Account &amp; Workspace</h1>
        <p className="text-slate-300 text-sm">
          Manage your personal researcher identity, learning preferences, and stored progress.
        </p>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          Researcher profile successfully updated!
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Ring */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-2 border-cyan-500/40 p-2 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-white">{profile.name}</h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 border border-cyan-800/40 text-cyan-300">
                {profile.rank}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-2">{profile.email}</p>
            <span className="text-[11px] font-mono text-slate-500">
              Researcher ID: <span className="text-cyan-400 font-bold">{profile.id}</span>
            </span>
          </div>

          <div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-[#121c2e] hover:bg-[#18253e] border border-cyan-950 text-xs font-bold text-slate-300 transition"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-cyan-950/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                  Researcher Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-[#0a0f19] border border-cyan-950 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#0a0f19] border border-cyan-950 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
            >
              Save Changes
            </button>
          </form>
        )}
      </div>

      {/* Recapped Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 text-center">
          <Trophy className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
          <strong className="block text-xl font-bold text-white">{challengeState.levels.length}</strong>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Levels Conquered</span>
        </div>
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 text-center">
          <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <strong className="block text-xl font-bold text-amber-300">{challengeState.xp.toLocaleString()}</strong>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Total XP</span>
        </div>
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 text-center">
          <Beaker className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <strong className="block text-xl font-bold text-emerald-300">{completedExperimentsCount}</strong>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Practicals Done</span>
        </div>
        <div className="bg-[#0e1626] border border-cyan-950/80 rounded-2xl p-4 text-center">
          <Award className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <strong className="block text-xl font-bold text-purple-300">{challengeState.rewards.length}</strong>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Milestone Badges</span>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-[#0e1626] border border-cyan-950/80 rounded-3xl p-6 sm:p-8 mb-8">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Learning &amp; Display Preferences
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Tailor audio feedback, visual contrast, and explanation prompts to your study style.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#090f19] border border-cyan-950">
            <div>
              <strong className="text-sm font-semibold text-white block">Sound Effects</strong>
              <span className="text-xs text-slate-400">Play audio chimes on correct answers and milestones</span>
            </div>
            <button
              onClick={() => togglePreference('soundEffects')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                profile.preferences.soundEffects ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.preferences.soundEffects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#090f19] border border-cyan-950">
            <div>
              <strong className="text-sm font-semibold text-white block">Automatic Explanations</strong>
              <span className="text-xs text-slate-400">Instantly reveal question rationales after selecting an answer</span>
            </div>
            <button
              onClick={() => togglePreference('autoExplain')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                profile.preferences.autoExplain ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.preferences.autoExplain ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#090f19] border border-cyan-950">
            <div>
              <strong className="text-sm font-semibold text-white block">High Contrast Mode</strong>
              <span className="text-xs text-slate-400">Enhance borders and card readability for low-light environments</span>
            </div>
            <button
              onClick={() => togglePreference('highContrast')}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                profile.preferences.highContrast ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  profile.preferences.highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#140b0e] border border-rose-950 rounded-3xl p-6 sm:p-8">
        <h3 className="text-base font-bold text-rose-300 mb-1">Reset Stored Progress</h3>
        <p className="text-xs text-slate-400 mb-4">
          Permanently clear all completed challenge levels, XP, and experiment records from this browser.
        </p>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-xs font-bold text-rose-300 transition"
        >
          Reset All Learning Data
        </button>
      </div>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1626] border border-rose-500/50 rounded-3xl p-6 max-w-sm text-center shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reset All Learning Data?</h3>
            <p className="text-xs text-slate-300 mb-6">
              This action cannot be undone. All challenge achievements and practical experiment checkboxes will be reset.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
