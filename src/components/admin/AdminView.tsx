import React, { useState, useEffect, useCallback } from 'react';
import './admin.css';
import { AdminAuthCard } from './AdminAuthCard';
import { AdminSidebarRail, AdminTab } from './AdminSidebarRail';
import { AdminTopBar } from './AdminTopBar';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminVideosTab } from './AdminVideosTab';
import { AdminChallengesTab } from './AdminChallengesTab';
import { AdminAuditTab } from './AdminAuditTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminDevOpsTab } from './AdminDevOpsTab';
import { AdminExperimentDrawer } from './AdminExperimentDrawer';
import { AdminAIAssistant, AdminAIOrbTrigger } from './AdminAIAssistant';
import { Experiment } from '../../data/experimentsData';
import { LiquidLoaderScreen } from '../ui/LiquidLoader';
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

  // Login form & OTP step state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authStep, setAuthStep] = useState<'login' | 'otp'>('login');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [expiresIn, setExpiresIn] = useState<number>(600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Navigation (Dark teal is the fixed look for CHEMORA Admin)
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Global Data & Stats
  const [statsData, setStatsData] = useState<any>(null);
  const [videoHealthData, setVideoHealthData] = useState<any>(null);
  const [isCheckingVideos, setIsCheckingVideos] = useState(false);

  // Assistant & Experiment Drawer
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // Enforce permanent dark mode
  useEffect(() => {
    try {
      localStorage.removeItem('chemora-admin-theme');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } catch {}
  }, []);

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

  // Step 1: Submit email & password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthErrorCode(null);
    setAttemptsLeft(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data.step === 'otp') {
        setMaskedEmail(data.maskedEmail || loginEmail);
        setResendCountdown(data.resendAfter || 60);
        if (data.expiresIn) {
          setExpiresIn(data.expiresIn);
        }
        setAuthStep('otp');
        setAuthSuccess('Verification code sent to your email.');
        return;
      }

      if (res.status === 400) {
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
        setAuthErrorCode('rate_limited');
        setAuthError(data.error || 'Too many admin login attempts. Account temporarily locked for 15 minutes.');
        return;
      }

      if (data.code === 'otp_unavailable') {
        setAuthErrorCode('otp_unavailable');
        setAuthError(data.error || 'Email verification is not configured on this server.');
        return;
      }

      if (data.code === 'otp_send_failed') {
        setAuthErrorCode('otp_send_failed');
        setAuthError("We couldn't send the code. Please try again.");
        return;
      }

      if (res.status === 503) {
        setAuthErrorCode('otp_unavailable');
        setAuthError(data.error || 'Email verification is not configured on this server.');
        return;
      }

      if (res.status >= 500) {
        setAuthError(data.error || 'Server error encountered. Please check server logs or try again later.');
        return;
      }

      if (data.error) {
        setAuthError(data.error);
      }
    } catch {
      setAuthError('Connection error. Could not verify administrator identity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP code
  const handleVerifyOtp = async (code: string) => {
    if (!code || code.length !== 6 || isSubmitting) return;
    setAuthError(null);
    setAuthSuccess(null);
    setAuthErrorCode(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.admin) {
        setAdminUser(data.admin);
        setAuthStep('login');
        setAuthSuccess('Session authenticated successfully.');
        return;
      }

      if (res.status === 401) {
        setAuthErrorCode(data.code || 'otp_invalid');
        setAttemptsLeft(data.attemptsLeft ?? null);
        setAuthError(data.error || 'Invalid verification code.');
        return;
      }

      if (res.status === 429) {
        setAuthErrorCode(data.code || 'otp_locked');
        setAttemptsLeft(0);
        setAuthError(data.error || 'Too many failed attempts. This code has been locked.');
        return;
      }

      setAuthError(data.error || 'Verification failed. Please try again.');
    } catch {
      setAuthError('Connection error. Could not verify code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2b: Resend OTP code
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    setAuthError(null);
    setAuthErrorCode(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setResendCountdown(data.resendAfter || 60);
        setAuthSuccess('A fresh verification code was sent to your email.');
        return;
      }

      if (res.status === 429) {
        setAuthError(data.error || 'Please wait before requesting another code.');
        if (data.retryAfterSeconds) {
          setResendCountdown(data.retryAfterSeconds);
        }
        return;
      }

      if (data.code === 'otp_unavailable') {
        setAuthErrorCode('otp_unavailable');
        setAuthError(data.error || 'Email verification is not configured on this server.');
        return;
      }

      if (data.code === 'otp_send_failed') {
        setAuthErrorCode('otp_send_failed');
        setAuthError("We couldn't send the code. Please try again.");
        return;
      }

      setAuthError(data.error || 'Could not resend code. Please sign in again.');
    } catch {
      setAuthError('Connection error during code resend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToLogin = () => {
    setAuthStep('login');
    setAuthError(null);
    setAuthErrorCode(null);
    setAttemptsLeft(null);
    setLoginPassword('');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setAdminUser(null);
    setLoginPassword('');
    setAuthStep('login');
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
        <LiquidLoaderScreen
          label="Validating Administrator Clearance..."
          subtitle="SECURE ENCLAVE INITIALIZING"
        />
      </div>
    );
  }

  // Unauthenticated: render <AuthCard variant="admin" />
  if (!adminUser) {
    return (
      <div className="admin-portal-root min-h-dvh flex flex-col items-center justify-center p-3 sm:p-4 bg-[var(--admin-page-bg)] relative overflow-hidden transition-colors duration-300">
        {/* Subtle decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(var(--admin-text-main) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Back to Chemora Public Platform link */}
        <div className="w-full max-w-[430px] mb-2 sm:mb-3 flex items-center justify-start z-10 px-1">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Chemora Academy
          </a>
        </div>

        {/* Control Room Auth Card */}
        <div className="w-full max-w-[430px] z-10 flex flex-col items-center">
          <AdminAuthCard
            email={loginEmail}
            onEmailChange={setLoginEmail}
            password={loginPassword}
            onPasswordChange={setLoginPassword}
            isSubmitting={isSubmitting}
            error={authError}
            errorCode={authErrorCode}
            attemptsLeft={attemptsLeft}
            onClearError={() => setAuthError(null)}
            success={authSuccess}
            onClearSuccess={() => setAuthSuccess(null)}
            onSignIn={handleSignIn}
            step={authStep}
            maskedEmail={maskedEmail}
            onVerifyOtp={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            onResetToLogin={handleResetToLogin}
            resendCountdown={resendCountdown}
            expiresIn={expiresIn}
          />
        </div>

        {/* Security disclaimer footer */}
        <div className="mt-2 sm:mt-3 text-center text-[10px] sm:text-[11px] text-[var(--admin-text-muted)] z-10 font-mono">
          <span>Protected by Chemora Administrative Protocol</span> &bull;{' '}
          <span>Unauthorised access attempts are logged with client IP origin</span>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout (CSS Grid: Dedicated rail column + Centered content)
  const adminFirstName = typeof adminUser?.name === 'string' && adminUser.name.trim() ? adminUser.name.split(' ')[0] : 'Administrator';
  const pendingReviewsCount = statsData?.pendingReviewsCount || 0;

  return (
    <div className="admin-portal-root min-h-screen bg-[var(--admin-page-bg)] text-[var(--admin-text-main)] transition-colors duration-300">
      <div className="admin-portal-grid">
        {/* 1. Sticky Left Rail (Dedicated column in CSS Grid) */}
        <AdminSidebarRail
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={handleSignOut}
          adminName={adminUser.name || 'Admin'}
          adminEmail={adminUser.email}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* 2. Main Portal Stage (Centered, min-width: 0, safe padding bottom >= 96px) */}
        <main className="admin-content-stage flex flex-col gap-6">
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

          {activeTab === 'devops' && <AdminDevOpsTab />}

          {activeTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>

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
