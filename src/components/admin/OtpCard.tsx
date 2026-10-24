import React, { useState, useRef, useEffect, useCallback } from 'react';
import { KeyRound, AlertCircle, ArrowLeft, RotateCw, CheckCircle2 } from 'lucide-react';
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
    }, 100);
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
      const timer = setTimeout(() => setShouldShake(false), 320);
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
    const isComplete = Array.isArray(next) && next.length === 6 && next.every((d) => Boolean(d && typeof d === 'string' && d.length === 1));
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const code = Array.isArray(digits) ? digits.join('') : '';
      if (code && code.length === 6 && !isSubmitting) {
        onVerifyOtp(code);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (onClearError) onClearError();
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
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

  const isComplete = Array.isArray(digits) && digits.length === 6 && digits.every((d) => Boolean(d && typeof d === 'string' && d.length === 1));
  const isLocked = errorCode === 'otp_locked';
  const isExpired = errorCode === 'otp_expired' || timeRemaining === 0;

  return (
    <div className="w-full max-w-[430px] mx-auto animate-in fade-in duration-200">
      {/* Neumorphic Dark Embossed Card Container matching Admin Login panel */}
      <div className="relative rounded-[28px] p-5 sm:p-7 transition-all duration-300 otp-card-dark backdrop-blur-xl">
        {/* Top Raised Circular Lock Badge */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center otp-badge-raised mb-2.5 transition-transform hover:scale-105">
            <KeyRound className="w-5 h-5 text-[#7fdcef]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[#7fdcef] text-[10px] font-mono font-bold tracking-wider uppercase mb-1.5">
            <span>Identity Verification</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Verify it&apos;s you
          </h2>

          <p className="text-xs text-[#c5dce4] mt-1 max-w-[320px] leading-relaxed">
            We&apos;ve sent a 6-digit verification code to
            <br />
            <span className="font-mono font-bold text-[#7fdcef] tracking-wide">
              {maskedEmail || 'your staff address'}
            </span>
          </p>
        </div>

        {/* Live Alerts & Error Display (Dark theme style with WCAG AA compliance) */}
        <div aria-live="polite" className="space-y-2 mb-3.5">
          {error && (
            <div
              role="alert"
              className={`p-3 rounded-2xl text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200 ${
                errorCode === 'otp_locked' || errorCode === 'otp_expired'
                  ? 'bg-amber-950/40 border border-amber-500/50 text-[#fde68a]'
                  : 'bg-rose-950/40 border border-rose-500/50 text-[#fecdd3]'
              }`}
            >
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                errorCode === 'otp_locked' || errorCode === 'otp_expired' ? 'text-amber-400' : 'text-rose-400'
              }`} />
              <div className="flex-1 leading-snug">
                {errorCode === 'otp_invalid' && typeof attemptsLeft === 'number' ? (
                  <span>
                    Incorrect code. <strong>{attemptsLeft}</strong>{' '}
                    {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
                  </span>
                ) : errorCode === 'otp_locked' ? (
                  <div>
                    <span>Too many failed attempts. This code has been locked.</span>
                    {onResetToLogin && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={onResetToLogin}
                          className="font-bold underline text-[#fde68a] hover:text-white cursor-pointer"
                        >
                          Start over
                        </button>
                      </div>
                    )}
                  </div>
                ) : errorCode === 'otp_expired' ? (
                  <div>
                    <span>Verification code has expired.</span>
                    {onResetToLogin && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={onResetToLogin}
                          className="font-bold underline text-[#fde68a] hover:text-white cursor-pointer"
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
                  className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer p-0.5"
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
              className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-[#a7f3d0] text-xs font-medium flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{success}</span>
              {onClearSuccess && (
                <button
                  type="button"
                  onClick={onClearSuccess}
                  className="text-emerald-400 hover:text-white text-sm font-bold cursor-pointer"
                  aria-label="Dismiss message"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        {/* 6 Digit Dark Embossed Neumorphic Boxes */}
        <div className={`my-4 ${shouldShake ? 'anim-otp-shake' : ''}`}>
          <div className="flex justify-between items-center gap-1.5 sm:gap-2">
            {digits.map((digit, idx) => {
              const isFocused = focusedIndex === idx;
              const hasVal = Boolean(digit);
              const isError = Boolean(error && !isLocked && !isExpired);

              let boxClass = 'otp-box-raised text-white';
              if (isFocused) {
                boxClass = 'otp-box-active text-[#7fdcef]';
              } else if (hasVal) {
                boxClass = 'otp-box-raised text-white font-black';
              }

              if (isError) {
                boxClass += ' otp-box-error';
              }

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
                  className={`w-11 sm:w-12 h-12 sm:h-13 rounded-[14px] text-center text-xl font-mono transition-all duration-150 outline-none select-none min-h-[44px] min-w-[40px] ${boxClass}`}
                />
              );
            })}
          </div>

          {/* Expiration Countdown Indicator (AA contrast #a5c8d3) */}
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#a5c8d3] px-1">
            <span>Security Challenge</span>
            <span className={timeRemaining <= 60 ? 'text-rose-400 font-bold' : ''}>
              {timeRemaining > 0 ? (
                `Code expires in ${formatTime(timeRemaining)}`
              ) : (
                <span className="text-rose-400 font-bold">Code expired</span>
              )}
            </span>
          </div>
        </div>

        {/* Lockout / Expired Action or Wide Verify Button */}
        {isLocked ? (
          <button
            type="button"
            onClick={onResetToLogin}
            className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white font-bold text-sm shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
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
            className={`w-full min-h-[44px] py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0e7490] to-[#0b5f78] hover:from-[#0891b2] hover:to-[#0e7490] text-white font-bold text-sm shadow-[0_4px_16px_rgba(14,116,144,0.35)] transition-all flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              !isComplete || isSubmitting || isExpired
                ? 'opacity-60 cursor-not-allowed shadow-none'
                : 'cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <LiquidLoader size="xs" label="Verifying code..." />
                <span>Verifying code...</span>
              </>
            ) : (
              <span>Verify code</span>
            )}
          </button>
        )}

        {/* Resend OTP Link & Return Navigation */}
        <div className="mt-4 flex flex-col items-center gap-2.5">
          {/* Cyan Resend Link with visible focus ring */}
          <button
            type="button"
            onClick={onResendOtp}
            disabled={resendCountdown > 0 || isSubmitting || isLocked}
            className="text-xs font-bold font-mono tracking-wider text-[#7fdcef] hover:text-[#58d6ff] transition-colors uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-1 px-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${
                resendCountdown > 0 ? '' : 'hover:rotate-180 transition-transform duration-300'
              }`}
            />
            {resendCountdown > 0 ? (
              <span>Resend in {resendCountdown}s</span>
            ) : (
              <span>Resend code</span>
            )}
          </button>

          {/* Return to Step 1 */}
          <button
            type="button"
            onClick={onResetToLogin}
            disabled={isSubmitting}
            className="text-xs font-medium text-[#a5c8d3] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Use a different account</span>
          </button>
        </div>

        {/* Security Policy Footer Note */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-[10px] text-[#a5c8d3]/70 font-mono leading-relaxed">
            Protected by Chemora Administrative Protocol. Mandatory email OTP.
          </p>
        </div>
      </div>
    </div>
  );
};
