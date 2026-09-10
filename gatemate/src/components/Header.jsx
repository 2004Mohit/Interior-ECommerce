import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  LogIn,
  LogOut,
  Crown,
  Heart,
  Search,
  User,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { notificationService } from "../services/notificationService";

export const Header = ({ onOpenAuth, onOpenCart }) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const [navSearch, setNavSearch] = useState("");
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const navigate = useNavigate();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Sync notification unread count when user is logged in
  useEffect(() => {
    if (user?.id) {
      notificationService.getNotifications(user.id).then((list) => {
        const count = list.filter((n) => !n.isRead).length;
        setUnreadNotifCount(count);
      });
    } else {
      setUnreadNotifCount(0);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070e1a]/95 border-b border-white/10 px-4 md:px-8 py-3.5 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="text-slate-950 w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block leading-none">
              GATE<span className="text-amber-400">MATE</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
              Pune & PCMC Gateway Hub
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Search gate latches, ceramics, automated security..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full premium-input pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm placeholder-slate-400"
          />
        </form>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/products"
            className="hidden sm:inline-block px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Catalog
          </Link>

          {/* Wishlist Link */}
          <Link
            to={user ? "/account/wishlist" : "/wishlist"}
            className="relative p-2 rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white transition"
            title="Saved Wishlist"
          >
            <Heart className="w-4 h-4 text-amber-400" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative px-3 py-2 rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 transition text-white flex items-center gap-2 text-xs font-semibold"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Bag</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Authenticated Customer Controls */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Notification Button (Visible when logged in) */}
              <Link
                to="/account/notifications"
                className="relative p-2 rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white transition"
                title="Notifications & 30-Min Dispatch Alerts"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </Link>

              {/* Profile Shortcut */}
              <Link
                to="/account"
                className="p-2 rounded-xl bg-[#172a4d] border border-amber-400/30 text-amber-300 hover:bg-[#1f3866] transition flex items-center gap-1.5 text-xs font-bold"
                title="Account Hub"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {user.email?.split("@")[0] || "Account"}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-[#1a0f18] border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition text-xs"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="gold-gradient-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
