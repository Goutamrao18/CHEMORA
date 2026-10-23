import React, { useState, useRef, useEffect, useCallback } from 'react';
import { KeyRound, AlertCircle, ArrowLeft, RotateCw } from 'lucide-react';
import { LiquidLoader } from '../ui/LiquidLoader';

export interface OtpCardProps {
  maskedEmail: string;
  onVerifyOtp: (code: string) => void;
  onResendOtp: () => Promise<void>;
  onResetToLogin: () => void;
  isSubmitting: boolean;
  error: string | null;
  errorCode?: string | null;
  attemptsLeft?: number | null;
  onClearError?: () => void;
  success: string | null;
  onClearSuccess?: () => void;
  resendCountdown: number;
  expiresIn?: number; // Duration in seconds (default 600)
}

export const OtpCard: React.FC<OtpCardProps> = ({
  maskedEmail,
  onVerifyOtp,
  onResendOtp,
  onResetToLogin,
  isSubmitting,
  error,
  errorCode,
  attemptsLeft,
  onClearError,
  success,
  onClearSuccess,
  resendCountdown,
  expiresIn = 600,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [shouldShake, setShouldShake] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(expiresIn);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Expiration countdown timer (10 min by default)
  useEffect(() => {
    setTimeRemaining(expiresIn);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  // Trigger error shake on error update
  useEffect(() => {
    if (error) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 350);
      return () => clearTimeout(timer);
    }
  }, [error, errorCode, attemptsLeft]);

  // Clean formatted time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = useCallback((index: number, val: string) => {
    if (onClearError) onClearError();
    const clean = val.replace(/\D/g, '');
    
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const single = clean.slice(-1);
    const next = [...digits];
    next[index] = single;
    setDigits(next);

    // Advance to next box if not at the end
    if (index < 5 && single) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Auto-submit after 6th digit entered (150ms debounce)
    const isComplete = next.every((d) => d.length === 1);
    if (isComplete) {
      if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current);
      submitDebounceRef.current = setTimeout(() => {
        onVerifyOtp(next.join(''));
      }, 150);
    }
  }, [digits, onClearError, onVerifyOtp]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (onClearError) onClearError();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    if (pasted.length >= 6) {
      inputRefs.current[5]?.focus();
      setFocusedIndex(5);
      if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current);
      submitDebounceRef.current = setTimeout(() => {
        onVerifyOtp(pasted.slice(0, 6));
      }, 150);
    } else {
      inputRefs.current[pasted.length]?.focus();
      setFocusedIndex(pasted.length);
    }
  };

  const isComplete = digits.every((d) => d.length === 1);
  const isLocked = errorCode === 'otp_locked';
  const isExpired = errorCode === 'otp_expired' || timeRemaining === 0;

  return (
    <div className="w-full max-w-[460px] mx-auto otp-card-enter">
      {/* Neumorphic Embossed Card Container */}
      <div className="relative rounded-[28px] p-6 sm:p-9 transition-all duration-300 otp-surface-light dark:otp-surface-dark backdrop-blur-xl">
        {/* Top Raised Circular Lock Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-300 otp-raised-light dark:otp-raised-dark border border-cyan-500/20 mb-4 transition-transform hover:scale-105">
            <KeyRound className="w-7 h-7 text-cyan-500 dark:text-cyan-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase mb-2">
            <span>Identity Verification</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            Verify it&apos;s you
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] leading-relaxed">
            We&apos;ve sent a 6-digit verification code to
            <br />
            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300 tracking-wide">
              {maskedEmail || 'your staff address'}
            </span>
          </p>
        </div>

        {/* Live Alerts & Error Display */}
        <div aria-live="polite" className="space-y-2 mb-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                {errorCode === 'otp_invalid' && typeof attemptsLeft === 'number' ? (
                  <span>
                    Invalid verification code. You have <strong>{attemptsLeft}</strong>{' '}
                    {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining before this code is locked.
                  </span>
                ) : errorCode === 'otp_locked' ? (
                  <div>
                    <span>Too many failed attempts. This code has been locked for security. Please sign in again.</span>
                    {onResetToLogin && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={onResetToLogin}
                          className="font-bold underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                        >
                          Start over
                        </button>
                      </div>
                    )}
                  </div>
                ) : errorCode === 'otp_expired' ? (
                  <div>
                    <span>Verification code has expired. Please request a new code or sign in again.</span>
                    {onResetToLogin && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={onResetToLogin}
                          className="font-bold underline text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                        >
                          Start over
                        </button>
                      </div>
                    )}
                  </div>
                ) : errorCode === 'otp_unavailable' ? (
                  <span>Email verification is not configured on this server.</span>
                ) : errorCode === 'otp_send_failed' ? (
                  <span>We couldn&apos;t send the code. Please try again.</span>
                ) : errorCode === 'rate_limited' ? (
                  <span>Too many attempts, please wait.</span>
                ) : (
                  <span>{error}</span>
                )}
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-100 text-sm font-bold cursor-pointer p-0.5"
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
              className="p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-start gap-2"
            >
              <span className="flex-1 leading-snug">{success}</span>
              {onClearSuccess && (
                <button
                  type="button"
                  onClick={onClearSuccess}
                  className="text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-100 text-sm font-bold cursor-pointer"
                  aria-label="Dismiss message"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {/* 6 Digit Neumorphic Boxes */}
        <div className={`my-6 ${shouldShake ? 'anim-otp-shake' : ''}`}>
          <div className="flex justify-between items-center gap-1.5 sm:gap-2.5">
            {digits.map((digit, idx) => {
              const isFocused = focusedIndex === idx;
              const hasVal = Boolean(digit);
              const isPressed = isFocused || hasVal;

              return (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  value={digit}
                  disabled={isSubmitting || isLocked}
                  onFocus={() => setFocusedIndex(idx)}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${idx + 1} of 6`}
                  className={`w-11 sm:w-13 h-13 sm:h-15 rounded-[14px] text-center text-xl font-mono font-black transition-all duration-200 outline-none select-none min-h-[44px] min-w-[40px] ${
                    isPressed
                      ? 'otp-pressed-light dark:otp-pressed-dark text-cyan-600 dark:text-cyan-300 border-2 border-[#14a3c4] shadow-[0_0_12px_rgba(20,163,196,0.25)]'
                      : 'otp-raised-light dark:otp-raised-dark text-slate-700 dark:text-slate-200 border border-black/5 dark:border-white/5 hover:border-cyan-500/30'
                  }`}
                />
              );
            })}
          </div>

          {/* Expiration Countdown Indicator */}
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
            <span>Security Challenge</span>
            <span className={timeRemaining <= 60 ? 'text-rose-500 font-bold' : ''}>
              {timeRemaining > 0 ? (
                `Code expires in ${formatTime(timeRemaining)}`
              ) : (
                <span className="text-rose-500 font-bold">Code expired</span>
              )}
            </span>
          </div>
        </div>

        {/* Lockout / Expired Action or Wide Verify Button */}
        {isLocked ? (
          <button
            type="button"
            onClick={onResetToLogin}
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold text-sm shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lockout Activated — Return to Sign In</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onVerifyOtp(digits.join(''))}
            disabled={isSubmitting || !isComplete || isExpired}
            aria-busy={isSubmitting}
            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#04212b] via-[#093544] to-[#14a3c4] hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(20,163,196,0.3)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-cyan-500"
          >
            {isSubmitting ? (
              <>
                <LiquidLoader size="xs" label="Verifying code..." />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>VERIFY OTP</span>
            )}
          </button>
        )}

        {/* Resend OTP Link & Return Navigation */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* Cyan Resend Link */}
          <button
            type="button"
            onClick={onResendOtp}
            disabled={resendCountdown > 0 || isSubmitting || isLocked}
            className="text-xs font-bold font-mono tracking-wider text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-1.5 px-3 rounded-lg hover:bg-cyan-500/5 active:scale-95"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${
                resendCountdown > 0 ? '' : 'hover:rotate-180 transition-transform duration-300'
              }`}
            />
            {resendCountdown > 0 ? (
              <span>Resend in {resendCountdown}s</span>
            ) : (
              <span>RESEND OTP</span>
            )}
          </button>

          {/* Return to Password Step */}
          <button
            type="button"
            onClick={onResetToLogin}
            disabled={isSubmitting}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Use a different account</span>
          </button>
        </div>

        {/* Security Policy Footer Note */}
        <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono leading-relaxed">
            Protected by Chemora Administrative Protocol. Mandatory email OTP. Maximum 5 attempts.
          </p>
        </div>
      </div>
    </div>
  );
};
