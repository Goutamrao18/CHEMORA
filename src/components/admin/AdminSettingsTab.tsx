import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  Bot,
  AlertTriangle,
  Save,
  Check,
  CheckCircle2,
  Clock,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SystemSettings {
  aiTutorEnabled: boolean;
  maintenanceBanner: boolean;
  maintenanceMessage?: string;
  autoModLevel: 'strict' | 'standard' | 'lenient';
  idleTimeoutMinutes: number;
}

export const AdminSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    aiTutorEnabled: true,
    maintenanceBanner: false,
    maintenanceMessage: 'System undergoing routine maintenance. Experiments remain accessible.',
    autoModLevel: 'standard',
    idleTimeoutMinutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 2FA Management State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnrolling2FA, setIsEnrolling2FA] = useState(false);
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorSecretKey, setTwoFactorSecretKey] = useState<string | null>(null);
  const [confirm2FaCode, setConfirm2FaCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorStatusMsg, setTwoFactorStatusMsg] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  const fetch2FaStatus = async () => {
    try {
      const res = await fetch('/api/admin/2fa/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(Boolean(data.enabled));
      }
    } catch {}
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    fetch2FaStatus();
  }, []);

  const handleStart2FaEnrollment = async () => {
    setTwoFactorError(null);
    setTwoFactorStatusMsg(null);
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/admin/2fa/generate', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorQr(data.qrCodeDataUrl);
        setTwoFactorSecretKey(data.secret);
        setIsEnrolling2FA(true);
      } else {
        setTwoFactorError('Could not generate 2FA secret. Please try again.');
      }
    } catch {
      setTwoFactorError('Network error starting 2FA setup.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleConfirm2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm2FaCode || !twoFactorSecretKey) return;
    setTwoFactorError(null);
    setTwoFactorLoading(true);

    try {
      const res = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: confirm2FaCode.trim(), secret: twoFactorSecretKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || 'Invalid verification code.');
        return;
      }

      setTwoFactorEnabled(true);
      setIsEnrolling2FA(false);
      setTwoFactorQr(null);
      setTwoFactorSecretKey(null);
      setConfirm2FaCode('');
      setTwoFactorStatusMsg('Two-factor authentication successfully enabled!');
      setTimeout(() => setTwoFactorStatusMsg(null), 4000);
    } catch {
      setTwoFactorError('Failed to verify 2FA code.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode) return;
    setTwoFactorError(null);
    setTwoFactorLoading(true);

    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: disableCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTwoFactorError(data.error || 'Failed to disable 2FA. Check your code.');
        return;
      }

      setTwoFactorEnabled(false);
      setIsDisabling2FA(false);
      setDisableCode('');
      setTwoFactorStatusMsg('Two-factor authentication has been disabled.');
      setTimeout(() => setTwoFactorStatusMsg(null), 4000);
    } catch {
      setTwoFactorError('Network error while disabling 2FA.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner notification */}
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Configuration committed successfully and logged to administrative audit trail.
          </motion.div>
        )}

        {/* Feature Flags Section */}
        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--admin-card-border)]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--admin-text-main)]">Platform Feature Flags</h3>
              <p className="text-xs text-[var(--admin-text-muted)]">Control user-facing modules and live AI assistance</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* AI Tutor Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)]">
              <div>
                <div className="font-semibold text-xs text-[var(--admin-text-main)]">CHEMORA AI Chemistry Tutor</div>
                <div className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                  Allows students to query real-time lab hints, stoichiometric solvers, and concept breakdowns.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aiTutorEnabled}
                  onChange={(e) => setSettings({ ...settings, aiTutorEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-[var(--admin-text-main)]">System Maintenance Banner</div>
                  <div className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
                    Displays a non-intrusive broadcast notice across all active student laboratory viewports.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceBanner}
                    onChange={(e) => setSettings({ ...settings, maintenanceBanner: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {settings.maintenanceBanner && (
                <div>
                  <label className="text-[11px] font-bold text-[var(--admin-text-muted)] block mb-1">
                    Banner Message
                  </label>
                  <input
                    type="text"
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Moderation & Security Section */}
        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--admin-card-border)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--admin-text-main)]">Moderation & Session Hardening</h3>
              <p className="text-xs text-[var(--admin-text-muted)]">Configure automated review filtering sensitivity and timeouts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Mod Level */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-2">
              <label className="text-xs font-semibold text-[var(--admin-text-main)] block">
                Automated Review Filtering
              </label>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                Threshold for auto-approving ratings above 3 stars without toxic keywords.
              </p>
              <select
                value={settings.autoModLevel}
                onChange={(e) => setSettings({ ...settings, autoModLevel: e.target.value as any })}
                className="w-full h-10 px-3 rounded-xl bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="strict">Strict (Manual approval for all reviews)</option>
                <option value="standard">Standard (Keyword heuristic auto-pass)</option>
                <option value="lenient">Lenient (Auto-approve 4+ star ratings)</option>
              </select>
            </div>

            {/* Session Idle Timeout */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-2">
              <label className="text-xs font-semibold text-[var(--admin-text-main)] block">
                Admin Session Idle Timeout
              </label>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                Inactivity threshold before the httpOnly cookie session expires.
              </p>
              <select
                value={settings.idleTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, idleTimeoutMinutes: parseInt(e.target.value, 10) })}
                className="w-full h-10 px-3 rounded-xl bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Default)</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication (TOTP) Card */}
        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-card-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--admin-text-main)]">Two-Factor Authentication (2FA)</h3>
                <p className="text-xs text-[var(--admin-text-muted)]">TOTP authenticator security (Google Authenticator, Authy, 1Password)</p>
              </div>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  twoFactorEnabled
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {twoFactorEnabled ? '2FA Enabled' : '2FA Not Configured'}
              </span>
            </div>
          </div>

          {twoFactorStatusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {twoFactorStatusMsg}
            </div>
          )}

          {twoFactorError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              {twoFactorError}
            </div>
          )}

          {!twoFactorEnabled && !isEnrolling2FA && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--admin-text-muted)]">
                Protect your administrator account with hardware or mobile Time-Based One-Time Passwords (TOTP).
                Once enabled, every admin login will require a 6-digit dynamic code from your authenticator application.
              </p>
              <button
                type="button"
                onClick={handleStart2FaEnrollment}
                disabled={twoFactorLoading}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow"
              >
                <Shield className="w-4 h-4" />
                {twoFactorLoading ? 'Generating QR Code...' : 'Enrol in Two-Factor Authentication'}
              </button>
            </div>
          )}

          {isEnrolling2FA && (
            <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-4">
              <h4 className="text-xs font-bold text-[var(--admin-text-main)]">1. Scan QR Code in Authenticator App</h4>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
              </p>

              {twoFactorQr && (
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-white dark:bg-black/40 border border-[var(--admin-card-border)] w-fit">
                  <img src={twoFactorQr} alt="2FA QR Code" className="w-40 h-40 rounded-lg shadow-sm" />
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Manual Entry Secret Key:</p>
                    <code className="block p-2 rounded bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono text-xs select-all break-all">
                      {twoFactorSecretKey}
                    </code>
                    <p className="text-[10px] text-slate-500">Key is encrypted at rest using AES-256-GCM.</p>
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <label className="text-xs font-semibold text-[var(--admin-text-main)] block">
                  2. Enter 6-digit confirmation code from your app:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={confirm2FaCode}
                    onChange={(e) => setConfirm2FaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-36 h-10 px-3.5 rounded-xl text-center font-mono text-base tracking-widest bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-[var(--admin-text-main)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleConfirm2Fa}
                    disabled={twoFactorLoading || confirm2FaCode.length !== 6}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {twoFactorLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEnrolling2FA(false);
                      setTwoFactorQr(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {twoFactorEnabled && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--admin-text-muted)]">
                Your administrator account is actively protected with Time-Based Two-Factor Authentication.
              </p>
              {!isDisabling2FA ? (
                <button
                  type="button"
                  onClick={() => setIsDisabling2FA(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                >
                  Disable Two-Factor Authentication
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    Confirm disabling 2FA with your current 6-digit authenticator code:
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Current 6 digits"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                      className="w-36 h-10 px-3.5 rounded-xl text-center font-mono text-sm bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-[var(--admin-text-main)] focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleDisable2Fa}
                      disabled={twoFactorLoading || disableCode.length !== 6}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      {twoFactorLoading ? 'Disabling...' : 'Confirm Disable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDisabling2FA(false)}
                      className="px-3 py-2 rounded-xl text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#04212b] to-[#14a3c4] text-white hover:opacity-90 disabled:opacity-50 text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4 text-cyan-300" />
            {saving ? 'Committing Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
