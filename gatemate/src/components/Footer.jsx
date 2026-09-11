import React from "react";
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
              Hyperlocal construction products and building hardware marketplace
              supplying certified Cement, TMT Steel, AAC Blocks, Sand,
              Aggregates, Plumbing, and Electrical supplies directly to job
              sites across Pune & PCMC.
            </p>
          </div>

          {/* Core Construction Supply Domains */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Product Categories
            </h4>
            <p className="text-[#E4EEF3] text-xs leading-relaxed">
              Cement (OPC 53 & PPC), Fe 550D TMT Steel Rebars, AAC Lightweight
              Blocks, Red Clay Bricks, Manufactured M-Sand, 20mm Basalt
              Aggregates, CPVC Plumbing Systems, FR Copper Cables, and
              Industrial Waterproofing Compounds.
            </p>
          </div>

          {/* Commercial B2B & Supply Terms */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Commercial Procurement
            </h4>
            <p className="text-[#E4EEF3] text-xs leading-relaxed">
              Direct wholesale depot pricing for builders, structural engineers,
              and contractors. Full truckload bookings, batch mill test
              certificates, and complete GST input tax credit (ITC) invoicing on
              all commercial orders.
            </p>
          </div>

          {/* Regional Logistics Depot */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#FEFEFE] uppercase tracking-wider">
              Pune & PCMC Logistics Hub
            </h4>
            <div className="space-y-2 text-xs text-[#E4EEF3]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#A5D6FA] shrink-0 mt-0.5" />
                <span>
                  Central Logistics Hub, Hadapsar Industrial Area, Pune 411028
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A5D6FA] shrink-0" />
                <span>+91-9829012345 (Contractor Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#A5D6FA] shrink-0" />
                <span>support@gatemate.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Compliance & Policy Bar */}
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
              30-Minute Delivery on Eligible Products/Orders
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
