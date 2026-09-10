import React from "react";
<<<<<<< HEAD
import { MapPin, Phone, Mail, ShieldCheck, Zap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full bg-[#173885] border-t border-[#0F255C] text-[#E4EEF3] text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Informational Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Wordmark & Marketplace Summary */}
          <div className="space-y-3">
            <div className="flex flex-col select-none">
              <span className="text-2xl font-black tracking-tight leading-none">
                <span className="text-[#FEFEFE]">GATE</span>
                <span className="text-[#A5D6FA]">MATE</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#A5D6FA] mt-1">
                Pune & PCMC Construction Hub
              </span>
            </div>
            <p className="text-[#E4EEF3] text-xs leading-relaxed">
=======
import { Crown, MapPin, Phone, Mail, ShieldCheck, Zap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full bg-[#050b14] border-t border-white/10 text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Informational Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Platform Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <Crown className="text-slate-950 w-4 h-4 fill-slate-950" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                GATE<span className="text-amber-400">MATE</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              Hyperlocal construction products and building hardware marketplace
              supplying certified Cement, TMT Steel, AAC Blocks, Sand,
              Aggregates, Plumbing, and Electrical supplies directly to job
              sites across Pune & PCMC.
            </p>
          </div>

          {/* Core Construction Supply Domains */}
          <div className="space-y-2.5">
<<<<<<< HEAD
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Product Categories
            </h4>
            <p className="text-[#E4EEF3] text-xs leading-relaxed">
=======
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Product Categories
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              Cement (OPC 53 & PPC), Fe 550D TMT Steel Rebars, AAC Lightweight
              Blocks, Red Clay Bricks, Manufactured M-Sand, 20mm Basalt
              Aggregates, CPVC Plumbing Systems, FR Copper Cables, and
              Industrial Waterproofing Compounds.
            </p>
          </div>

          {/* Commercial B2B & Supply Terms */}
          <div className="space-y-2.5">
<<<<<<< HEAD
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Commercial Procurement
            </h4>
            <p className="text-[#E4EEF3] text-xs leading-relaxed">
=======
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Commercial Procurement
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              Direct wholesale depot pricing for builders, structural engineers,
              and contractors. Full truckload bookings, batch mill test
              certificates, and complete GST input tax credit (ITC) invoicing on
              all commercial orders.
            </p>
          </div>

          {/* Regional Logistics Depot */}
          <div className="space-y-2.5">
<<<<<<< HEAD
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Pune & PCMC Logistics Hub
            </h4>
            <div className="space-y-2 text-xs text-[#E4EEF3]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#A5D6FA] shrink-0 mt-0.5" />
=======
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Pune & PCMC Logistics Hub
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                <span>
                  Central Logistics Hub, Hadapsar Industrial Area, Pune 411028
                </span>
              </div>
              <div className="flex items-center gap-2">
<<<<<<< HEAD
                <Phone className="w-4 h-4 text-[#A5D6FA] shrink-0" />
                <span>+91-9829012345 (Contractor Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#A5D6FA] shrink-0" />
=======
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91-9829012345 (Contractor Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
                <span>support@gatemate.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Compliance & Policy Bar */}
<<<<<<< HEAD
        <div className="pt-6 border-t border-[#0F255C] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A5D6FA]">
          <p>
            © 2026 GateMate Marketplace Private Limited. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-[#FEFEFE]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E1F2D9]" />
              100% Certified Test Batches
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#FEFEFE]">
              <Zap className="w-3.5 h-3.5 text-[#A5D6FA] fill-[#A5D6FA]" />
=======
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © 2026 GateMate Marketplace Private Limited. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Certified Test Batches
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
>>>>>>> 1d02419 (feat(customer): complete construction marketplace overhaul, terminology audit, SEO, and text-only footer)
              30-Minute Delivery on Eligible Products/Orders
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
