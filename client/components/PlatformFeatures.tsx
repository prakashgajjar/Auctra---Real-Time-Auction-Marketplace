'use client';

import React from 'react';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Atomic Sub-Second Bid Engine',
    description:
      'Zero race conditions. Built on Redis distributed locks and PostgreSQL row-level transactions to sequence bids with microsecond precision.',
  },
  {
    icon: '🛡️',
    title: 'Automated Anti-Sniping Protection',
    description:
      'Any bid placed within the final 60 seconds automatically extends the auction clock by 2 minutes, ensuring genuine collectors have fair opportunity.',
  },
  {
    icon: '🔐',
    title: 'Cryptographic Escrow & Settlement',
    description:
      'Funds are locked in verified escrow. Payouts are only released once the buyer receives and confirms physical authentication of the lot.',
  },
  {
    icon: '🎖️',
    title: 'Vetted Merchant Network',
    description:
      'Every seller undergoes mandatory KYC/AML identity verification, tax auditing, and provenance examination before listing high-value assets.',
  },
];

export default function PlatformFeatures() {
  return (
    <section id="features" className="py-20 border-t border-white/5 relative z-10 bg-[#07090e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
            INSTITUTIONAL INTEGRITY
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
            Engineered for High-Stakes Bidding
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Traditional auction houses suffer from opaque reserve bidding. Auctra introduces transparency, cryptographic guarantees, and real-time execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-[#0c0f18] border border-white/5 hover:border-amber-500/30 transition-all duration-300 relative group overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
