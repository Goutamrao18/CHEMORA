import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BubbleDots } from '../Loaders';

export interface AdminAuthCardProps {
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onClearError?: () => void;
  success: string | null;
  onClearSuccess?: () => void;
  onSignIn: (e: React.FormEvent) => void;
  // Optional legacy props kept for seamless backward compatibility
  isVerifyingState?: boolean;
  verifyCode?: string;
  onVerifyCodeChange?: (code: string) => void;
  onVerifySubmit?: (e: React.FormEvent) => void;
  onCancel2FA?: () => void;
}

export const AdminAuthCard: React.FC<AdminAuthCardProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isSubmitting,
  error,
  onClearError,
  success,
  onClearSuccess,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="relative rounded-[32px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-7 sm:p-9 backdrop-blur-xl transition-all">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-cyan-200 shadow-lg shadow-cyan-950/30 mb-3 border border-cyan-400/20">
            <ShieldCheck className="w-7 h-7 text-cyan-300" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
            <span>Administrative Enclave</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--admin-text-main)] tracking-tight">
            Chemora Control Room
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1 max-w-[300px]">
            Enter staff credentials to unlock administrative controls.
          </p>
        </div>

        {/* Alerts */}
        <div aria-live="polite" className="space-y-2 mb-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{error}</span>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold cursor-pointer"
                  aria-label="Dismiss error"
                >
                  &times;
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{success}</span>
              {onClearSuccess && (
                <button
                  type="button"
                  onClick={onClearSuccess}
                  className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 text-sm font-bold cursor-pointer"
                  aria-label="Dismiss message"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Credential Authentication Form (Direct sign-in without 2FA) */}
        <form onSubmit={onSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[11px] font-bold text-[var(--admin-text-main)] uppercase tracking-wider mb-1.5"
            >
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--admin-text-muted)] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                ref={emailInputRef}
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="admin@chemora.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-sm text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-bold text-[var(--admin-text-main)] uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--admin-text-muted)] absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-sm text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] p-0.5 rounded cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password}
            aria-busy={isSubmitting}
            className="w-full min-h-[48px] mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#04212b] to-[#0a485c] hover:from-[#063140] hover:to-[#0f5b74] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-cyan-500"
          >
            {isSubmitting ? <BubbleDots label="Authenticating session..." /> : <span>Authenticate Credentials</span>}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-[var(--admin-card-border)] text-center">
          <p className="text-[11px] text-[var(--admin-text-muted)] font-mono leading-relaxed">
            Protected by Chemora Administrative Protocol. 5 failed login attempts trigger an automated 15-minute lockout.
          </p>
        </div>
      </div>
    </div>
  );
};
