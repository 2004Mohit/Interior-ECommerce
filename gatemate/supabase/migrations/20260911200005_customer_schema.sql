-- =============================================================================
-- GateMate Customer Domain Schema & Row Level Security (RLS) Policies
-- File: supabase/migrations/20260911200005_customer_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Customer Profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone VARCHAR(10) CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$'),
  email TEXT NOT NULL,
  default_pincode VARCHAR(6) CHECK (default_pincode IS NULL OR default_pincode ~ '^[0-9]{6}$'),
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Customer Site Delivery Addresses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone VARCHAR(10) NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  address_line1 TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode VARCHAR(6) NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  landmark TEXT,
  address_type TEXT NOT NULL DEFAULT 'SITE' CHECK (address_type IN ('SITE', 'OFFICE', 'HOME')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Customer Wishlist
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_customer_wishlist_item UNIQUE (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 4. Customer Active Shopping Cart
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_customer_cart_item UNIQUE (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 5. Customer Product Reviews & Ratings (Product Reviews Only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_location TEXT DEFAULT 'Pune',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  headline TEXT,
  comment TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT TRUE,
  moderation_status TEXT NOT NULL DEFAULT 'PUBLISHED' 
    CHECK (moderation_status IN ('PUBLISHED', 'PENDING_REVIEW', 'FLAGGED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_customer_product_review UNIQUE (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 6. Customer Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_id TEXT REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage own profile"
  ON public.customer_profiles FOR ALL
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can manage own delivery addresses"
  ON public.customer_addresses FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can manage own wishlist"
  ON public.customer_wishlists FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can manage own cart"
  ON public.customer_carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view published product reviews"
  ON public.product_reviews FOR SELECT
  USING (moderation_status = 'PUBLISHED');

CREATE POLICY "Customers can create and edit own product reviews"
  ON public.product_reviews FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can manage own notifications"
  ON public.customer_notifications FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_user ON public.customer_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_cart_user ON public.customer_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifs_unread ON public.customer_notifications(user_id, is_read);