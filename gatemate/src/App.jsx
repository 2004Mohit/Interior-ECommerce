import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";

// Customer Components & Views
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { MobileBottomNav } from "./components/common/MobileBottomNav";
import { CheckoutDrawer } from "./components/customer/CheckoutDrawer";
import { AuthModal } from "./components/AuthModal";
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
import { Complaints } from "./components/customer/Complaints";
import { Preferences } from "./components/customer/Preferences";
import { AccountWishlist } from "./components/customer/AccountWishlist";
import { B2BQuotations } from "./components/customer/B2BQuotations";

// Password Reset Page
import { ResetPasswordPage } from "./components/common/ResetPasswordPage";

// Vendor Views & Architecture
import { VendorEmailVerificationCallback } from "./components/vendor/VendorEmailVerificationCallback";
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
import { VendorProductPreview } from "./components/vendor/VendorProductPreview";
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

// Admin Views & Architecture
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminProtectedRoute } from "./components/admin/AdminProtectedRoute";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminVendorReviewPanel } from "./components/admin/AdminVendorReviewPanel";
import { AdminVendorDetailView } from "./components/admin/AdminVendorDetailView";
import { AdminProfileChangeReviewView } from "./components/admin/AdminProfileChangeReviewView";
import { AdminProductManagementView } from "./components/admin/AdminProductManagementView";
import { AdminProductReviewPanel } from "./components/admin/AdminProductReviewPanel";
import { AdminCategoryListView } from "./components/admin/AdminCategoryListView";
import { AdminCategoryEditView } from "./components/admin/AdminCategoryEditView";
import { AdminInventoryView } from "./components/admin/AdminInventoryView";
import { AdminOrderListView } from "./components/admin/AdminOrderListView";
import { AdminOrderDetailView } from "./components/admin/AdminOrderDetailView";
import { AdminDeliveryConsoleView } from "./components/admin/AdminDeliveryConsoleView";
import { AdminRfqListView } from "./components/admin/AdminRfqListView";
import { AdminRfqDetailView } from "./components/admin/AdminRfqDetailView";
import { AdminQuotationsMasterView } from "./components/admin/AdminQuotationsMasterView";
import { AdminPaymentsView } from "./components/admin/AdminPaymentsView";
import { AdminCommissionsView } from "./components/admin/AdminCommissionsView";
import { AdminSettlementsView } from "./components/admin/AdminSettlementsView";
import { AdminStaffView } from "./components/admin/AdminStaffView";
import { AdminCustomerListView } from "./components/admin/AdminCustomerListView";
import { AdminCustomerDetailView } from "./components/admin/AdminCustomerDetailView";
import { AdminCustomerOrdersView } from "./components/admin/AdminCustomerOrdersView";
import { AdminProductReviewsModerationView } from "./components/admin/AdminProductReviewsModerationView";
import { AdminComplaintsView } from "./components/admin/AdminComplaintsView";
import { AdminAttributeReviewPanel } from "./components/admin/AdminAttributeReviewPanel";
import { AdminAuditLogsView } from "./components/admin/AdminAuditLogsView";

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
          <Route path="/account/complaints" element={<Complaints />} />
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
          <AdminAuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Routes>
                  {/* Public Password Reset Target */}
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />
                  {/* Public Vendor Portal Entry Routes */}
                  <Route path="/sell" element={<VendorLanding />} />
                  <Route path="/vendor" element={<VendorLanding />} />
                  <Route path="/vendor/register" element={<VendorRegister />} />
                  <Route path="/vendor/login" element={<VendorLogin />} />
                  <Route
                    path="/vendor/auth/callback"
                    element={<VendorEmailVerificationCallback />}
                  />
                  <Route
                    path="/vendor/onboarding"
                    element={<VendorOnboarding />}
                  />
                  {/* Protected Vendor Operations Terminal */}
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
                    <Route
                      path="products/new"
                      element={<VendorProductForm />}
                    />
                    <Route
                      path="products/:id"
                      element={<VendorProductForm />}
                    />
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
                    <Route
                      path="verification"
                      element={<VendorVerificationStatus />}
                    />
                    <Route path="guidelines" element={<VendorGuidelines />} />
                    <Route path="benefits" element={<VendorBenefits />} />
                    <Route path="profile" element={<VendorProfile />} />
                  </Route>
                  {/* Protected Admin Console Workspaces with AdminLayout */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route
                      path="vendors"
                      element={<AdminVendorReviewPanel />}
                    />
                    <Route
                      path="vendors/:id"
                      element={<AdminVendorDetailView />}
                    />
                    <Route
                      path="vendor-reviews"
                      element={<AdminVendorReviewPanel />}
                    />
                    <Route
                      path="vendor-profile-changes"
                      element={<AdminProfileChangeReviewView />}
                    />
                    <Route
                      path="products"
                      element={<AdminProductManagementView />}
                    />
                    <Route
                      path="product-reviews"
                      element={<AdminProductReviewPanel />}
                    />
                    <Route
                      path="categories"
                      element={<AdminCategoryListView />}
                    />
                    <Route
                      path="categories/new"
                      element={<AdminCategoryEditView />}
                    />
                    <Route
                      path="categories/:id"
                      element={<AdminCategoryEditView />}
                    />
                    <Route path="inventory" element={<AdminInventoryView />} />
                    <Route path="orders" element={<AdminOrderListView />} />
                    <Route
                      path="orders/:id"
                      element={<AdminOrderDetailView />}
                    />
                    <Route
                      path="delivery"
                      element={<AdminDeliveryConsoleView />}
                    />
                    <Route path="rfqs" element={<AdminRfqListView />} />
                    <Route path="rfqs/:id" element={<AdminRfqDetailView />} />
                    <Route
                      path="quotations"
                      element={<AdminQuotationsMasterView />}
                    />
                    <Route path="payments" element={<AdminPaymentsView />} />
                    <Route
                      path="commissions"
                      element={<AdminCommissionsView />}
                    />
                    <Route
                      path="settlements"
                      element={<AdminSettlementsView />}
                    />
                    <Route path="staff" element={<AdminStaffView />} />
                    <Route
                      path="customers"
                      element={<AdminCustomerListView />}
                    />
                    <Route
                      path="customers/:id"
                      element={<AdminCustomerDetailView />}
                    />
                    <Route
                      path="customer-orders"
                      element={<AdminCustomerOrdersView />}
                    />
                    <Route
                      path="reviews"
                      element={<AdminProductReviewsModerationView />}
                    />
                    <Route
                      path="complaints"
                      element={<AdminComplaintsView />}
                    />
                    <Route
                      path="attributes"
                      element={<AdminAttributeReviewPanel />}
                    />
                    <Route path="audit-logs" element={<AdminAuditLogsView />} />
                  </Route>
                  {/* Customer Storefront App */}
                  <Route path="/*" element={<CustomerAppContent />} />
                </Routes>
              </CartProvider>
            </WishlistProvider>
          </AdminAuthProvider>
        </VendorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
