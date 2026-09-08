import React from "react";
import { ShoppingCart, LogIn, LogOut, User, Store, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export const Header = ({
  onOpenAuth,
  onOpenCart,
  activeView,
  setActiveView,
}) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setActiveView("shop")}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center border border-blue-400/40">
          <Store className="text-cyan-300 w-6 h-6 animate-pulse" />
        </div>
        <span className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-sky-300 to-cyan-400">
          GateMate
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation Switchers for Customer / Seller / Admin */}
        <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/10 text-xs">
          <button
            onClick={() => setActiveView("shop")}
            className={`px-3 py-1.5 rounded-full transition ${activeView === "shop" ? "bg-sky-600 text-white font-semibold" : "text-blue-100 hover:text-white"}`}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveView("seller")}
            className={`px-3 py-1.5 rounded-full transition ${activeView === "seller" ? "bg-sky-600 text-white font-semibold" : "text-blue-100 hover:text-white"}`}
          >
            Seller Hub
          </button>
          <button
            onClick={() => setActiveView("admin")}
            className={`px-3 py-1.5 rounded-full transition ${activeView === "admin" ? "bg-sky-600 text-white font-semibold" : "text-blue-100 hover:text-white"}`}
          >
            Admin
          </button>
        </div>

        {/* Cart Trigger */}
        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-xl glass-card hover:bg-white/20 transition-all text-white flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5 text-cyan-300" />
          <span className="hidden sm:inline text-sm font-medium">Cart</span>
          {totalCartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-slate-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Auth CTA */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200 hidden sm:inline">
              {user.email || user.phone}
            </span>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl glass-card text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1 text-sm font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold flex items-center gap-2 text-sm shadow-md transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
