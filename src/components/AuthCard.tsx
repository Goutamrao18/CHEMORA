import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GradientWaves } from './GradientWaves';
import { BubbleDots } from './Loaders';

export interface AuthCardProps {
  isRegister: boolean;
  onToggleMode: (isRegister: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  fullName?: string;
  onFullNameChange?: (fullName: string) => void;
  agreeTerms?: boolean;
  onAgreeTermsChange?: (agree: boolean) => void;
  confirmAge?: boolean;
  onConfirmAgeChange?: (confirm: boolean) => void;
  rememberMe?: boolean;
  onRememberMeChange?: (remember: boolean) => void;
  isSubmitting: boolean;
  error: string | null;
  onClearError?: () => void;
  success: string | null;
  onClearSuccess?: () => void;
  onSignIn: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
  onGoogleSignIn?: () => void;
  onForgotPassword?: (email: string) => void;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  isRegister,
  onToggleMode,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  fullName = '',
  onFullNameChange,
  agreeTerms = false,
  onAgreeTermsChange,
  confirmAge = false,
  onConfirmAgeChange,
  rememberMe = true,
  onRememberMeChange,
  isSubmitting,
  error,
  onClearError,
  success,
  onClearSuccess,
  onSignIn,
  onSignUp,
  onGoogleSignIn,
  onForgotPassword,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(email);

  // Accessible focus management: focus moves to the first field after switching
  const loginEmailRef = useRef<HTMLInputElement | null>(null);
  const registerNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isRegister) {
        registerNameRef.current?.focus();
      } else {
        loginEmailRef.current?.focus();
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [isRegister]);

