import React from "react";
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
              Hyperlocal construction products and building hardware marketplace
              supplying certified Cement, TMT Steel, AAC Blocks, Sand,
              Aggregates, Plumbing, and Electrical supplies directly to job
              sites across Pune & PCMC.
            </p>
          </div>

          {/* Core Construction Supply Domains */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Product Categories
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Cement (OPC 53 & PPC), Fe 550D TMT Steel Rebars, AAC Lightweight
              Blocks, Red Clay Bricks, Manufactured M-Sand, 20mm Basalt
              Aggregates, CPVC Plumbing Systems, FR Copper Cables, and
              Industrial Waterproofing Compounds.
            </p>
          </div>

          {/* Commercial B2B & Supply Terms */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Commercial Procurement
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Direct wholesale depot pricing for builders, structural engineers,
              and contractors. Full truckload bookings, batch mill test
              certificates, and complete GST input tax credit (ITC) invoicing on
              all commercial orders.
            </p>
          </div>

          {/* Regional Logistics Depot */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Pune & PCMC Logistics Hub
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Central Logistics Hub, Hadapsar Industrial Area, Pune 411028
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91-9829012345 (Contractor Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>support@gatemate.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Compliance & Policy Bar */}
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
              30-Minute Delivery on Eligible Products/Orders
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
