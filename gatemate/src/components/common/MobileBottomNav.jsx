import React from "react";
import { NavLink } from "react-router-dom";
import { Compass, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";

export const MobileBottomNav = ({ onOpenCart, onOpenAuth }) => {
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FEFEFE]/95 border-t border-[#D9E2EA] px-2 py-2 shadow-lg backdrop-blur-md flex items-center justify-around"
      aria-label="Mobile Bottom Navigation"
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
            isActive ? "text-[#173885] font-bold" : "text-[#606460]"
          }`
        }
        aria-label="Explore Home"
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Explore</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
            isActive ? "text-[#173885] font-bold" : "text-[#606460]"
          }`
        }
        aria-label="Product Catalogue"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Catalogue</span>
      </NavLink>

      <NavLink
        to={user ? "/account/wishlist" : "/wishlist"}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
            isActive ? "text-[#173885] font-bold" : "text-[#606460]"
          }`
        }
        aria-label="Saved Wishlist"
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Saved</span>
        {wishlistCount > 0 && (
          <span className="absolute top-1 right-3 bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {wishlistCount}
          </span>
        )}
      </NavLink>

      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[#606460] hover:text-[#173885] transition"
        aria-label={`Shopping Bag, ${totalCartCount} products`}
      >
        <ShoppingBag className="w-5 h-5 text-[#3C7DDA]" />
        <span className="text-[10px] mt-0.5">Bag</span>
        {totalCartCount > 0 && (
          <span className="absolute top-1 right-3 bg-[#3C7DDA] text-[#FEFEFE] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {totalCartCount}
          </span>
        )}
      </button>

      {user ? (
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition ${
              isActive ? "text-[#173885] font-bold" : "text-[#606460]"
            }`
          }
          aria-label="Profile Account"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[#606460] hover:text-[#173885] transition"
          aria-label="Sign In"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sign In</span>
        </button>
      )}
    </nav>
  );
};
