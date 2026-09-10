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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#081828] border-t border-[#D8E8E8] dark:border-[#184858] px-2 py-2 shadow-lg flex items-center justify-around font-ui"
      aria-label="Mobile Navigation"
    >
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition ${
            isActive
              ? "text-[#2888E8] dark:text-[#48B8C8] font-bold"
              : "text-[#7898A8] dark:text-[#6898A0]"
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
          `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition ${
            isActive
              ? "text-[#2888E8] dark:text-[#48B8C8] font-bold"
              : "text-[#7898A8] dark:text-[#6898A0]"
          }`
        }
        aria-label="Product Catalog"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Catalog</span>
      </NavLink>

      <NavLink
        to={user ? "/account/wishlist" : "/wishlist"}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition ${
            isActive
              ? "text-[#2888E8] dark:text-[#48B8C8] font-bold"
              : "text-[#7898A8] dark:text-[#6898A0]"
          }`
        }
        aria-label="Saved Wishlist"
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Saved</span>
        {wishlistCount > 0 && (
          <span className="absolute top-1 right-3 bg-[#2888E8] dark:bg-[#48B8C8] text-white dark:text-[#081818] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {wishlistCount}
          </span>
        )}
      </NavLink>

      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg text-[#7898A8] dark:text-[#6898A0] hover:text-[#2888E8] dark:hover:text-[#48B8C8] transition"
        aria-label={`Shopping Bag, ${totalCartCount} items`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Bag</span>
        {totalCartCount > 0 && (
          <span className="absolute top-1 right-3 bg-[#2888E8] dark:bg-[#48B8C8] text-white dark:text-[#081818] text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {totalCartCount}
          </span>
        )}
      </button>

      {user ? (
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg transition ${
              isActive
                ? "text-[#2888E8] dark:text-[#48B8C8] font-bold"
                : "text-[#7898A8] dark:text-[#6898A0]"
            }`
          }
          aria-label="Profile"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </NavLink>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-lg text-[#7898A8] dark:text-[#6898A0] hover:text-[#2888E8] dark:hover:text-[#48B8C8] transition"
          aria-label="Sign In"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sign In</span>
        </button>
      )}
    </nav>
  );
};
