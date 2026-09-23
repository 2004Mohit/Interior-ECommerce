import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Lock,
  AlertCircle,
  RotateCcw,
  PackageX,
} from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { ProductCardSkeleton } from "../ProductCardSkeleton";

export const Wishlist = () => {
  const { user, loading: authLoading } = useAuth();

  const { wishlist, removeFromWishlist, loading, error, fetchWishlist } =
    useWishlist();

  const { addToCart } = useCart();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [actionProductId, setActionProductId] = useState(null);

  const showSuccess = (message) => {
    setSuccessNotice(message);

    window.setTimeout(() => {
      setSuccessNotice(null);
    }, 3000);
  };

  const handleRemove = async (product) => {
    if (!product?.id) return;

    try {
      setActionProductId(product.id);

      await removeFromWishlist(product.id);

      showSuccess(`"${product.name}" was removed from your saved products.`);
    } finally {
      setActionProductId(null);
    }
  };

  const handleMoveToCart = async (product) => {
    if (!product?.id) return;

    try {
      setActionProductId(product.id);

      /*
       * CartContext handles the product MOQ.
       * We pass the product's MOQ so the saved product can
       * be moved to the cart with a valid starting quantity.
       */
      const quantity = Math.max(Number(product.moq || 1), 1);

      await addToCart(product, quantity);

      await removeFromWishlist(product.id);

      showSuccess(`"${product.name}" moved to your Shopping Bag.`);
    } catch (err) {
      console.error("Wishlist: unable to move product to cart:", err);

      showSuccess(
        err?.message || "Unable to move this product to your Shopping Bag.",
      );
    } finally {
      setActionProductId(null);
    }
  };

  /*
   * Guest interception.
   */
  if (!authLoading && !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-1">
            <div className="gm-panel p-4 rounded-3xl border border-[#D9E2EA] bg-[#FEFEFE]">
              <div className="text-xs font-bold text-[#173885]">
                Saved Products
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="gm-panel p-10 sm:p-14 rounded-3xl border border-[#D9E2EA] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FBE8EC] border border-[#E7B8C4] text-[#B43D5B] flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#173885]">
                Saved Products
              </h2>

              <p className="text-xs text-[#606460] leading-relaxed max-w-md mx-auto">
                Sign in to save construction products and access your saved
                products across your devices.
              </p>

              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="btn-gm-primary px-6 py-3 rounded-xl text-xs font-bold"
              >
                Sign In to View Saved Products
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            fetchWishlist();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-24">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EA] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FBE8EC] border border-[#E7B8C4] flex items-center justify-center text-[#B43D5B]">
            <Heart className="w-6 h-6 fill-current" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#173885]">
              My Saved Products
            </h1>

            <p className="text-xs text-[#606460]">
              {wishlist.length} saved product
              {wishlist.length === 1 ? "" : "s"} in your private collection
            </p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <Link
            to="/products"
            className="text-xs font-bold text-[#3C7DDA] hover:text-[#173885] transition self-start sm:self-auto"
          >
            + Add More Products
          </Link>
        )}
      </div>

      {/* =====================================================
          SUCCESS NOTICE
      ====================================================== */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-[#EAF6E4] border border-[#B9D9AA] text-[#3F7D20] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />

          <span>{successNotice}</span>
        </div>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3)
            .fill(null)
            .map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
        </div>
      ) : error ? (
        /* ===================================================
           ERROR
        ==================================================== */
        <div className="gm-panel p-12 rounded-3xl text-center space-y-4 max-w-lg mx-auto border border-[#D9E2EA]">
          <div className="w-14 h-14 rounded-2xl bg-[#FBE3DE] border border-[#E4B8AD] text-[#B43D20] flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-[#173885]">
            Error Loading Saved Products
          </h3>

          <p className="text-xs text-[#606460] leading-relaxed">{error}</p>

          <button
            type="button"
            onClick={fetchWishlist}
            className="btn-gm-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : wishlist.length === 0 ? (
        /* ===================================================
           EMPTY
        ==================================================== */
        <div className="gm-panel p-12 sm:p-16 rounded-3xl text-center space-y-4 max-w-lg mx-auto border border-[#D9E2EA]">
          <div className="w-16 h-16 rounded-2xl bg-[#F4F6FA] text-[#8A9298] flex items-center justify-center mx-auto border border-[#D9E2EA]">
            <Heart className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-[#173885]">
            Your Saved Products List is Empty
          </h3>

          <p className="text-xs text-[#606460] leading-relaxed max-w-sm mx-auto">
            Browse the construction catalogue and save products that you want to
            consider for your project.
          </p>

          <Link
            to="/products"
            className="btn-gm-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold"
          >
            <span>Explore Construction Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* ===================================================
           PRODUCT GRID
        ==================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((product) => {
            const isProcessing = actionProductId === product.id;

            return (
              <div
                key={product.id}
                className="gm-panel rounded-3xl overflow-hidden flex flex-col justify-between group border border-[#D9E2EA] relative hover:border-[#3C7DDA] transition"
              >
                <div>
                  {/* ========================================
                      IMAGE
                  ======================================== */}
                  <div className="relative h-56 w-full overflow-hidden bg-[#F4F6FA]">
                    <Link
                      to={`/products/${product.slug}`}
                      className="block w-full h-full"
                    >
                      {product.img ? (
                        <img
                          src={product.img}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PackageX className="w-10 h-10 text-[#B5BEC5]" />
                        </div>
                      )}
                    </Link>

                    {/* Express Badge */}
                    {product.isExpress30MinAvailable && (
                      <span className="absolute top-3 left-3 bg-[#173885] text-[#FEFEFE] px-2.5 py-1 rounded-lg text-[9px] font-black">
                        30-MIN
                      </span>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      disabled={isProcessing}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-[#FEFEFE]/95 text-[#B43D5B] hover:bg-[#FBE8EC] border border-[#D9E2EA] transition disabled:opacity-50"
                      title="Remove from saved products"
                      aria-label={`Remove ${product.name} from saved products`}
                    >
                      {isProcessing ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* ========================================
                      PRODUCT INFORMATION
                  ======================================== */}
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold text-[#8A9298] uppercase tracking-wider">
                      {product.category}
                    </span>

                    <Link to={`/products/${product.slug}`}>
                      <h3 className="text-[#282926] font-bold text-sm line-clamp-2 group-hover:text-[#3C7DDA] transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    {product.brand && (
                      <p className="text-[10px] text-[#8A9298]">
                        {product.brand}
                      </p>
                    )}

                    <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                      <span className="text-base font-black text-[#173885] font-mono">
                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                      </span>

                      <span className="text-[10px] text-[#606460] font-semibold">
                        / {product.unit || "Unit"}
                      </span>

                      {product.originalPrice &&
                        Number(product.originalPrice) >
                          Number(product.price) && (
                          <span className="text-xs text-[#9AA0A5] line-through font-mono">
                            ₹
                            {Number(product.originalPrice).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] text-[#606460]">
                        Minimum order:{" "}
                        <strong className="text-[#282926]">
                          {product.moq || 1} {product.unit || "unit"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ==========================================
                    ACTION
                =========================================== */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(product)}
                    disabled={isProcessing}
                    className="w-full btn-gm-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Shopping Bag</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
