import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { OtpCard } from './OtpCard';
import { LiquidLoader } from '../ui/LiquidLoader';

export interface AdminAuthCardProps {
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  isSubmitting: boolean;
  error: string | null;
  errorCode?: string | null;
  attemptsLeft?: number | null;
  onClearError?: () => void;
  success: string | null;
  onClearSuccess?: () => void;
  onSignIn: (e: React.FormEvent) => void;
  // Mandatory Email OTP step props
  step: 'login' | 'otp';
  maskedEmail?: string;
  onVerifyOtp: (code: string) => void;
  onResendOtp: () => Promise<void>;
  onResetToLogin: () => void;
  resendCountdown: number;
  expiresIn?: number;
}

export const AdminAuthCard: React.FC<AdminAuthCardProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isSubmitting,
  error,
  errorCode,
  attemptsLeft,
  onClearError,
  success,
  onClearSuccess,
  onSignIn,
  step,
  maskedEmail,
  onVerifyOtp,
  onResendOtp,
  onResetToLogin,
  resendCountdown,
  expiresIn = 600,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 'login') {
      emailInputRef.current?.focus();
    }
  }, [step]);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setForgotNotice('Please enter your staff email above first.');
      return;
    }
    setIsSendingForgot(true);
    setForgotNotice(null);
    try {
      await fetch('/api/account/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setForgotNotice('If an account exists with that email, password reset instructions have been sent.');
    } catch {
      setForgotNotice('If an account exists with that email, password reset instructions have been sent.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  // If in step 'otp', render the embossed neumorphic OtpCard with smooth rise-in transition
  if (step === 'otp') {
    return (
      <OtpCard
        maskedEmail={maskedEmail || email}
        onVerifyOtp={onVerifyOtp}
        onResendOtp={onResendOtp}
        onResetToLogin={onResetToLogin}
        isSubmitting={isSubmitting}
        error={error}
        errorCode={errorCode}
        attemptsLeft={attemptsLeft}
        onClearError={onClearError}
        success={success}
        onClearSuccess={onClearSuccess}
        resendCountdown={resendCountdown}
        expiresIn={expiresIn}
      />
    );
  }

  // Step 'login': Staff Email + Password step
  return (
    <div className="w-full max-w-[460px] mx-auto transition-all duration-220">
      <div className="relative rounded-[32px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[0_20px_50px_rgba(0,0,0,0.12)] pt-9 pb-8 px-6 sm:px-9 backdrop-blur-xl transition-all overflow-hidden">
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-cyan-200 shadow-lg shadow-cyan-950/30 mb-3 border border-cyan-400/20">
            <ShieldCheck className="w-7 h-7 text-cyan-300" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
            <span>Administrative Enclave</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--admin-text-main)] tracking-tight">
            Staff Sign In
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1.5 max-w-[320px] leading-relaxed">
            Enter staff credentials to unlock administrative controls.
          </p>
        </div>

        {/* Live Alerts Area */}
        <div aria-live="polite" className="space-y-2 mb-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{error}</div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-sm font-bold cursor-pointer p-0.5"
                  aria-label="Dismiss error"
                >
                  &times;
                </button>
              )}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{success}</span>
              {onClearSuccess && (
                <button
                  type="button"
                  onClick={onClearSuccess}
                  className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 text-sm font-bold cursor-pointer p-0.5"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              )}
            </div>
          )}

          {forgotNotice && (
            <div
              role="status"
              className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 text-cyan-800 dark:text-cyan-300 text-xs font-medium flex items-start gap-2"
            >
              <span className="flex-1 leading-snug">{forgotNotice}</span>
              <button
                type="button"
                onClick={() => setForgotNotice(null)}
                className="text-cyan-400 hover:text-cyan-600 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Email & Password Form */}
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
                autoComplete="username email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="admin@chemora.edu"
                className="w-full pl-10 pr-3.5 py-3 min-h-[44px] rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-[16px] sm:text-sm text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-bold text-[var(--admin-text-main)] uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSendingForgot}
                className="text-[11px] font-bold text-cyan-500 hover:text-cyan-400 transition hover:underline cursor-pointer disabled:opacity-50"
              >
                {isSendingForgot ? 'Sending...' : 'Forgot?'}
              </button>
            </div>
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
                className="w-full pl-10 pr-10 py-3 min-h-[44px] rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-[16px] sm:text-sm text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] p-1.5 rounded cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
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
            {isSubmitting ? (
              <>
                <LiquidLoader size="xs" label="Checking credentials..." />
                <span>Checking credentials...</span>
              </>
            ) : (
              <span>Continue to Verification</span>
            )}
          </button>
        </form>

        {/* Security Policy Footer Notice */}
        <div className="mt-6 pt-4 border-t border-[var(--admin-card-border)] text-center">
          <p className="text-[11px] text-[var(--admin-text-muted)] font-mono leading-relaxed">
            Protected by Chemora Administrative Protocol. Mandatory email OTP required for all sessions.
          </p>
        </div>
      </div>
    </div>
  );
};
