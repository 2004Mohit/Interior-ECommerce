import React from "react";
import { AccountNav } from "../../components/customer/AccountNav";
import { MOCK_ADDRESSES } from "../../data/mockData";
import { MapPin, Plus } from "lucide-react";

export const Addresses = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Saved Addresses</h1>
        <button className="gold-gradient-btn px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Address</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOCK_ADDRESSES.map((addr) => (
            <div
              key={addr.id}
              className="premium-panel p-5 rounded-2xl space-y-3 relative"
            >
              {addr.isDefault && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  DEFAULT ADDRESS
                </span>
              )}
              <h3 className="text-sm font-bold text-white">{addr.fullName}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="text-xs text-slate-400">Phone: {addr.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
