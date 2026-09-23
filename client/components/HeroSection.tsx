'use client';

import React, { useState, useEffect } from 'react';

interface HeroSectionProps {
  onOpenBidModal: (lot: any) => void;
  onExploreClick: () => void;
}

export default function HeroSection({
  onOpenBidModal,
  onExploreClick,
}: HeroSectionProps) {
  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 14,
    seconds: 48,
  });

  const [currentBid, setCurrentBid] = useState(2450000);
  const [bidCount, setBidCount] = useState(38);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const flagshipLot = {
    id: 'lot-flagship-1',
    title: 'Rolex Cosmograph Daytona 116503',
    subtitle: 'Oyster, 40 mm, Yellow Rolesor with Black Dial & Chronograph',
    category: 'TIMEPIECES',
    currentBid,
    startingPrice: 1800000,
    minIncrement: 50000,
    bidCount,
    image: '/images/rolex_daytona.jpg',
    seller: {
      name: 'Auctra Private Vaults',
      verified: true,
      rating: 4.98,
    },
    reserveMet: true,
  };

  return (
    <section id="hero" className="relative pt-8 pb-16 lg:py-20 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-amber-500/30 backdrop-blur-md shadow-lg shadow-amber-500/5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-bold text-amber-300 tracking-wide uppercase font-mono">
                Institutional Real-Time Auction Engine
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Where Rare Finds Meet{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                Competitive Bidding.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Experience millisecond-grade live auctions for luxury timepieces, supercars, fine art, and rare collectibles with guaranteed cryptographic escrow.
            </p>

            {/* Microservice Architecture Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">⚡</span>
                <span>Distributed Locks</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300">
                <span className="text-amber-400 font-bold">🔒</span>
                <span>Sub-Second Concurrency</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300">
                <span className="text-indigo-400 font-bold">✓</span>
                <span>100% Provenance Insured</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                type="button"
                onClick={() => onOpenBidModal(flagshipLot)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Bid on Flagship Lot</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Explore Live Lots</span>
                <span className="text-slate-400">↓</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Flagship Lot Card */}
          <div className="lg:col-span-6 relative">
            {/* Glow Card Background */}
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-amber-500/30 via-white/10 to-transparent shadow-2xl shadow-black/80">
              <div className="rounded-[22px] bg-[#0c0f18] p-5 sm:p-7 overflow-hidden relative">
                {/* Lot Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-wider font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>FEATURED LOT 01</span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {bidCount} Active Bidders
                  </span>
                </div>

                {/* Hero Showcase Image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/40 border border-white/10 group mb-6">
                  <img
                    src="/images/rolex_daytona.jpg"
                    alt="Rolex Cosmograph Daytona"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Countdown Floating Pill */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-[#090b12]/80 backdrop-blur-md border border-white/10 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span>⏱️</span>
                      <span className="text-slate-400 font-mono">TIME REMAINING:</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold text-amber-400 text-sm">
                      <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {String(timeLeft.hours).padStart(2, '0')}h
                      </span>
                      <span>:</span>
                      <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {String(timeLeft.minutes).padStart(2, '0')}m
                      </span>
                      <span>:</span>
                      <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10 text-red-400">
                        {String(timeLeft.seconds).padStart(2, '0')}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lot Details & Bidding Bar */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">
                      Timepieces • Lot 82
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                      Rolex Cosmograph Daytona 116503
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      Oyster, 40 mm, Yellow Rolesor with Black Dial & Chronograph
                    </p>
                  </div>

                  {/* Pricing Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        CURRENT BID
                      </span>
                      <span className="text-2xl font-black text-amber-400 font-mono block mt-0.5">
                        ₹{(currentBid).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>✓</span> Reserve Met
                      </span>
                    </div>

                    <div className="border-l border-white/5 pl-4 flex flex-col justify-center">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        MIN INCREMENT
                      </span>
                      <span className="text-base font-bold text-white font-mono block mt-0.5">
                        +₹50,000
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Next: ₹{(currentBid + 50000).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <button
                    type="button"
                    onClick={() => onOpenBidModal(flagshipLot)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Place Real-Time Bid</span>
                    <span>⚡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
