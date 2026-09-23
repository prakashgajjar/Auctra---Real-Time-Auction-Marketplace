'use client';

import React, { useState, useEffect } from 'react';

interface LiveAuctionsGridProps {
  onOpenBidModal: (lot: any) => void;
}

export const INITIAL_LOTS = [
  {
    id: 'lot-1',
    title: 'Rolex Cosmograph Daytona 116503',
    subtitle: 'Yellow Rolesor, 40mm, Black Dial, Full Box & Papers',
    category: 'TIMEPIECES',
    currentBid: 2450000,
    startingPrice: 1800000,
    minIncrement: 50000,
    bidCount: 38,
    image: '/images/rolex_daytona.jpg',
    timeLeftSeconds: 8088, // ~2h 14m
    seller: { name: 'Auctra Private Vaults', verified: true, rating: 4.98 },
    reserveMet: true,
  },
  {
    id: 'lot-2',
    title: '1973 Porsche 911 Carrera RS 2.7',
    subtitle: 'Matching numbers, Silver Metallic, Fuchs forged alloys',
    category: 'SUPERCARS',
    currentBid: 62000000,
    startingPrice: 50000000,
    minIncrement: 500000,
    bidCount: 22,
    image: '/images/classic_porsche.jpg',
    timeLeftSeconds: 17100, // ~4h 45m
    seller: { name: 'Stuttgart Historic Cars', verified: true, rating: 5.0 },
    reserveMet: true,
  },
  {
    id: 'lot-3',
    title: 'Contemporary Textured Gilded Canvas',
    subtitle: 'Monumental 180x120cm mixed media with 24k gold leaf',
    category: 'FINE ART',
    currentBid: 1850000,
    startingPrice: 1200000,
    minIncrement: 25000,
    bidCount: 16,
    image: '/images/contemporary_art.jpg',
    timeLeftSeconds: 22200, // ~6h 10m
    seller: { name: 'Modern Atelier Zurich', verified: true, rating: 4.92 },
    reserveMet: true,
  },
  {
    id: 'lot-4',
    title: 'Patek Philippe Nautilus 5711/1R Rose Gold',
    subtitle: 'Rare chocolate dial, self-winding caliber 324 S C',
    category: 'TIMEPIECES',
    currentBid: 7800000,
    startingPrice: 6500000,
    minIncrement: 100000,
    bidCount: 41,
    image: '/images/rolex_daytona.jpg',
    timeLeftSeconds: 29800, // ~8h 16m
    seller: { name: 'Geneva Horology Group', verified: true, rating: 4.99 },
    reserveMet: true,
  },
  {
    id: 'lot-5',
    title: '1974 Porsche 911 RSR 3.0 Works Prototype',
    subtitle: 'Documented competition history, FIA historic passport',
    category: 'SUPERCARS',
    currentBid: 89000000,
    startingPrice: 75000000,
    minIncrement: 1000000,
    bidCount: 19,
    image: '/images/classic_porsche.jpg',
    timeLeftSeconds: 43200, // ~12h
    seller: { name: 'Vintage Rennsport Archive', verified: true, rating: 4.95 },
    reserveMet: false,
  },
  {
    id: 'lot-6',
    title: 'Indigo Depths & Gold Mineral Sculpture',
    subtitle: 'Raw lapis lazuli and sculpted bronze, signed limited piece',
    category: 'FINE ART',
    currentBid: 980000,
    startingPrice: 600000,
    minIncrement: 20000,
    bidCount: 14,
    image: '/images/contemporary_art.jpg',
    timeLeftSeconds: 9600, // ~2h 40m
    seller: { name: 'Solstice Fine Art Paris', verified: true, rating: 4.88 },
    reserveMet: true,
  },
];

const CATEGORIES = ['ALL', 'TIMEPIECES', 'SUPERCARS', 'FINE ART'];

export default function LiveAuctionsGrid({ onOpenBidModal }: LiveAuctionsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [lots, setLots] = useState(INITIAL_LOTS);

  // Countdown timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLots((prevLots) =>
        prevLots.map((lot) => ({
          ...lot,
          timeLeftSeconds: Math.max(0, lot.timeLeftSeconds - 1),
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredLots =
    selectedCategory === 'ALL'
      ? lots
      : lots.filter((lot) => lot.category === selectedCategory);

  function formatCountdown(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
  }

  return (
    <section id="live-auctions" className="py-16 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
                ACTIVE BIDDING SESSIONS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Featured Live Auctions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Bid in real time with sub-second order validation, verified provenance, and automatic anti-sniping protection.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              className="rounded-3xl bg-[#0c0f18] border border-white/10 hover:border-amber-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 relative"
            >
              <div>
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-black/60">
                  <img
                    src={lot.image}
                    alt={lot.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f18] via-transparent to-black/30 pointer-events-none" />

                  {/* Top Floating Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#07090e]/80 backdrop-blur-md border border-white/10 text-[10px] font-bold font-mono text-amber-400">
                      {lot.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  {/* Countdown Timer Floating Bar */}
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-[#07090e]/85 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">ENDING IN:</span>
                    <span className="font-bold text-amber-400">
                      {formatCountdown(lot.timeLeftSeconds)}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {lot.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {lot.subtitle}
                    </p>
                  </div>

                  {/* Pricing Overview */}
                  <div className="flex items-center justify-between py-2 border-y border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        CURRENT HIGHEST BID
                      </span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        ₹{lot.currentBid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-mono">
                        BIDS PLACED
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {lot.bidCount} bids
                      </span>
                    </div>
                  </div>

                  {/* Seller Verified Badge */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{lot.seller.name}</span>
                    <span className="text-emerald-400 font-semibold shrink-0">
                      ★ {lot.seller.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 sm:p-6 pt-0">
                <button
                  type="button"
                  onClick={() => onOpenBidModal(lot)}
                  className="w-full py-3 rounded-xl bg-white/[0.04] hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 border border-white/10 hover:border-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-all shadow-md group-hover:shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  <span>Enter Bid Room</span>
                  <span>⚡</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
