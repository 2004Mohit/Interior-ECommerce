import React from "react";
import { AccountNav } from "../../components/customer/AccountNav";
import { MOCK_NOTIFICATIONS } from "../../data/mockData";
import { Bell } from "lucide-react";

export const Notifications = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Account Notifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <AccountNav />
        </div>

        <div className="md:col-span-3 space-y-3">
          {MOCK_NOTIFICATIONS.map((notif) => (
            <div
              key={notif.id}
              className={`premium-panel p-4 rounded-2xl flex items-start gap-3.5 border ${
                notif.unread
                  ? "border-amber-400/40 bg-[#0e1e36]"
                  : "border-white/5"
              }`}
            >
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white">
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
