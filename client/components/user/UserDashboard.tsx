'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../lib/auth-api';
import { UserProfile, userApi } from '../../lib/user-api';
import ProfileTab from './ProfileTab';
import AddressBookTab from './AddressBookTab';
import SellerHubTab from './SellerHubTab';
import AdminPortalTab from './AdminPortalTab';

interface UserDashboardProps {
  initialUser: User;
  token: string;
  onLogout: () => void;
  onNotify: (msg: string) => void;
}

export default function UserDashboard({
  initialUser,
  token,
  onLogout,
  onNotify,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'seller' | 'admin'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullProfile();
  }, [token]);

  async function fetchFullProfile() {
    setLoading(true);
    try {
      const res = await userApi.getMe(token);
      if (res.success && res.data?.user) {
        setProfile(res.data.user);
      }
    } catch (err) {
      console.error('Failed to load user profile from port 3002:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentUser = profile || (initialUser as any);
  const isAdminOrMod = currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR';

  return (
    <div className="w-full max-w-5xl bg-[#0b0e17]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden text-slate-100 animate-fadeIn">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Profile Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.firstName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg shadow-amber-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                {currentUser.firstName?.[0] || 'U'}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0b0e17] ${
                currentUser.status === 'ACTIVE'
                  ? 'bg-emerald-400'
                  : currentUser.status === 'BANNED'
                  ? 'bg-red-500'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-[10px] uppercase">
                {currentUser.role}
              </span>
              {currentUser.sellerProfile?.verificationStatus === 'VERIFIED' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  ✓ VERIFIED SELLER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              @{currentUser.username} • {currentUser.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>⎋</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-white/5 scrollbar-none relative z-10">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>👤</span>
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'addresses'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📍</span>
          <span>Addresses</span>
          {profile?.addresses && profile.addresses.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'addresses' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'
              }`}
            >
              {profile.addresses.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seller')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'seller'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🏪</span>
          <span>Seller Hub</span>
          {currentUser.sellerProfile?.verificationStatus === 'PENDING' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {isAdminOrMod && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            <span>🛡️</span>
            <span>Admin Portal</span>
          </button>
        )}
      </div>

      {/* Active Tab Panel */}
      <div className="pt-6 relative z-10">
        {loading && !profile ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Connecting to Auctra User Microservice...
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <ProfileTab
                token={token}
                user={currentUser}
                onProfileUpdated={(updated) => setProfile(updated)}
                onNotify={onNotify}
              />
            )}

            {activeTab === 'addresses' && (
              <AddressBookTab
                token={token}
                addresses={profile?.addresses || []}
                onAddressesUpdated={fetchFullProfile}
                onNotify={onNotify}
              />
            )}

            {activeTab === 'seller' && (
              <SellerHubTab
                token={token}
                user={currentUser}
                sellerProfile={profile?.sellerProfile}
                onSellerProfileUpdated={fetchFullProfile}
                onNotify={onNotify}
              />
            )}

            {activeTab === 'admin' && isAdminOrMod && (
              <AdminPortalTab
                token={token}
                currentUser={currentUser}
                onNotify={onNotify}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
