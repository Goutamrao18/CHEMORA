import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { BubbleDots } from '../Loaders';

export interface AdminAuthCardProps {
  isVerifyingState: boolean;
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  verifyCode: string;
  onVerifyCodeChange: (code: string) => void;
  isSubmitting: boolean;
  error: string | null;
  onClearError?: () => void;
  success: string | null;
  onClearSuccess?: () => void;
  onSignIn: (e: React.FormEvent) => void;
  onVerifySubmit: (e: React.FormEvent) => void;
  onCancel2FA: () => void;
}

export const AdminAuthCard: React.FC<AdminAuthCardProps> = ({
  isVerifyingState,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  verifyCode,
  onVerifyCodeChange,
  isSubmitting,
  error,
  onClearError,
  success,
  onClearSuccess,
  onSignIn,
  onVerifySubmit,
  onCancel2FA,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const verifyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isVerifyingState) {
      verifyInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [isVerifyingState]);

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="relative rounded-[32px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-7 sm:p-9 backdrop-blur-xl transition-all">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-cyan-200 shadow-lg shadow-cyan-950/30 mb-3 border border-cyan-400/20">
            {isVerifyingState ? <KeyRound className="w-7 h-7 text-cyan-300" /> : <ShieldCheck className="w-7 h-7 text-cyan-300" />}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
            <span>Administrative Enclave</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--admin-text-main)] tracking-tight">
            {isVerifyingState ? 'Two-Factor Verification' : 'Chemora Control Room'}
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1 max-w-[300px]">
            {isVerifyingState
              ? `Enter the 6-digit TOTP code generated for ${email}`
              : 'Enter staff credentials to unlock administrative controls.'}
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
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold"
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
                  className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 text-sm font-bold"
                  aria-label="Dismiss message"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {/* Form State 1: Credential Authentication */}
        {!isVerifyingState ? (
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
        ) : (
          /* Form State 2: Two-Factor TOTP Verification */
          <form onSubmit={onVerifySubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-totp-code"
                  className="text-[11px] font-bold text-[var(--admin-text-main)] uppercase tracking-wider"
                >
                  6-Digit Security Token
                </label>
                <span className="text-[10px] font-mono text-[var(--admin-text-muted)]">Step 2 of 2</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--admin-text-muted)] absolute left-3.5 top-4 pointer-events-none" />
                <input
                  ref={verifyInputRef}
                  id="admin-totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={verifyCode}
                  onChange={(e) => onVerifyCodeChange(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-center tracking-[0.35em] font-mono text-xl font-black text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || verifyCode.length !== 6}
              aria-busy={isSubmitting}
              className="w-full min-h-[48px] mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-cyan-500"
            >
              {isSubmitting ? <BubbleDots label="Verifying token..." /> : <span>Verify &amp; Unlock Portal</span>}
            </button>

            <button
              type="button"
              onClick={onCancel2FA}
              className="w-full py-2 text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to credential login
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-[var(--admin-card-border)] text-center">
          <p className="text-[11px] text-[var(--admin-text-muted)] font-mono leading-relaxed">
            Protected by Chemora Multi-Factor Protocol. 5 failed login attempts trigger an automated 15-minute lockout.
          </p>
        </div>
      </div>
    </div>
  );
};
