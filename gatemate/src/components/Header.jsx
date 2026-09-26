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
  X,
  Store,
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
    <header className="sticky top-0 z-40 w-full bg-[#FEFEFE]/95 border-b border-[#D9E2EA] px-3 sm:px-6 md:px-8 py-3 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Text Wordmark */}
        <Link
          to="/"
          className="flex flex-col select-none shrink-0"
          aria-label="Ferrado Home"
        >
          <span className="text-2xl font-black tracking-tight leading-none">
            <span className="text-[#173885]">FERRA</span>
            <span className="text-[#3C7DDA]">DO</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#6F8A92] hidden sm:block mt-0.5">
            Pune & PCMC Construction Hub
          </span>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex flex-1 max-w-md relative items-center"
          role="search"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F8A92] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search Product here"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full gm-input pl-10 pr-9 py-2 rounded-xl text-xs [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            aria-label="Search construction products"
          />
          {navSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#6F8A92] hover:text-[#282926] hover:bg-[#E4EEF3] transition"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Right Navigation Elements */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/products"
            className="hidden md:inline-block px-3 py-2 rounded-xl text-xs font-bold text-[#606460] hover:text-[#173885] hover:bg-[#E4EEF3] transition"
          >
            Catalogue
          </Link>

          {/* Become a Vendor link visible ONLY to Guest Users */}
          {!user && (
            <Link
              to="/sell"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#173885] bg-[#E4EEF3] hover:bg-[#D9E2EA] border border-[#9AAED4]/40 transition"
            >
              <Store className="w-3.5 h-3.5 text-[#3C7DDA]" />
              <span>Become a Vendor</span>
            </Link>
          )}

          {/* Wishlist */}
          <Link
            to={user ? "/account/wishlist" : "/wishlist"}
            className="relative hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] text-[#606460] hover:text-[#3C7DDA] transition"
            title="Saved Products Wishlist"
            aria-label="Saved Products Wishlist"
          >
            <Heart className="w-4 h-4 text-[#3C7DDA]" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Shopping Bag */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative min-w-[44px] min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] transition text-[#282926] flex items-center gap-2 text-xs font-bold"
            aria-label={`Shopping Bag with ${totalCartCount} products`}
          >
            <ShoppingBag className="w-4 h-4 text-[#3C7DDA]" />
            <span className="hidden lg:inline">Bag</span>
            {totalCartCount > 0 && (
              <span className="bg-[#3C7DDA] text-[#FEFEFE] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Customer Auth Profile / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/account/notifications"
                className="relative min-w-[40px] min-h-[40px] hidden sm:flex items-center justify-center rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] hover:border-[#3C7DDA] text-[#606460] hover:text-[#173885] transition"
                title="Dispatch Notifications"
                aria-label="Dispatch Notifications"
              >
                <Bell className="w-4 h-4 text-[#3C7DDA]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B43D20] text-[#FEFEFE] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </Link>

              <Link
                to="/account"
                className="min-h-[40px] px-3 py-2 rounded-xl bg-[#E4EEF3] border border-[#9AAED4]/40 text-[#173885] hover:bg-[#D9E2EA] transition flex items-center gap-1.5 text-xs font-bold"
                title="Account Hub"
                aria-label="Account Hub"
              >
                <User className="w-4 h-4 text-[#173885]" />
                <span className="hidden sm:inline">
                  {user.email?.split("@")[0] || "Account"}
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#FEFEFE] border border-[#D9E2EA] text-[#606460] hover:text-[#B43D20] hover:border-[#FBE3DE] transition text-xs"
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
              className="btn-gm-primary min-h-[44px] px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95"
              aria-label="Sign In to Account"
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