  // Keep recovery email in sync
  useEffect(() => {
    if (email && !forgotEmail) {
      setForgotEmail(email);
    }
  }, [email, forgotEmail]);

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onForgotPassword && forgotEmail.trim()) {
      onForgotPassword(forgotEmail.trim());
      setShowForgotModal(false);
    }
  };

  return (
    <div className={`relative w-full flex items-center justify-center ${className}`}>
      {/* Centered Sliding Card: 660x520 on desktop, radius 32px, white bg, 8px white border */}
      <div
        className={`auth-card ${isRegister ? 'register' : ''}`}
        aria-live="polite"
      >
        {/* ========================================================
            1. SLIDING DARK PANEL (card-bg)
            Positioned at 50% width, full height, radius 26px, #04212b
            Contains its own dark wave canvas
            ======================================================== */}
        <div className="card-bg" aria-hidden="true">
          <GradientWaves
            horizonColor="#032b38"
            waveColor="#14a3c4"
            crestColor="#7fdcef"
            amplitude={3.2}
            fogDepth={22}
            brightness={0.9}
            mouseInteraction={false}
            grain={false}
          />
        </div>

        {/* ========================================================
            2. HERO CONTENT: LOGIN HERO
            ======================================================== */}
        <div className="hero-element login-hero">
          <div className="hero-content">
            <h2>Welcome back</h2>
            <p>Pick up your experiments where you left off.</p>
            <button
              type="button"
              onClick={() => {
                onClearError?.();
                onClearSuccess?.();
                onToggleMode(true);
              }}
              className="switch-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* ========================================================
            3. HERO CONTENT: REGISTER HERO
            ======================================================== */}
        <div className="hero-element register-hero">
          <div className="hero-content">
            <h2>Hello, researcher</h2>
            <p>Create your lab account and start your first challenge.</p>
            <button
              type="button"
              onClick={() => {
                onClearError?.();
                onClearSuccess?.();
                onToggleMode(false);
              }}
              className="switch-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Sign in
            </button>
          </div>
        </div>

        {/* ========================================================
            4. FORM ELEMENT: LOGIN FORM
            ======================================================== */}
        <div className="form-element login-form" role="region" aria-label="Sign In">
          <div className="w-full max-w-[280px] mx-auto my-auto space-y-3.5">
            <div className="text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-[#04212b] tracking-tight">
                Sign In
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your lab email to access your workspace.
              </p>
            </div>

            {/* Error / Success Alerts */}
            <div aria-live="polite">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{error}</span>
                  {onClearError && (
                    <button
                      type="button"
                      onClick={onClearError}
                      className="text-rose-400 hover:text-rose-600"
                      aria-label="Dismiss error"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}
              {success && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{success}</span>
                  {onClearSuccess && (
                    <button
                      type="button"
                      onClick={onClearSuccess}
                      className="text-emerald-400 hover:text-emerald-600"
                      aria-label="Dismiss message"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={onSignIn} className="space-y-3">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    ref={loginEmailRef}
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="curie@chemora.edu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#04212b] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="login-password"
                    className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-medium text-cyan-700 hover:text-cyan-900 transition underline underline-offset-2"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#04212b] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => onRememberMeChange?.(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#04212b] accent-[#04212b] focus-visible:ring-cyan-500 cursor-pointer"
                />
                <label
                  htmlFor="login-remember"
                  className="text-xs text-slate-600 select-none cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              {/* Dark Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-[#04212b] hover:bg-[#073646] active:bg-[#02141a] text-white font-medium text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                {isSubmitting ? <BubbleDots label="Authenticating..." /> : <span>Sign In</span>}
              </button>

              {/* "Or" Divider and Google Sign-In */}
              {onGoogleSignIn && (
                <>
                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-2.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                      Or
                    </span>
                    <div className="border-t border-slate-200 w-full" />
                  </div>

                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}
            </form>

            {/* Small Legal Text */}
            <p className="text-[10px] text-center text-slate-400 pt-0.5">
              By signing in, you agree to our{' '}
              <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 underline">
                Terms
              </a>{' '}
              &amp;{' '}
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 underline">
                Privacy
              </a>.
            </p>
          </div>
        </div>

        {/* ========================================================
            5. FORM ELEMENT: REGISTER FORM
            ======================================================== */}
        <div className="form-element register-form" role="region" aria-label="Create Account">
          <div className="w-full max-w-[280px] mx-auto my-auto space-y-3">
            <div className="text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-[#04212b] tracking-tight">
                Create Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Join the laboratory to track your chemistry discoveries.
              </p>
            </div>

            {/* Error / Success Alerts */}
            <div aria-live="polite">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{error}</span>
                  {onClearError && (
                    <button
                      type="button"
                      onClick={onClearError}
                      className="text-rose-400 hover:text-rose-600"
                      aria-label="Dismiss error"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}
              {success && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-snug">{success}</span>
                  {onClearSuccess && (
                    <button
                      type="button"
                      onClick={onClearSuccess}
                      className="text-emerald-400 hover:text-emerald-600"
                      aria-label="Dismiss message"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={onSignUp} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    ref={registerNameRef}
                    id="register-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => onFullNameChange?.(e.target.value)}
                    placeholder="Rosalind Franklin"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#04212b] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="franklin@chemora.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#04212b] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Password (min 10 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#04212b] focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms and Age Compliance */}
              <div className="space-y-1.5 pt-0.5 text-[11px] text-slate-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => onAgreeTermsChange?.(e.target.checked)}
                    className="w-3.5 h-3.5 rounded mt-0.5 border-slate-300 text-[#04212b] accent-[#04212b] cursor-pointer"
                  />
                  <span className="leading-tight">
                    I agree to the{' '}
                    <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-[#04212b] font-medium underline">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[#04212b] font-medium underline">
                      Privacy Policy
                    </a>.
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={confirmAge}
                    onChange={(e) => onConfirmAgeChange?.(e.target.checked)}
                    className="w-3.5 h-3.5 rounded mt-0.5 border-slate-300 text-[#04212b] accent-[#04212b] cursor-pointer"
                  />
                  <span className="leading-tight">
                    I confirm I am 13+ or have guardian consent.
                  </span>
                </label>
              </div>

              {/* Dark Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreeTerms || !confirmAge}
                aria-busy={isSubmitting}
                className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-[#04212b] hover:bg-[#073646] active:bg-[#02141a] text-white font-medium text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                {isSubmitting ? (
                  <BubbleDots label="Creating account..." />
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Small Legal Text */}
            <p className="text-[10px] text-center text-slate-400">
              Laboratory profiles adhere strictly to GDPR &amp; CCPA standards.
            </p>
          </div>
        </div>
      </div>

      {/* Accessible Password Recovery Modal Dialog */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 anim-popup">
            <h4 id="forgot-title" className="text-lg font-bold text-[#04212b]">
              Reset Password
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter your email address and we'll dispatch a secure recovery link.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="recovery-email" className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="curie@chemora.edu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-[#04212b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !forgotEmail.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#04212b] hover:bg-[#073646] text-xs font-semibold text-white shadow transition disabled:opacity-50"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
