import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";

// Customer Components
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

// Vendor Views & Architecture
import { VendorLayout } from "./components/vendor/VendorLayout";
import { VendorProtectedRoute } from "./components/vendor/VendorProtectedRoute";
import { VendorLanding } from "./components/vendor/VendorLanding";
import { VendorRegister } from "./components/vendor/VendorRegister";
import { VendorLogin } from "./components/vendor/VendorLogin";
import { VendorGuidelines } from "./components/vendor/VendorGuidelines";
import { VendorBenefits } from "./components/vendor/VendorBenefits";
import { VendorOnboarding } from "./components/vendor/VendorOnboarding";
import { VendorVerificationStatus } from "./components/vendor/VendorVerificationStatus";
import { VendorDashboard } from "./components/vendor/VendorDashboard";
import { VendorProducts } from "./components/vendor/VendorProducts";
import { VendorProductForm } from "./components/vendor/VendorProductForm";
import { VendorInventory } from "./components/vendor/VendorInventory";
import { VendorOrders } from "./components/vendor/VendorOrders";
import { VendorOrderDetail } from "./components/vendor/VendorOrderDetail";
import { VendorRfqs } from "./components/vendor/VendorRfqs";
import { VendorRfqDetail } from "./components/vendor/VendorRfqDetail";
import { VendorQuotations } from "./components/vendor/VendorQuotations";
import { VendorPayments } from "./components/vendor/VendorPayments";
import { VendorSettlements } from "./components/vendor/VendorSettlements";
import { VendorReviews } from "./components/vendor/VendorReviews";
import { VendorNotifications } from "./components/vendor/VendorNotifications";
import { VendorProfile } from "./components/vendor/VendorProfile";

// Admin Consoles
import { AdminVendorReviewPanel } from "./components/admin/AdminVendorReviewPanel";
import { AdminAttributeReviewPanel } from "./components/admin/AdminAttributeReviewPanel";
import { AdminProductReviewPanel } from "./components/admin/AdminProductReviewPanel";

function CustomerAppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { authModalRequired, closeAuthModal } = useWishlist();

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#282926] flex flex-col relative font-sans">
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

          <Route path="/seller" element={<Navigate to="/sell" replace />} />
        </Routes>
      </main>

      <Footer />

      <MobileBottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

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
        <VendorAuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Routes>
                {/* 1. Public Vendor Portal Routes (Independent) */}
                <Route path="/sell" element={<VendorLanding />} />
                <Route path="/vendor" element={<VendorLanding />} />
                <Route path="/vendor/register" element={<VendorRegister />} />
                <Route path="/vendor/login" element={<VendorLogin />} />
                <Route
                  path="/vendor/guidelines"
                  element={<VendorGuidelines />}
                />
                <Route path="/vendor/benefits" element={<VendorBenefits />} />
                <Route
                  path="/vendor/onboarding"
                  element={<VendorOnboarding />}
                />
                <Route
                  path="/vendor/verification"
                  element={<VendorVerificationStatus />}
                />

                {/* 2. Protected Vendor Operations Terminal */}
                <Route
                  path="/vendor"
                  element={
                    <VendorProtectedRoute>
                      <VendorLayout />
                    </VendorProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<VendorDashboard />} />
                  <Route path="products" element={<VendorProducts />} />
                  <Route path="products/new" element={<VendorProductForm />} />
                  <Route path="products/:id" element={<VendorProductForm />} />
                  <Route
                    path="products/:id/preview"
                    element={<VendorProductPreview />}
                  />
                  <Route path="inventory" element={<VendorInventory />} />
                  <Route path="orders" element={<VendorOrders />} />
                  <Route path="orders/:id" element={<VendorOrderDetail />} />
                  <Route path="rfqs" element={<VendorRfqs />} />
                  <Route path="rfqs/:id" element={<VendorRfqDetail />} />
                  <Route path="quotations" element={<VendorQuotations />} />
                  <Route path="payments" element={<VendorPayments />} />
                  <Route path="settlements" element={<VendorSettlements />} />
                  <Route path="reviews" element={<VendorReviews />} />
                  <Route
                    path="notifications"
                    element={<VendorNotifications />}
                  />
                  <Route path="profile" element={<VendorProfile />} />
                </Route>

                {/* 3. Admin Consoles */}
                <Route path="/admin" element={<AdminVendorReviewPanel />} />
                <Route
                  path="/admin/vendor-reviews"
                  element={<AdminVendorReviewPanel />}
                />
                <Route
                  path="/admin/attributes"
                  element={<AdminAttributeReviewPanel />}
                />
                <Route
                  path="/admin/product-reviews"
                  element={<AdminProductReviewPanel />}
                />
                {/* 4. Customer Storefront */}
                <Route path="/*" element={<CustomerAppContent />} />
              </Routes>
            </CartProvider>
          </WishlistProvider>
        </VendorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
