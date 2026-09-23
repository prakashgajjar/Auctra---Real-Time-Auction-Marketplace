'use client';

import React, { useState } from 'react';
import { UserProfile, SellerProfile, sellerApi } from '../../lib/user-api';

interface SellerHubTabProps {
  token: string;
  user: UserProfile;
  sellerProfile?: SellerProfile | null;
  onSellerProfileUpdated: () => void;
  onNotify: (msg: string) => void;
}

export default function SellerHubTab({
  token,
  user,
  sellerProfile,
  onSellerProfileUpdated,
  onNotify,
}: SellerHubTabProps) {
  // Application Form State
  const [appForm, setAppForm] = useState({
    storeName: '',
    storeDescription: '',
    businessType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'REGISTERED_BUSINESS',
    taxId: '',
    bankAccountNumber: '',
    bankIfsc: '',
  });

  // Settings State for verified seller
  const [descForm, setDescForm] = useState(sellerProfile?.storeDescription || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await sellerApi.apply(token, appForm);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to submit seller application');
      }
      onNotify('Seller application submitted! Awaiting administrator verification.');
      onSellerProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Application error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateDescription(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await sellerApi.updateProfile(token, {
        storeDescription: descForm,
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to update store details');
      }
      onNotify('Storefront details updated successfully!');
      onSellerProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Update error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🏪</span>
          <span>Seller Onboarding & Store Hub</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          List your rare items, conduct live auctions, and manage your merchant presence.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Case 1: Verified Seller Dashboard */}
      {sellerProfile?.verificationStatus === 'VERIFIED' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0e1724] to-[#0e121d] border border-emerald-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-extrabold text-white">
                    {sellerProfile.storeName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                    <span>✓</span> VERIFIED MERCHANT
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Business Type: <span className="font-mono text-amber-400">{sellerProfile.businessType}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                <div className="text-center">
                  <span className="text-amber-400 font-bold text-sm block">
                    ★ {Number(sellerProfile.ratingAverage).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-400">Seller Rating</span>
                </div>
                <div className="w-px h-7 bg-white/10" />
                <div className="text-center">
                  <span className="text-white font-bold text-sm block">
                    {sellerProfile.ratingCount}
                  </span>
                  <span className="text-[10px] text-slate-400">Reviews</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateDescription} className="p-5 rounded-2xl bg-[#0f121d] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>✍️</span>
              <span>Edit Storefront Bio & Return Policy</span>
            </h3>
            <textarea
              rows={4}
              maxLength={1000}
              placeholder="Describe what unique goods you specialize in, provenance guarantees, and shipment terms..."
              value={descForm}
              onChange={(e) => setDescForm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{descForm.length} / 1000</span>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                {loading ? 'Saving...' : 'Update Store Info'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Case 2: Pending Application */}
      {sellerProfile?.verificationStatus === 'PENDING' && (
        <div className="p-7 rounded-2xl bg-[#14120a] border border-amber-500/30 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mx-auto animate-pulse">
            ⏳
          </div>
          <h3 className="text-base font-bold text-white">Seller Verification Pending</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Your application for <span className="font-semibold text-amber-400">"{sellerProfile.storeName}"</span> has been received and is currently in review by the Auctra compliance team.
          </p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">
            Application Status: <span className="text-amber-400 font-bold">IN REVIEW</span>
          </div>
        </div>
      )}

      {/* Case 3: Rejected Application */}
      {sellerProfile?.verificationStatus === 'REJECTED' && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <span>❌</span>
            <span>Application Rejected</span>
          </div>
          <p className="text-xs text-slate-300">
            Reason: {sellerProfile.rejectionReason || 'Documents or compliance details did not satisfy requirements.'}
          </p>
          <p className="text-xs text-slate-400">
            You may correct the information below and re-apply.
          </p>
        </div>
      )}

      {/* Case 4: No Seller Profile or Rejected (Show Application Form) */}
      {(!sellerProfile || sellerProfile.verificationStatus === 'REJECTED') && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#101422] to-[#0c0e17] border border-amber-500/20">
            <h3 className="text-base font-bold text-white mb-1">
              Start Selling Unique Items on Auctra
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Join thousands of authenticated sellers. Submit your merchant verification and banking information below to unlock live auction creation.
            </p>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Store / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Watches & Antiquities"
                  value={appForm.storeName}
                  onChange={(e) => setAppForm({ ...appForm, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Business Entity Type *
                </label>
                <select
                  value={appForm.businessType}
                  onChange={(e) =>
                    setAppForm({
                      ...appForm,
                      businessType: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f121d] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                >
                  <option value="INDIVIDUAL">Individual / Sole Proprietor</option>
                  <option value="REGISTERED_BUSINESS">Registered Company / LLC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tax Identification Number (PAN / GSTIN / SSN) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABCDE1234F"
                value={appForm.taxId}
                onChange={(e) => setAppForm({ ...appForm, taxId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50100123456789"
                  value={appForm.bankAccountNumber}
                  onChange={(e) => setAppForm({ ...appForm, bankAccountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Bank IFSC / Routing Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={appForm.bankIfsc}
                  onChange={(e) => setAppForm({ ...appForm, bankIfsc: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Storefront Description
              </label>
              <textarea
                rows={3}
                placeholder="What kinds of products do you plan to auction?"
                value={appForm.storeDescription}
                onChange={(e) => setAppForm({ ...appForm, storeDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading && <span className="animate-spin text-xs">⏳</span>}
                <span>Submit Seller Application</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
