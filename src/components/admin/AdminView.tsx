import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';
import { AuthCard } from '../AuthCard';
import { AdminSidebarRail, AdminTab } from './AdminSidebarRail';
import { AdminTopBar } from './AdminTopBar';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminVideosTab } from './AdminVideosTab';
import { AdminChallengesTab } from './AdminChallengesTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminExperimentDrawer } from './AdminExperimentDrawer';
import { AdminAIAssistant, AdminAIOrbTrigger } from './AdminAIAssistant';
import { Experiment } from '../../data/experimentsData';
import { AtomSpinner } from '../Loaders/AtomSpinner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminUserData {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export const AdminView: React.FC = () => {
  // Authentication & session state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isVerifyingState, setIsVerifyingState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chemora-admin-theme') === 'dark' ||
        document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  // Global Data & Stats
  const [statsData, setStatsData] = useState<any>(null);
  const [videoHealthData, setVideoHealthData] = useState<any>(null);
  const [isCheckingVideos, setIsCheckingVideos] = useState(false);

  // Assistant & Experiment Drawer
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // Synchronize dark theme class
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('chemora-admin-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('chemora-admin-theme', 'light');
      }
    } catch {}
  }, [isDark]);

  // Check existing session
  const verifySession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.admin) {
          setAdminUser(data.admin);
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Fetch admin dashboard stats
  const fetchStats = useCallback(async () => {
    if (!adminUser) return;
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  }, [adminUser]);

  // Fetch video health
  const fetchVideoHealth = useCallback(async (force = false) => {
    if (!adminUser) return;
    if (force) setIsCheckingVideos(true);
    try {
      const endpoint = force ? '/api/admin/videos/check' : '/api/admin/videos/health';
      const method = force ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVideoHealthData(data);
      }
    } catch (err) {
      console.error('Failed to load video health:', err);
    } finally {
      setIsCheckingVideos(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchStats();
      fetchVideoHealth(false);
    }
  }, [adminUser, fetchStats, fetchVideoHealth]);

  // Handle Login (State A)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Please check your input details (valid email and minimum 6 character password required).');
        return;
      }

      if (res.status === 401) {
        setAuthError('Invalid email or password.');
        return;
      }

      if (res.status === 404) {
        setAuthError('Admin service unavailable or endpoint not found.');
        return;
      }

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Too many admin login attempts. Account temporarily locked for 15 minutes.');
        return;
      }

      if (res.status >= 500) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Server error encountered. Please check server logs or try again later.');
        return;
      }

      const data = await res.json();

      if (data.requires2FA) {
        setIsVerifyingState(true);
        if (data.tempToken) {
          setTempToken(data.tempToken);
        }
        setAuthSuccess('Please enter your 6-digit authenticator code.');
      } else if (data.admin) {
        setAdminUser(data.admin);
        setAuthSuccess('Authenticated successfully.');
      }
    } catch (err) {
      setAuthError('Connection error. Could not verify administrator identity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle 2FA verification (State B)
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: verifyCode.trim(),
          tempToken,
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Please check your input (valid 6-digit verification code required).');
        return;
      }

      if (res.status === 401) {
        setAuthError('Invalid or expired 2FA code.');
        return;
      }

      if (res.status === 404) {
        setAuthError('Admin verification service unavailable.');
        return;
      }

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Too many attempts. Please try again in 15 minutes.');
        return;
      }

      if (res.status >= 500) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'Server error encountered during 2FA verification.');
        return;
      }

      const data = await res.json();
      if (data.admin) {
        setAdminUser(data.admin);
        setAuthSuccess('Security verification complete.');
      }
    } catch (err) {
      setAuthError('Verification network failure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setAdminUser(null);
    setIsVerifyingState(false);
    setLoginPassword('');
    setVerifyCode('');
  };

  // Moderation quick actions from dashboard
  const handleApproveReview = async (id: string) => {
    try {
      await fetch(`/api/admin/reviews/${id}/approve`, { method: 'POST', credentials: 'include' });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await fetch(`/api/admin/reviews/${id}/reject`, { method: 'POST', credentials: 'include' });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  // Search handler from TopBar
  const handleTopBarSearch = (query: string) => {
    if (!query) return;
    // Route to AI assistant if query starts with ask/question or open assistant
    setAssistantInitialQuery(query);
    setIsAssistantOpen(true);
  };

  // Initial loading state
  if (checkingAuth) {
    return (
      <div className="admin-portal-root min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--admin-page-bg)]">
        <AtomSpinner size="lg" label="Validating Administrator Clearance..." />
        <p className="mt-4 text-xs font-mono font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
          SECURE ENCLAVE INITIALIZING
        </p>
      </div>
    );
  }

  // Unauthenticated: render <AuthCard variant="admin" />
  if (!adminUser) {
    return (
      <div className="admin-portal-root min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[var(--admin-page-bg)] relative overflow-hidden transition-colors duration-300">
        {/* Subtle decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(var(--admin-text-main) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Back to Chemora Public Platform link */}
        <div className="w-full max-w-4xl mb-6 flex items-center justify-between z-10 px-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Chemora Academy
          </a>
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] px-3 py-1.5 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] shadow-xs transition"
          >
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* Control Room Auth Card */}
        <div className="w-full max-w-4xl z-10 flex flex-col items-center">
          <AuthCard
            variant="admin"
            isRegister={isVerifyingState}
            onToggleMode={(mode) => {
              setIsVerifyingState(mode);
              setAuthError(null);
            }}
            email={loginEmail}
            onEmailChange={setLoginEmail}
            password={loginPassword}
            onPasswordChange={setLoginPassword}
            verifyCode={verifyCode}
            onVerifyCodeChange={setVerifyCode}
            isSubmitting={isSubmitting}
            error={authError}
            onClearError={() => setAuthError(null)}
            success={authSuccess}
            onClearSuccess={() => setAuthSuccess(null)}
            onSignIn={handleSignIn}
            onSignUp={handleSignIn}
            onVerifySubmit={handleVerify2FA}
          />
        </div>

        {/* Security disclaimer footer */}
        <div className="mt-8 text-center text-[11px] text-[var(--admin-text-muted)] z-10 font-mono">
          <span>Protected by Chemora Administrative Protocol</span> &bull;{' '}
          <span>Unauthorised access attempts are logged with client IP origin</span>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout
  const adminFirstName = adminUser.name ? adminUser.name.split(' ')[0] : 'Administrator';
  const pendingReviewsCount = statsData?.pendingReviewsCount || 0;

  return (
    <div className="admin-portal-root min-h-screen bg-[var(--admin-page-bg)] text-[var(--admin-text-main)] flex flex-col md:flex-row relative transition-colors duration-300">
      {/* 1. Floating Left Icon Rail */}
      <AdminSidebarRail
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onLogout={handleSignOut}
        adminName={adminUser.name || 'Admin'}
        adminEmail={adminUser.email}
        pendingReviewsCount={pendingReviewsCount}
      />

      {/* 2. Main Portal Stage */}
      <main className="flex-1 min-w-0 md:pl-28 p-4 md:p-8 lg:p-10 pb-28 md:pb-10 max-w-[1560px] mx-auto w-full flex flex-col gap-6">
        {/* Top Bar with Greeting, Search, and Notification Badge */}
        <AdminTopBar
          adminName={adminFirstName}
          pendingReviewsCount={pendingReviewsCount}
          onSearchSubmit={handleTopBarSearch}
          onOpenReviewsTab={() => setActiveTab('reviews')}
          onOpenAssistant={() => {
            setAssistantInitialQuery('');
            setIsAssistantOpen(true);
          }}
        />

        {/* Dynamic Tab Switcher */}
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            statsData={statsData}
            onNavigateTab={setActiveTab}
            onOpenExperiment={(exp) => setSelectedExperiment(exp)}
            onApproveReview={handleApproveReview}
            onRejectReview={handleRejectReview}
            onRefreshVideos={() => fetchVideoHealth(true)}
            videoHealthData={videoHealthData}
            isCheckingVideos={isCheckingVideos}
          />
        )}

        {activeTab === 'reviews' && (
          <AdminReviewsTab onStatusChange={fetchStats} />
        )}

        {activeTab === 'users' && <AdminUsersTab />}

        {activeTab === 'content' && <AdminVideosTab />}

        {activeTab === 'challenges' && <AdminChallengesTab />}

        {activeTab === 'audit' && <AdminAuditTab />}

        {activeTab === 'settings' && <AdminSettingsTab />}
      </main>

      {/* 3. Experiment Detail Drawer */}
      <AdminExperimentDrawer
        experiment={selectedExperiment}
        onClose={() => setSelectedExperiment(null)}
      />

      {/* 4. Chemora AI Assistant Floating Orb Trigger & Panel */}
      <AdminAIOrbTrigger onClick={() => setIsAssistantOpen(true)} />
      <AdminAIAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        adminName={adminUser.name || 'Admin'}
        initialQuery={assistantInitialQuery}
      />
    </div>
  );
};

export default AdminView;
