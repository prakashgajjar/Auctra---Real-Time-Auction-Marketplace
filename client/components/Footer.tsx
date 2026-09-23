'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05070b] py-14 text-slate-400 text-xs relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/5">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm">
                A
              </div>
              <span className="font-black text-white text-base tracking-wider">
                AUCTRA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Institutional-grade real-time auction marketplace powered by distributed microservices, Redis locks, and cryptographic escrow settlement.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Auction Categories
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="hover:text-amber-400 transition-colors cursor-pointer">
                Luxury Timepieces & Chronographs
              </li>
              <li className="hover:text-amber-400 transition-colors cursor-pointer">
                Classic Supercars & Prototypes
              </li>
              <li className="hover:text-amber-400 transition-colors cursor-pointer">
                Modern & Contemporary Fine Art
              </li>
              <li className="hover:text-amber-400 transition-colors cursor-pointer">
                Rare Spirits & Single Malts
              </li>
              <li className="hover:text-amber-400 transition-colors cursor-pointer">
                Historical Artifacts & Manuscripts
              </li>
            </ul>
          </div>

          {/* Col 3: Platform Architecture */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Microservices Status
            </h4>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Auth Service</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Port 3001
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">User Service</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Port 3002
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">PostgreSQL (Prisma)</span>
                <span className="text-emerald-400 font-semibold">Online</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Redis Distributed Cache</span>
                <span className="text-emerald-400 font-semibold">Connected</span>
              </div>
            </div>
          </div>

          {/* Col 4: Trust & Guarantee */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Trust & Guarantee
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All transactions are secured via bank-grade escrow. Payouts are released only after buyer delivery confirmation and independent provenance certification.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                100% Insured
              </span>
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
                KYC Audited
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Auctra Marketplace Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Escrow Protocols</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
