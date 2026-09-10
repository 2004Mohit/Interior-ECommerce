import React from "react";
import { Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full bg-[#082858] dark:bg-[#081828] border-t border-[#081838] dark:border-[#184858] text-[#B8E8F8] dark:text-[#98C8D0] text-xs mt-auto font-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Section 1: About */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 select-none">
              <div className="w-7 h-7 rounded-lg bg-[#2888E8] dark:bg-[#48B8C8] flex items-center justify-center text-white dark:text-[#081818]">
                <Shield className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-display text-2xl tracking-wide text-white dark:text-[#D8F8F8]">
                GATEMATE
              </span>
            </div>
            <p className="text-xs text-[#B8E8F8] dark:text-[#98C8D0] leading-relaxed max-w-xs">
              GateMate is a residential architectural hardware and community
              access marketplace operating across Pune & PCMC.
            </p>
          </div>

          {/* Section 2: Information & Policies */}
          <div className="space-y-2.5">
            <h4 className="font-display text-base text-white dark:text-[#D8F8F8] tracking-wider">
              INFORMATION
            </h4>
            <ul className="space-y-1.5 text-xs text-[#B8E8F8] dark:text-[#98C8D0]">
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                About Us
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Delivery Policy
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Return & Refund Policy
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Privacy Policy
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Terms & Conditions
              </li>
            </ul>
          </div>

          {/* Section 3: Business */}
          <div className="space-y-2.5">
            <h4 className="font-display text-base text-white dark:text-[#D8F8F8] tracking-wider">
              BUSINESS
            </h4>
            <ul className="space-y-1.5 text-xs text-[#B8E8F8] dark:text-[#98C8D0]">
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Vendor Partnership
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Business Enquiries
              </li>
              <li className="hover:text-white dark:hover:text-[#58C8D8] cursor-default">
                Commercial Procurement (B2B)
              </li>
            </ul>
          </div>

          {/* Section 4: Support */}
          <div className="space-y-2.5">
            <h4 className="font-display text-base text-white dark:text-[#D8F8F8] tracking-wider">
              SUPPORT
            </h4>
            <p className="text-xs text-[#B8E8F8] dark:text-[#98C8D0] leading-relaxed">
              Need assistance with gate specifications or delivery? Contact our
              facility team.
            </p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-1 rounded bg-[#081838] dark:bg-[#183848] border border-[#2888E8]/30 dark:border-[#48B8C8]/30 text-[11px] font-semibold text-[#F8C828] dark:text-[#48B8C8]">
                Pune & PCMC Support Line
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-8 pt-6 border-t border-[#081838] dark:border-[#184858] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7898A8] dark:text-[#6898A0]">
          <p>© 2026 GateMate Systems. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[#B8E8F8] dark:text-[#98C8D0]">
            <span className="cursor-default hover:text-white">
              Privacy Policy
            </span>
            <span>•</span>
            <span className="cursor-default hover:text-white">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
