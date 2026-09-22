'use client';

import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../lib/auth-api';

interface ResetPasswordCardProps {
  onSwitchToLogin: (prefilledEmail?: string, message?: string) => void;
  initialEmail?: string;
}

export default function ResetPasswordCard({
  onSwitchToLogin,
  initialEmail = '',
}: ResetPasswordCardProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Step 1: Request Reset OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.forgotPassword(email.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Failed to request reset OTP');
      return;
    }

    setStep('reset');
    setCooldown(60);
    setSuccessMessage(
      res.data?.message || 'If an account exists with this email, a 6-digit reset code has been sent.'
    );
  }

  // Step 2: Handle OTP input
  function handleOtpChange(index: number, value: string) {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;

    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  }

  // Step 2: Submit Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.resetPassword({
      email: email.trim(),
      otp,
      newPassword,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Failed to reset password');
      return;
    }

    setSuccessMessage('Password reset successfully! Redirecting to sign in...');
    setTimeout(() => {
      onSwitchToLogin(email, 'Your password has been reset successfully. Please sign in.');
    }, 1500);
  }

  // Resend OTP
  async function handleResendOtp() {
    if (cooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.forgotPassword(email.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Failed to resend code');
      return;
    }

    setCooldown(60);
    setSuccessMessage('A fresh password reset code has been sent to your email.');
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#10131d]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/80 relative overflow-hidden text-slate-100 transition-all duration-300">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-6 relative">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 text-xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Reset Password
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {step === 'request'
            ? 'Enter your registered email to receive a password reset OTP'
            : 'Enter the 6-digit OTP and choose your new password'}
        </p>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-fadeIn">
          <span className="text-sm">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2 animate-fadeIn">
          <span className="text-sm">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── STEP 1: REQUEST OTP ─── */}
      {step === 'request' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3.5 py-2.5 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send Reset OTP'
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => onSwitchToLogin(email)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      )}

      {/* ─── STEP 2: ENTER OTP & NEW PASSWORD ─── */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="text-center pb-1">
            <span className="text-xs text-slate-400">
              Sent code to <strong className="text-amber-400">{email}</strong>
            </span>
          </div>

          {/* 6 Digit OTP */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
              Enter 6-Digit OTP Code
            </label>
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-[#171b2b] border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                className="w-full px-3.5 py-2.5 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6 || !newPassword}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Resetting Password...
              </>
            ) : (
              'Reset Password & Sign In'
            )}
          </button>

          {/* Resend & Back Actions */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => onSwitchToLogin(email)}
              className="hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || loading}
              className={`font-medium ${
                cooldown > 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-amber-400 hover:underline'
              }`}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
