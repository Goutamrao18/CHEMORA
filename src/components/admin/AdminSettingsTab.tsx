import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  Bot,
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
  }, []);

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
