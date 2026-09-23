'use client';

import React, { useState } from 'react';
import AuthCard from './AuthCard';
import ResetPasswordCard from './ResetPasswordCard';
import { User, AuthTokens } from '../lib/auth-api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: User, tokens: AuthTokens) => void;
  onNotify: (msg: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  onNotify,
}: AuthModalProps) {
  const [activeView, setActiveView] = useState<'auth' | 'reset-password'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [prefilledEmail, setPrefilledEmail] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all z-10"
        >
          ✕
        </button>

        {activeView === 'auth' ? (
          <AuthCard
            initialMode={authMode}
            prefilledEmail={prefilledEmail}
            onAuthSuccess={(user, tokens) => {
              onAuthSuccess(user, tokens);
              onClose();
            }}
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
              if (message) onNotify(message);
              setAuthMode('login');
              setActiveView('auth');
            }}
          />
        )}
      </div>
    </div>
  );
}
