'use client';

import React, { useState } from 'react';
import { Address, addressApi } from '../../lib/user-api';
import AddressModal from './AddressModal';

interface AddressBookTabProps {
  token: string;
  addresses: Address[];
  onAddressesUpdated: () => void;
  onNotify: (msg: string) => void;
}

export default function AddressBookTab({
  token,
  addresses,
  onAddressesUpdated,
  onNotify,
}: AddressBookTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function handleSave(data: any) {
    if (editingAddress) {
      const res = await addressApi.update(token, editingAddress.id, data);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to update address');
      }
      onNotify('Address updated successfully!');
    } else {
      const res = await addressApi.create(token, data);
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to create address');
      }
      onNotify('New address saved to your address book!');
    }
    onAddressesUpdated();
  }

  async function handleSetDefault(id: string) {
    setActionLoadingId(id);
    try {
      const res = await addressApi.setDefault(token, id);
      if (res.success) {
        onNotify('Default shipping address updated!');
        onAddressesUpdated();
      } else {
        alert(res.error?.message || 'Failed to update default address');
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setActionLoadingId(id);
    try {
      const res = await addressApi.delete(token, id);
      if (res.success) {
        onNotify('Address deleted.');
        onAddressesUpdated();
      } else {
        alert(res.error?.message || 'Failed to delete address');
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📍</span>
            <span>Delivery & Shipping Addresses</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your saved delivery locations for winning auction deliveries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAddress(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>＋</span>
          <span>Add New Address</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl mb-3">
            📍
          </div>
          <h3 className="text-sm font-bold text-white">No addresses saved yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Add a shipping address so sellers know where to deliver your auction purchases.
          </p>
          <button
            onClick={() => {
              setEditingAddress(null);
              setModalOpen(true);
            }}
            className="px-4 py-1.5 rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 font-semibold text-xs transition-all"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                addr.isDefault
                  ? 'bg-gradient-to-b from-[#141824] to-[#0f121d] border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-[#0f121b]/80 border-white/5 hover:border-white/10'
              }`}
            >
              {addr.isDefault && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 tracking-wide">
                  DEFAULT SHIPPING
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-white">{addr.fullName}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {addr.streetLine1}
                  {addr.streetLine2 ? `, ${addr.streetLine2}` : ''}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Country: {addr.country} • Phone: {addr.phone}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/5">
                {!addr.isDefault && (
                  <button
                    type="button"
                    disabled={actionLoadingId === addr.id}
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-amber-400/80 hover:text-amber-300 transition-all mr-auto"
                  >
                    Set as Default
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(addr);
                    setModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] font-medium text-slate-300 transition-all"
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === addr.id}
                  onClick={() => handleDelete(addr.id)}
                  className="px-2.5 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-[11px] font-medium text-red-400 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingAddress}
      />
    </div>
  );
}
