'use client';

import React, { useState } from 'react';
import { User } from '../lib/auth-api';

interface LiveBiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: any;
  currentUser: User | null;
  onOpenAuth: () => void;
  onBidPlaced: (lotId: string, newBidAmount: number) => void;
}

export default function LiveBiddingModal({
  isOpen,
  onClose,
  lot,
  currentUser,
  onOpenAuth,
  onBidPlaced,
}: LiveBiddingModalProps) {
  if (!isOpen || !lot) return null;

  const minNextBid = (lot.currentBid || 100000) + (lot.minIncrement || 10000);
  const [customBid, setCustomBid] = useState<number>(minNextBid);
  const [biddingSuccess, setBiddingSuccess] = useState(false);
  const [bidHistory, setBidHistory] = useState<Array<{ user: string; amount: number; time: string }>>([
    { user: 'marcus_k', amount: lot.currentBid, time: '2 mins ago' },
    { user: 'vikram_collector', amount: lot.currentBid - (lot.minIncrement || 10000), time: '6 mins ago' },
    { user: 'elena_art', amount: lot.currentBid - ((lot.minIncrement || 10000) * 2), time: '14 mins ago' },
  ]);

  function handlePlaceBid(amount: number) {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (amount < minNextBid) {
      alert(`Bid must be at least ₹${minNextBid.toLocaleString('en-IN')}`);
      return;
    }

    const newBidRecord = {
      user: currentUser.username,
      amount,
      time: 'Just now',
    };

    setBidHistory([newBidRecord, ...bidHistory]);
    onBidPlaced(lot.id, amount);
    setBiddingSuccess(true);

    setTimeout(() => {
      setBiddingSuccess(false);
    }, 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0d101a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase text-emerald-400">
              LIVE REAL-TIME BID ROOM
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Lot Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center mb-6">
          <div className="sm:col-span-5 rounded-2xl overflow-hidden aspect-[4/3] bg-black/40 border border-white/10">
            <img
              src={lot.image || '/images/rolex_daytona.jpg'}
              alt={lot.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="sm:col-span-7 space-y-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
              {lot.category}
            </span>
            <h2 className="text-lg font-black text-white leading-snug">
              {lot.title}
            </h2>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {lot.subtitle || 'Authenticated lot with verified provenance and insured escrow settlement.'}
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Seller:</span>
              <span className="text-xs font-bold text-white">
                {lot.seller?.name || 'Auctra Vaults'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                ✓ VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Pricing & Bid Actions */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-400 font-mono block">HIGHEST BID</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                ₹{(lot.currentBid || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 font-mono block">MINIMUM REQUIRED BID</span>
              <span className="text-base font-bold text-white font-mono">
                ₹{minNextBid.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Instant Quick Bid Increments:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePlaceBid(minNextBid)}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-xs font-bold text-slate-200 hover:text-amber-300 transition-all font-mono"
              >
                +₹{(lot.minIncrement || 10000).toLocaleString('en-IN')}
              </button>
              <button
                type="button"
                onClick={() => handlePlaceBid(minNextBid + (lot.minIncrement || 10000))}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-xs font-bold text-slate-200 hover:text-amber-300 transition-all font-mono"
              >
                +₹{((lot.minIncrement || 10000) * 2).toLocaleString('en-IN')}
              </button>
              <button
                type="button"
                onClick={() => handlePlaceBid(minNextBid + ((lot.minIncrement || 10000) * 4))}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-xs font-bold text-slate-200 hover:text-amber-300 transition-all font-mono"
              >
                +₹{((lot.minIncrement || 10000) * 5).toLocaleString('en-IN')}
              </button>
            </div>
          </div>

          {/* Custom Bid Input */}
          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-mono">
                ₹
              </span>
              <input
                type="number"
                min={minNextBid}
                step={lot.minIncrement || 10000}
                value={customBid}
                onChange={(e) => setCustomBid(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <button
              type="button"
              onClick={() => handlePlaceBid(customBid)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              Confirm Bid
            </button>
          </div>

          {biddingSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span>🎉</span>
              <span>Bid placed successfully! You are currently the highest bidder.</span>
            </div>
          )}

          {!currentUser && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
              <span>Sign in with your Auctra account to place legally binding bids.</span>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-amber-300 transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Live Bid Stream */}
        <div>
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🔴</span>
            <span>Live Bid History Feed</span>
          </h3>

          <div className="space-y-2">
            {bidHistory.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className={idx === 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    @{b.user}
                  </span>
                  {idx === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                      LEADER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">
                    ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500">{b.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
