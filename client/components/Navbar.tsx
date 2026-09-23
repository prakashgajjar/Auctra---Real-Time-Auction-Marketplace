'use client';

import React, { useState } from 'react';
import { User } from '../lib/auth-api';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenDashboard: (tab?: string) => void;
  onLogout: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export default function Navbar({
  currentUser,
  onOpenAuth,
  onOpenDashboard,
  onLogout,
  onScrollToSection,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07090e]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Live Ticker */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onScrollToSection('hero')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/25 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-wider text-lg text-white group-hover:text-amber-400 transition-colors">
                  AUCTRA
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block -mt-1">
                Real-Time Auctions
              </span>
            </div>
          </div>

          {/* Live Indicator Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>14 AUCTIONS LIVE</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => onScrollToSection('live-auctions')}
            className="hover:text-amber-400 transition-colors py-1"
          >
            Live Auctions
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('categories')}
            className="hover:text-amber-400 transition-colors py-1"
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => onScrollToSection('features')}
            className="hover:text-amber-400 transition-colors py-1"
          >
            Institutional Security
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                onOpenDashboard('seller');
              } else {
                onOpenAuth('login');
              }
            }}
            className="text-amber-400/90 hover:text-amber-300 font-semibold transition-colors py-1 flex items-center gap-1"
          >
            <span>Sell on Auctra</span>
            <span className="text-[10px]">↗</span>
          </button>
        </nav>

        {/* User Account or Auth CTA */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.08] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                  {currentUser.firstName?.[0] || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentUser.firstName}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono leading-tight">
                    {currentUser.role}
                  </span>
                </div>
                <span className="text-slate-400 text-xs ml-1">▾</span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e121d] border border-white/10 p-2 shadow-2xl shadow-black/80 z-30 space-y-1 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs font-bold text-white">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenDashboard('profile');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenDashboard('addresses');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <span>📍</span>
                      <span>Saved Addresses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenDashboard('seller');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <span>🏪</span>
                      <span>Seller Hub</span>
                    </button>

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenDashboard('admin');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-purple-400 hover:bg-purple-500/10 transition-all flex items-center gap-2 font-semibold"
                      >
                        <span>🛡️</span>
                        <span>Admin Console</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-white/5 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
                      >
                        <span>⎋</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0d16] p-4 space-y-3 animate-fadeIn">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToSection('live-auctions');
            }}
            className="block w-full text-left py-2 text-sm text-slate-300 hover:text-amber-400"
          >
            Live Auctions
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToSection('categories');
            }}
            className="block w-full text-left py-2 text-sm text-slate-300 hover:text-amber-400"
          >
            Categories
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToSection('features');
            }}
            className="block w-full text-left py-2 text-sm text-slate-300 hover:text-amber-400"
          >
            Institutional Security
          </button>
          {currentUser && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDashboard();
              }}
              className="block w-full text-left py-2 text-sm text-amber-400 font-bold"
            >
              Open Account Dashboard →
            </button>
          )}
        </div>
      )}
    </header>
  );
}
