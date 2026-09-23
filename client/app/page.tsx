'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import LiveAuctionsGrid from '../components/LiveAuctionsGrid';
import MarketplaceStats from '../components/MarketplaceStats';
import PlatformFeatures from '../components/PlatformFeatures';
import SellerCtaBanner from '../components/SellerCtaBanner';
import Footer from '../components/Footer';
import LiveBiddingModal from '../components/LiveBiddingModal';
import AuthModal from '../components/AuthModal';
import UserDashboard from '../components/user/UserDashboard';
import {
  User,
  AuthTokens,
  getStoredAuthData,
  clearAuthData,
  authApi,
} from '../lib/auth-api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTokens, setCurrentTokens] = useState<AuthTokens | null>(null);

  // View state: 'marketplace' or 'dashboard'
  const [viewMode, setViewMode] = useState<'marketplace' | 'dashboard'>('marketplace');

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const [biddingModalOpen, setBiddingModalOpen] = useState(false);
  const [selectedLotForBid, setSelectedLotForBid] = useState<any | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  // Check stored auth session on initial load
  useEffect(() => {
    const { token, refreshToken, user } = getStoredAuthData();
    if (token && user) {
      setCurrentUser(user);
      setCurrentTokens({ accessToken: token, refreshToken: refreshToken || '' });
    }
  }, []);

  function handleAuthSuccess(user: User, tokens: AuthTokens) {
    setCurrentUser(user);
    setCurrentTokens(tokens);
    setNotification(`Welcome, ${user.firstName}! You are now signed in.`);
  }

  async function handleLogout() {
    if (currentTokens?.accessToken) {
      await authApi.logout(currentTokens.accessToken, currentTokens.refreshToken);
    }
    clearAuthData();
    setCurrentUser(null);
    setCurrentTokens(null);
    setViewMode('marketplace');
    setNotification('You have been signed out successfully.');
  }

  function handleScrollToSection(sectionId: string) {
    if (viewMode === 'dashboard') {
      setViewMode('marketplace');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function handleOpenBidModal(lot: any) {
    setSelectedLotForBid(lot);
    setBiddingModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black relative overflow-x-hidden font-sans">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenDashboard={() => setViewMode('dashboard')}
        onLogout={handleLogout}
        onScrollToSection={handleScrollToSection}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0f1322] border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-3 shadow-2xl shadow-black animate-fadeIn">
          <span>✨</span>
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-sm font-bold pl-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 relative z-10">
        {viewMode === 'marketplace' ? (
          /* Complete Marketplace Home Experience */
          <div>
            <HeroSection
              onOpenBidModal={handleOpenBidModal}
              onExploreClick={() => handleScrollToSection('live-auctions')}
            />

            <MarketplaceStats />

            <LiveAuctionsGrid onOpenBidModal={handleOpenBidModal} />

            <PlatformFeatures />

            <SellerCtaBanner
              currentUser={currentUser}
              onOpenAuth={(mode = 'signup') => {
                setAuthModalMode(mode);
                setAuthModalOpen(true);
              }}
              onOpenDashboard={() => setViewMode('dashboard')}
            />
          </div>
        ) : (
          /* User & Roles Dashboard View */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode('marketplace')}
                className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Live Auctions</span>
              </button>

              <span className="text-xs text-slate-500 font-mono">
                Port 3002 • User Microservice Active
              </span>
            </div>

            {currentUser && currentTokens?.accessToken ? (
              <UserDashboard
                initialUser={currentUser}
                token={currentTokens.accessToken}
                onLogout={handleLogout}
                onNotify={(msg) => setNotification(msg)}
              />
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Session expired. Please sign in again.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rich Footer */}
      <Footer />

      {/* Interactive Live Bidding Modal */}
      <LiveBiddingModal
        isOpen={biddingModalOpen}
        onClose={() => setBiddingModalOpen(false)}
        lot={selectedLotForBid}
        currentUser={currentUser}
        onOpenAuth={() => {
          setBiddingModalOpen(false);
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onBidPlaced={(lotId, amount) => {
          setNotification(`Bid of ₹${amount.toLocaleString('en-IN')} confirmed on lot!`);
        }}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        onNotify={(msg) => setNotification(msg)}
      />
    </div>
  );
}
