'use client';

import React, { useState, useEffect, useRef } from 'react';
import { authApi, storeAuthData, User, AuthTokens } from '../lib/auth-api';

interface AuthCardProps {
  onSwitchToResetPassword: (email?: string) => void;
  onAuthSuccess: (user: User, tokens: AuthTokens) => void;
  initialMode?: 'login' | 'signup';
  prefilledEmail?: string;
}

export default function AuthCard({
  onSwitchToResetPassword,
  onAuthSuccess,
  initialMode = 'login',
  prefilledEmail = '',
}: AuthCardProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>(initialMode);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState(prefilledEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: prefilledEmail,
    password: '',
    phone: '',
    role: 'BUYER' as 'BUYER' | 'SELLER',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Verification state (OTP)
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Update mode or email if props change
  useEffect(() => {
    if (prefilledEmail) {
      setLoginIdentifier(prefilledEmail);
      setSignupForm((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle Login submission
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.login({
      identifier: loginIdentifier.trim(),
      password: loginPassword,
    });

    setLoading(false);

    if (!res.success) {
      // If unverified, automatically route to OTP verification
      if (res.error?.code === 'PENDING_VERIFICATION') {
        setVerificationEmail(loginIdentifier);
        setMode('verify');
        setCooldown(60);
        setErrorMessage('Your email is not verified yet. Please enter the OTP code sent to your email.');
        return;
      }
      setErrorMessage(res.error?.message || 'Login failed. Please check your credentials.');
      return;
    }

    if (res.data) {
      storeAuthData(res.data.tokens, res.data.user);
      onAuthSuccess(res.data.user, res.data.tokens);
    }
  }

  // Handle Signup submission
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.register({
      ...signupForm,
      email: signupForm.email.trim(),
      username: signupForm.username.trim(),
    });

    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Registration failed');
      return;
    }

    setVerificationEmail(signupForm.email);
    setMode('verify');
    setCooldown(60);
    setSuccessMessage('Registration successful! Please enter the 6-digit OTP code sent to your inbox.');
  }

  // Handle OTP digit changes
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

  // Handle OTP Verification submission
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.verifyEmail({
      email: verificationEmail,
      otp,
    });

    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Verification failed');
      return;
    }

    if (res.data) {
      storeAuthData(res.data.tokens, res.data.user);
      setSuccessMessage('Email verified successfully! Welcome to Auctra.');
      setTimeout(() => {
        if (res.data) {
          onAuthSuccess(res.data.user, res.data.tokens);
        }
      }, 1000);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (cooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const res = await authApi.resendOtp(verificationEmail);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error?.message || 'Failed to resend OTP');
      return;
    }

    setCooldown(60);
    setSuccessMessage('A fresh verification code has been dispatched to your email.');
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#10131d]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/80 relative overflow-hidden text-slate-100 transition-all duration-300">
      {/* Decorative ambient glow */}
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-2">
          <span>⚡</span> Live Marketplace
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          AUCTRA
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {mode === 'login' && 'Sign in to access your auctions and live bids'}
          {mode === 'signup' && 'Create your account to start buying and selling'}
          {mode === 'verify' && 'Verify your email address to continue'}
        </p>
      </div>

      {/* Tabs for Login / Sign Up */}
      {mode !== 'verify' && (
        <div className="flex bg-[#161a28] p-1 rounded-xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Feedback Messages */}
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

      {/* ─── MODE 1: LOGIN ─── */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="alex@example.com or alex99"
              className="w-full px-3.5 py-2.5 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => onSwitchToResetPassword(loginIdentifier)}
                className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                {showLoginPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}

      {/* ─── MODE 2: SIGNUP ─── */}
      {mode === 'signup' && (
        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={signupForm.firstName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, firstName: e.target.value })
                }
                placeholder="Alex"
                className="w-full px-3 py-2 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={signupForm.lastName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, lastName: e.target.value })
                }
                placeholder="Taylor"
                className="w-full px-3 py-2 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={signupForm.username}
              onChange={(e) =>
                setSignupForm({ ...signupForm, username: e.target.value })
              }
              placeholder="alex_auctra"
              className="w-full px-3.5 py-2 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={signupForm.email}
              onChange={(e) =>
                setSignupForm({ ...signupForm, email: e.target.value })
              }
              placeholder="alex@example.com"
              className="w-full px-3.5 py-2 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showSignupPassword ? 'text' : 'password'}
                required
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, password: e.target.value })
                }
                placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                className="w-full px-3.5 py-2 bg-[#171b2b] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                {showSignupPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Account Role */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Intent
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSignupForm({ ...signupForm, role: 'BUYER' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  signupForm.role === 'BUYER'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                    : 'border-white/10 bg-[#161a28] text-slate-400 hover:border-white/20'
                }`}
              >
                <span>🏷️</span> Buyer (Bid)
              </button>
              <button
                type="button"
                onClick={() => setSignupForm({ ...signupForm, role: 'SELLER' })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                  signupForm.role === 'SELLER'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-semibold'
                    : 'border-white/10 bg-[#161a28] text-slate-400 hover:border-white/20'
                }`}
              >
                <span>🔨</span> Seller (List)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      )}

      {/* ─── MODE 3: EMAIL OTP VERIFICATION ─── */}
      {mode === 'verify' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 text-xl">
              ✉️
            </div>
            <p className="text-xs text-slate-300">
              We sent a 6-digit code to{' '}
              <strong className="text-amber-400 font-medium">
                {verificationEmail}
              </strong>
            </p>
          </div>

          {/* 6 Digit OTP Input Boxes */}
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

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length !== 6}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Activate Account'
            )}
          </button>

          {/* Resend OTP */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
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
