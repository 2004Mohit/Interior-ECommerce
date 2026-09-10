import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileBottomNav } from "./components/common/MobileBottomNav";
import { CheckoutDrawer } from "./components/customer/CheckoutDrawer";
import { AuthModal } from "./components/AuthModal";

// Customer Views
import { CustomerHome } from "./components/customer/CustomerHome";
import { ProductListing } from "./components/customer/ProductListing";
import { ProductDetails } from "./components/customer/ProductDetails";
import { SearchResults } from "./components/customer/SearchResults";
import { Wishlist } from "./components/customer/Wishlist";
import { Cart } from "./components/customer/Cart";
import { Checkout } from "./components/customer/Checkout";
import { Account } from "./components/customer/Account";
import { Addresses } from "./components/customer/Addresses";
import { Orders } from "./components/customer/Orders";
import { OrderDetails } from "./components/customer/OrderDetails";
import { Notifications } from "./components/customer/Notifications";
import { CustomerReviews } from "./components/customer/CustomerReviews";
import { Preferences } from "./components/customer/Preferences";
import { AccountWishlist } from "./components/customer/AccountWishlist";
import { B2BQuotations } from "./components/customer/B2BQuotations";

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { authModalRequired, closeAuthModal } = useWishlist();

  return (
    <div className="min-h-screen bg-city-pattern bg-cover bg-center bg-fixed text-slate-100 flex flex-col relative font-sans">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/90 via-[#0a1424]/92 to-[#050b14]/96 z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/products/:slug" element={<ProductDetails />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Customer Account Sub-Routes */}
            <Route path="/account" element={<Account />} />
            <Route path="/account/wishlist" element={<AccountWishlist />} />
            <Route path="/account/b2b" element={<B2BQuotations />} />
            <Route path="/account/addresses" element={<Addresses />} />
            <Route path="/account/orders" element={<Orders />} />
            <Route path="/account/orders/:id" element={<OrderDetails />} />
            <Route path="/account/notifications" element={<Notifications />} />
            <Route path="/account/reviews" element={<CustomerReviews />} />
            <Route path="/account/preferences" element={<Preferences />} />

            {/* Vendor & Admin Placeholders (Preserved without breakage) */}
            <Route
              path="/seller"
              element={
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                  <div className="premium-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-2">
                      GateMate Stockist & Vendor Hub
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Listing workflows & depot metrics.
                    </p>
                  </div>
                </div>
              }
            />
            <Route
              path="/admin"
              element={
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                  <div className="premium-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-2">
                      GateMate Admin Portal
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Platform oversight, dispatch zones, & catalogue controls.
                    </p>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>

      {/* Global Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Drawer & Modal Overlays */}
      <CheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen || authModalRequired}
        onClose={() => {
          setIsAuthOpen(false);
          closeAuthModal();
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          closeAuthModal();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
