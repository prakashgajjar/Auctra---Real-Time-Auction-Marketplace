'use client';

import React, { useState, useEffect } from 'react';
import AuthCard from '../components/AuthCard';
import ResetPasswordCard from '../components/ResetPasswordCard';
import UserDashboard from '../components/user/UserDashboard';
import {
  User,
  AuthTokens,
  getStoredAuthData,
  clearAuthData,
  authApi,
} from '../lib/auth-api';

export default function Home() {
  const [activeView, setActiveView] = useState<'auth' | 'reset-password'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTokens, setCurrentTokens] = useState<AuthTokens | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Check stored auth session on initial load
  useEffect(() => {
    const { token, refreshToken, user } = getStoredAuthData();
    if (token && user) {
      setCurrentUser(user);
      setCurrentTokens({ accessToken: token, refreshToken: refreshToken || '' });
    }
  }, []);

  // Handle successful login or verification
  function handleAuthSuccess(user: User, tokens: AuthTokens) {
    setCurrentUser(user);
    setCurrentTokens(tokens);
    setNotification(`Welcome back, ${user.firstName}! You are signed in.`);
  }

  // Handle logout
  async function handleLogout() {
    if (currentTokens?.accessToken) {
      await authApi.logout(currentTokens.accessToken, currentTokens.refreshToken);
    }
    clearAuthData();
    setCurrentUser(null);
    setCurrentTokens(null);
    setActiveView('auth');
    setAuthMode('login');
    setNotification('You have been signed out successfully.');
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-10 w-full border-b border-white/5 bg-[#0b0e17]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg shadow-amber-500/20">
              A
            </div>
            <div>
              <span className="font-bold tracking-wider text-base text-white">
                AUCTRA
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold tracking-widest text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Real-Time Auctions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  <span className="text-[10px] text-amber-400 uppercase font-mono">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-xs font-medium text-slate-300 hover:text-red-400 transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-mono">
                  Auth Microservice: 3001
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 py-8 md:py-14 flex flex-col items-center justify-center flex-1">
        {notification && (
          <div className="mb-6 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2 shadow-lg animate-fadeIn">
            <span>✨</span>
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-amber-400/60 hover:text-amber-400 text-sm font-bold pl-2"
            >
              ×
            </button>
          </div>
        )}

        {currentUser && currentTokens?.accessToken ? (
          <UserDashboard
            initialUser={currentUser}
            token={currentTokens.accessToken}
            onLogout={handleLogout}
            onNotify={(msg) => setNotification(msg)}
          />
        ) : (
          /* Synchronized Auth & Reset Password Flow */
          <div className="w-full">
            {activeView === 'auth' ? (
              <AuthCard
                initialMode={authMode}
                prefilledEmail={prefilledEmail}
                onAuthSuccess={handleAuthSuccess}
                onSwitchToResetPassword={(email) => {
                  if (email) setPrefilledEmail(email);
                  setActiveView('reset-password');
                }}
              />
            ) : (
              <ResetPasswordCard
                initialEmail={prefilledEmail}
                onSwitchToLogin={(email, message) => {
                  if (email) setPrefilledEmail(email);
                  if (message) setNotification(message);
                  setAuthMode('login');
                  setActiveView('auth');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500">
        <p>Auctra Microservices Platform • Real-Time Auction Engine</p>
      </footer>
    </div>
  );
}
