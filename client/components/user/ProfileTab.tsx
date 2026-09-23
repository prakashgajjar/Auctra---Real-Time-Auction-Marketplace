'use client';

import React, { useState } from 'react';
import { UserProfile, userApi } from '../../lib/user-api';

interface ProfileTabProps {
  token: string;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
  onNotify: (msg: string) => void;
}

export default function ProfileTab({
  token,
  user,
  onProfileUpdated,
  onNotify,
}: ProfileTabProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await userApi.updateMe(token, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        avatarUrl: formData.avatarUrl || null,
        bio: formData.bio || null,
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to update profile');
      }

      onNotify('Profile updated successfully!');
      if (res.data?.user) {
        onProfileUpdated(res.data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👤</span>
          <span>Personal Profile & Details</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your personal details, public bio, and contact information across Auctra.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#0f121d] border border-white/5 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Username</span>
            <span className="font-semibold text-white font-mono mt-0.5 block">
              @{user.username}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Registered Email</span>
            <span className="font-semibold text-white mt-0.5 block truncate">
              {user.email}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Member Since</span>
            <span className="font-semibold text-slate-300 mt-0.5 block">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Contact and Avatar URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+919876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Public Bio / Collector Profile
          </label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Tell the Auctra community about your collecting interests or selling background..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none"
          />
          <span className="text-[10px] text-slate-500 float-right mt-1">
            {formData.bio.length} / 500
          </span>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading && <span className="animate-spin text-xs">⏳</span>}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
