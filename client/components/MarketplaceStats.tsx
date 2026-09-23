'use client';

import React from 'react';

const STATS = [
  { value: '₹84.5 Cr+', label: 'Total Settled Bidding Volume', change: '+24% this month' },
  { value: '12,850+', label: 'Real-Time Bids Executed', change: 'Sub-10ms latency' },
  { value: '99.98%', label: 'Dispute-Free Settlements', change: 'Insured Escrow' },
  { value: '500+', label: 'Verified Global Merchants', change: 'Strict KYC/AML' },
];

export default function MarketplaceStats() {
  return (
    <section className="py-12 border-y border-white/5 bg-[#0a0d16] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, idx) => (
            <div key={idx} className="text-center sm:text-left space-y-1">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-mono block tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-slate-300 block">
                {stat.label}
              </span>
              <span className="text-[10px] text-amber-400 font-mono block">
                {stat.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
