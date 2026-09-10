import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  LogIn,
  LogOut,
  Heart,
  Search,
  User,
  Bell,
  Crown,
  X,
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

  const handleClearSearch = () => {
    setNavSearch("");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070e1a]/95 border-b border-white/10 px-3 sm:px-6 md:px-8 py-3 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 select-none shrink-0 group"
          aria-label="GateMate Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="text-slate-950 w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block leading-none">
              GATE<span className="text-amber-400">MATE</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300/80 hidden sm:block">
              Pune & PCMC Construction Hub
            </span>
          </div>
        </Link>

        {/* Search Bar with Clear Cross Button */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex flex-1 max-w-md relative items-center"
          role="search"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search cement, TMT rebars, AAC blocks, CPVC pipes..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full premium-input pl-10 pr-9 py-2 rounded-xl text-xs placeholder-slate-400"
            aria-label="Search construction products"
          />
          {navSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            to="/products"
            className="hidden md:inline-block px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
          >
            Catalogue
          </Link>

          {/* Wishlist */}
          <Link
            to={user ? "/account/wishlist" : "/wishlist"}
            className="relative hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white transition"
            title="Saved Products Wishlist"
            aria-label="Saved Products Wishlist"
          >
            <Heart className="w-4 h-4 text-amber-400" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Bag */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 transition text-white flex items-center gap-2 text-xs font-bold"
            aria-label={`Shopping Bag with ${totalCartCount} products`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Bag</span>
            {totalCartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* User Auth & Controls */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/account/notifications"
                className="relative min-w-[40px] min-h-[40px] hidden sm:flex items-center justify-center rounded-xl bg-[#0d1c33] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white transition"
                title="Dispatch Notifications"
                aria-label="Dispatch Notifications"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </Link>

              <Link
                to="/account"
                className="min-h-[40px] px-3 py-2 rounded-xl bg-[#172a4d] border border-amber-400/30 text-amber-300 hover:bg-[#1f3866] transition flex items-center gap-1.5 text-xs font-bold"
                title="Account Hub"
                aria-label="Account Hub"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {user.email?.split("@")[0] || "Account"}
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#1a0f18] border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition text-xs"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="gold-gradient-btn min-h-[44px] px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 shadow-lg"
              aria-label="Sign In to Account"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-950" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
