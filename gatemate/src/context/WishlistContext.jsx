import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { wishlistRepository } from "../services/wishlistRepository";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Queue for actions triggered prior to guest authentication
  const [pendingWishlistProduct, setPendingWishlistProduct] = useState(null);
  const [authModalRequired, setAuthModalRequired] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await wishlistRepository.getWishlist(user.id);
      setWishlist(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [user, authLoading, fetchWishlist]);

  // Execute any queued wishlist action once the user logs in
  useEffect(() => {
    if (user && pendingWishlistProduct) {
      const productToToggle = pendingWishlistProduct;
      setPendingWishlistProduct(null);
      setAuthModalRequired(false);

      const exists = wishlist.some((item) => item.id === productToToggle.id);
      if (!exists) {
        wishlistRepository
          .addToWishlist(user.id, productToToggle.id)
          .then((updated) => {
            setWishlist(updated);
          });
      }
    }
  }, [user, pendingWishlistProduct, wishlist]);

  const toggleWishlist = async (product) => {
    if (!user) {
      setPendingWishlistProduct(product);
      setAuthModalRequired(true);
      return;
    }

    const isExisting = wishlist.some((item) => item.id === product.id);
    try {
      if (isExisting) {
        const updated = await wishlistRepository.removeFromWishlist(
          user.id,
          product.id,
        );
        setWishlist(updated);
      } else {
        const updated = await wishlistRepository.addToWishlist(
          user.id,
          product.id,
        );
        setWishlist(updated);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    try {
      const updated = await wishlistRepository.removeFromWishlist(
        user.id,
        productId,
      );
      setWishlist(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const closeAuthModal = () => {
    setAuthModalRequired(false);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        loading,
        error,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        authModalRequired,
        closeAuthModal,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
