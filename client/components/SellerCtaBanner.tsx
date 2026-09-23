'use client';

import React from 'react';
import { User } from '../lib/auth-api';

interface SellerCtaBannerProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenDashboard: (tab?: string) => void;
}

export default function SellerCtaBanner({
  currentUser,
  onOpenAuth,
  onOpenDashboard,
}: SellerCtaBannerProps) {
  function handleSellerClick() {
    if (currentUser) {
      onOpenDashboard('seller');
    } else {
      onOpenAuth('login');
    }
  }

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-amber-500/15 via-[#0e1322] to-[#0a0d16] border border-amber-500/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          {/* Ambient Gold Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              BECOME AN AUCTRA MERCHANT
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Have Rare Timepieces, Supercars, or Fine Art to Auction?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join our network of verified auction houses and collectors. Benefit from instant KYC onboarding, guaranteed escrow payments, and zero counterparty default.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleSellerClick}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Apply for Seller Verification</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
