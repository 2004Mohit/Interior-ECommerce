import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Header } from "./components/Header";
import { CustomerShop } from "./components/CustomerShop";
import { CheckoutDrawer } from "./components/CheckoutDrawer";
import { AuthModal } from "./components/AuthModal";

export default function App() {
  const [activeView, setActiveView] = useState("shop"); // 'shop' | 'seller' | 'admin'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        {/* Background container using user attached wallpaper */}
        <div className="min-h-screen bg-city-pattern bg-cover bg-center bg-fixed text-slate-100 flex flex-col relative">
          <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[2px] z-0 pointer-events-none" />

          {/* Foreground App Layers */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header
              activeView={activeView}
              setActiveView={setActiveView}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenCart={() => setIsCartOpen(true)}
            />

            <main className="flex-1">
              {activeView === "shop" && <CustomerShop />}
              {activeView === "seller" && (
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                  <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-2">
                      GateMate Seller Hub
                    </h2>
                    <p className="text-blue-200 text-sm">
                      Ready for Step 2: Listing workflows & seller metrics.
                    </p>
                  </div>
                </div>
              )}
              {activeView === "admin" && (
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                  <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold mb-2">
                      GateMate Admin Portal
                    </h2>
                    <p className="text-blue-200 text-sm">
                      Ready for Step 3: Platform oversight, category attributes
                      & RLS control.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* Overlays & Modals */}
          <CheckoutDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onRequireAuth={() => setIsAuthOpen(true)}
          />

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={() => setIsCartOpen(true)}
          />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
