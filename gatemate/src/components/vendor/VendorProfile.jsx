import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Building, MapPin, Phone, Mail } from "lucide-react";
import { vendorService } from "../../services/vendorService";

export const VendorProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    vendorService.getProfile().then(setProfile);
  }, []);

  if (!profile)
    return <div className="p-8 text-xs text-[#606460]">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-[#D9E2EA] pb-4">
        <h1 className="text-2xl font-black text-[#173885]">
          Depot Partner Profile
        </h1>
        <p className="text-xs text-[#606460]">
          Verified business details and bank settlement configurations.
        </p>
      </div>

      <div className="gm-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3 border-b border-[#D9E2EA] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E4EEF3] border border-[#9AAED4]/40 flex items-center justify-center text-[#173885] font-black">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#173885] flex items-center gap-2">
              <span>{profile.businessName}</span>
              <span className="badge-gm-success px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3" /> GST Verified
              </span>
            </h2>
            <p className="text-xs text-[#606460] font-mono">
              GSTIN: {profile.gstin}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#606460]">
          <div>
            <strong className="text-[#282926]">Contact Person:</strong>{" "}
            {profile.contactPerson}
          </div>
          <div>
            <strong className="text-[#282926]">Mobile:</strong> {profile.phone}
          </div>
          <div>
            <strong className="text-[#282926]">Email:</strong> {profile.email}
          </div>
          <div>
            <strong className="text-[#282926]">Depot Yard:</strong>{" "}
            {profile.address}
          </div>
        </div>

        <div className="pt-3 border-t border-[#D9E2EA] text-xs space-y-1">
          <h3 className="font-bold text-[#173885]">Settlement Bank Account:</h3>
          <p className="text-[#606460] font-mono">
            {profile.bankDetails?.bankName} - A/C:{" "}
            {profile.bankDetails?.accountNumber} (IFSC:{" "}
            {profile.bankDetails?.ifscCode})
          </p>
        </div>
      </div>
    </div>
  );
};
