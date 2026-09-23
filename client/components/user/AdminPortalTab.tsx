'use client';

import React, { useState, useEffect } from 'react';
import { adminApi, UserProfile } from '../../lib/user-api';

interface AdminPortalTabProps {
  token: string;
  currentUser: UserProfile;
  onNotify: (msg: string) => void;
}

export default function AdminPortalTab({
  token,
  currentUser,
  onNotify,
}: AdminPortalTabProps) {
  const [subTab, setSubTab] = useState<'users' | 'applications'>('users');

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Modal / Action states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [newRole, setNewRole] = useState('BUYER');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (subTab === 'users') {
      fetchUsers();
    } else {
      fetchApplications();
    }
  }, [subTab, roleFilter, statusFilter]);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await adminApi.listUsers(token, {
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchApplications() {
    setLoadingApps(true);
    try {
      const res = await adminApi.listSellerApplications(token, 'PENDING');
      if (res.success && res.data) {
        setApplications(res.data);
      }
    } finally {
      setLoadingApps(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selectedUser || !actionReason) {
      alert('Please enter a reason for changing user status.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminApi.updateUserStatus(
        token,
        selectedUser.id,
        newStatus,
        actionReason
      );
      if (res.success) {
        onNotify(`User ${selectedUser.username} status set to ${newStatus}`);
        setSelectedUser(null);
        setActionReason('');
        fetchUsers();
      } else {
        alert(res.error?.message || 'Failed to update status');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateRole() {
    if (!selectedUser || !actionReason) {
      alert('Please enter a reason for changing user role.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminApi.updateUserRole(
        token,
        selectedUser.id,
        newRole,
        actionReason
      );
      if (res.success) {
        onNotify(`User ${selectedUser.username} role changed to ${newRole}`);
        setSelectedUser(null);
        setActionReason('');
        fetchUsers();
      } else {
        alert(res.error?.message || 'Failed to update role');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewApplication(appId: string, status: 'VERIFIED' | 'REJECTED') {
    let reason: string | undefined = undefined;
    if (status === 'REJECTED') {
      const promptReason = prompt('Enter rejection reason for this applicant:');
      if (promptReason === null) return;
      reason = promptReason || 'Compliance requirements not fulfilled.';
    }

    try {
      const res = await adminApi.reviewSellerApplication(token, appId, status, reason);
      if (res.success) {
        onNotify(`Seller application marked as ${status}`);
        fetchApplications();
      } else {
        alert(res.error?.message || 'Failed to process application');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Platform Administration & Moderation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin console for user governance, role elevation, and merchant KYC reviews.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Users Directory
          </button>
          <button
            type="button"
            onClick={() => setSubTab('applications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              subTab === 'applications'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Seller Applications</span>
            {applications.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {applications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subtab 1: Users Directory */}
      {subTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Search by username, email, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0f121d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/60"
              >
                <option value="">All Roles</option>
                <option value="BUYER">BUYER</option>
                <option value="SELLER">SELLER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MODERATOR">MODERATOR</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0f121d] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/60"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BANNED">BANNED</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/5 bg-[#0e121c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-mono">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Loading directory...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{u.username} • {u.email}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : u.role === 'SELLER'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-700/30 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : u.status === 'BANNED' || u.status === 'SUSPENDED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                          {u.sellerProfile?.storeName || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewStatus(u.status);
                              setNewRole(u.role);
                              setActionReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] font-medium text-slate-300 transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Seller Applications */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          {loadingApps ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Loading pending seller submissions...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
              <span className="text-2xl block mb-2">🎉</span>
              <p className="text-xs text-slate-400">All seller applications have been reviewed!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-[#0f121d] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {app.storeName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                        {app.businessType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Applicant: {app.user?.firstName} {app.user?.lastName} (@{app.user?.username} • {app.user?.email})
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Tax ID: {app.taxId}</span>
                      <span>•</span>
                      <span>Bank: {app.bankAccountNumber} ({app.bankIfsc})</span>
                    </div>
                    {app.storeDescription && (
                      <p className="text-xs text-slate-400 italic pt-1">
                        "{app.storeDescription}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReviewApplication(app.id, 'VERIFIED')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      Approve & Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                      className="px-4 py-2 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-xs transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Management Action Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0e121c] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Manage @{selectedUser.username}
                </h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason / Audit Note *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Terms violation, KYC verification, promotion"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Status change section */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Update Account Status
              </label>
              <div className="flex gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0f121d] border border-white/10 text-white text-xs"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BANNED">BANNED</option>
                </select>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdateStatus}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                >
                  Apply Status
                </button>
              </div>
            </div>

            {/* Role change section */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Update Account Role
              </label>
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0f121d] border border-white/10 text-white text-xs"
                >
                  <option value="BUYER">BUYER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MODERATOR">MODERATOR</option>
                </select>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdateRole}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                >
                  Apply Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
