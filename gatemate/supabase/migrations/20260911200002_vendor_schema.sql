-- =============================================================================
-- GateMate Hyperlocal Construction Marketplace - Vendor Domain Architecture
-- Schema Migration: 20260911200002_vendor_schema.sql
-- =============================================================================

-- Enable pgcrypto / uuid extensions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Helper Function: Admin Role Resolver
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN' 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN',
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 2. Vendor Profiles & Onboarding Applications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  trade_name TEXT,
  business_type TEXT NOT NULL DEFAULT 'Proprietorship',
  contact_person TEXT NOT NULL,
  designation TEXT DEFAULT 'Proprietor / Managing Partner',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gstin TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  yard_address_line1 TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode VARCHAR(6) NOT NULL,
  serviceable_pincodes TEXT[] DEFAULT ARRAY['411001', '411004', '411006', '411014', '411028', '411061'],
  has_heavy_trailer_access BOOLEAN DEFAULT TRUE,
  is_express_30min_enabled BOOLEAN DEFAULT TRUE,
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'DRAFT' 
    CHECK (verification_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_vendor_user_id UNIQUE (user_id),
  CONSTRAINT uq_vendor_gstin UNIQUE (gstin)
);

CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED')),
  current_step INT NOT NULL DEFAULT 1,
  business_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  product_categories TEXT[] DEFAULT '{}',
  verification_documents JSONB NOT NULL DEFAULT '{}'::jsonb,
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  changes_requested_items TEXT[] DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_vendor_application_user_id UNIQUE (user_id)
);

-- -----------------------------------------------------------------------------
-- 3. Helper Function: Vendor ID Resolver
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_vendor_id_for_auth_user()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 4. Product Categories & Dynamic Attribute Library
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  descriptor TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.category_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL REFERENCES public.product_categories(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'select')),
  allowed_values TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT FALSE,
  placeholder TEXT,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_category_attr_name UNIQUE (category_slug, name)
);

CREATE TABLE IF NOT EXISTS public.product_attribute_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL REFERENCES public.product_categories(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'select')),
  allowed_values TEXT[] DEFAULT '{}',
  is_required BOOLEAN DEFAULT FALSE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. Vendor Products & Media Strategy
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.product_categories(slug) ON DELETE RESTRICT,
  unit TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  original_price NUMERIC(12, 2) CHECK (original_price IS NULL OR original_price >= price),
  moq INT NOT NULL DEFAULT 1 CHECK (moq >= 1),
  is_express_30min_available BOOLEAN DEFAULT FALSE,
  description TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  dynamic_attributes JSONB DEFAULT '[]'::jsonb,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Authoritative Inventory Management & Audit Trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_inventory (
  product_id UUID PRIMARY KEY REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  on_hand_stock INT NOT NULL DEFAULT 0 CHECK (on_hand_stock >= 0),
  reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_reserved_not_exceed_on_hand CHECK (reserved_stock <= on_hand_stock)
);

CREATE TABLE IF NOT EXISTS public.vendor_inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('RESTOCK', 'CORRECTION', 'DAMAGE', 'ORDER_RESERVED', 'ORDER_FULFILLED', 'ORDER_RELEASED')),
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  change_quantity INT NOT NULL,
  reason TEXT NOT NULL,
  batch_number TEXT,
  adjusted_by TEXT NOT NULL DEFAULT 'Operations',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. Vendor Normal Orders & Dispatch Timeline
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id TEXT PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_ref TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'NORMAL_ORDER' CHECK (order_type IN ('NORMAL_ORDER', 'WHOLESALE_B2B_ORDER')),
  is_express_30min BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED', 'CANCELLED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
  payment_method TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  item_subtotal NUMERIC(12, 2) NOT NULL CHECK (item_subtotal >= 0),
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  packaging_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
  estimated_dispatch_minutes INT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.vendor_products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  sku TEXT,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  label TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. 5% Commission Ledger & Direct Bank Settlements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.vendor_orders(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE RESTRICT,
  product_subtotal NUMERIC(12, 2) NOT NULL CHECK (product_subtotal >= 0),
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0500,
  commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
  vendor_payable_amount NUMERIC(12, 2) NOT NULL CHECK (vendor_payable_amount >= 0),
  delivery_fee NUMERIC(12, 2) DEFAULT 0,
  packaging_fee NUMERIC(12, 2) DEFAULT 0,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  settlement_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'PROCESSED', 'HOLD')),
  settlement_batch_id TEXT,
  utr_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_settlements (
  id TEXT PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE RESTRICT,
  gross_product_subtotal NUMERIC(12, 2) NOT NULL,
  total_commission_deducted NUMERIC(12, 2) NOT NULL,
  net_disbursed_amount NUMERIC(12, 2) NOT NULL,
  order_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'HOLD')),
  bank_details JSONB NOT NULL,
  utr_number TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. Commercial Project RFQs & Quotations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_rfqs (
  id TEXT PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_gstin TEXT,
  project_name TEXT NOT NULL,
  site_address JSONB NOT NULL,
  requested_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  buyer_project_notes TEXT,
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'RESPONDED', 'QUOTATION_SENT', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED_TO_ORDER', 'COMPLETED')),
  expiry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_quotations (
  id TEXT PRIMARY KEY,
  rfq_id TEXT NOT NULL REFERENCES public.vendor_rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_gstin TEXT,
  project_name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_product_subtotal NUMERIC(12, 2) NOT NULL CHECK (total_product_subtotal >= 0),
  delivery_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unloading_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  taxes JSONB NOT NULL DEFAULT '{"gstRate": 18, "gstAmount": 0}'::jsonb,
  grand_total NUMERIC(12, 2) NOT NULL CHECK (grand_total >= 0),
  moq_conditions TEXT,
  estimated_delivery_schedule TEXT NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'CONVERTED_TO_ORDER')),
  converted_order_id TEXT REFERENCES public.vendor_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. Vendor Notifications Hub
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('ALL', 'VERIFICATION', 'PRODUCT_MODERATION', 'ORDERS', 'RFQS_QUOTATIONS', 'SETTLEMENTS', 'PLATFORM_NOTICES')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_inventory_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles & Applications
CREATE POLICY "Vendors can view and edit own profile"
  ON public.vendor_profiles FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Vendors can manage own application"
  ON public.vendor_applications FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- 2. Categories & Attributes
CREATE POLICY "Anyone can view active categories and attributes"
  ON public.product_categories FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can view category attributes"
  ON public.category_attributes FOR SELECT USING (TRUE);

CREATE POLICY "Vendors can manage own attribute suggestions"
  ON public.product_attribute_suggestions FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- 3. Products
CREATE POLICY "Public can view published products only"
  ON public.vendor_products FOR SELECT
  USING (status = 'PUBLISHED' OR vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

CREATE POLICY "Vendors can insert and update own products"
  ON public.vendor_products FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- 4. Inventory
CREATE POLICY "Vendors can view and update own inventory"
  ON public.vendor_inventory FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

CREATE POLICY "Vendors can view own inventory audit log"
  ON public.vendor_inventory_audit_log FOR SELECT
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

CREATE POLICY "Vendors can insert inventory audit records"
  ON public.vendor_inventory_audit_log FOR INSERT
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- 5. Orders & Timelines
CREATE POLICY "Vendors can view and update own orders"
  ON public.vendor_orders FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

CREATE POLICY "Vendors can view own order items"
  ON public.vendor_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_orders vo
      WHERE vo.id = order_id AND (vo.vendor_id = public.get_vendor_id_for_auth_user() OR vo.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Vendors can view and append order timeline"
  ON public.vendor_order_timeline FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_orders vo
      WHERE vo.id = order_id AND (vo.vendor_id = public.get_vendor_id_for_auth_user() OR vo.customer_id = auth.uid() OR public.is_admin())
    )
  );

-- 6. Transactions & Settlements
CREATE POLICY "Vendors can view own transaction ledger"
  ON public.vendor_transactions FOR SELECT
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

CREATE POLICY "Vendors can view own bank settlements"
  ON public.vendor_settlements FOR SELECT
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- 7. RFQs & Quotations
CREATE POLICY "Vendors and buyers can access own RFQs"
  ON public.vendor_rfqs FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR buyer_id = auth.uid() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR buyer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Vendors can view and manage own quotations"
  ON public.vendor_quotations FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- 8. Notifications
CREATE POLICY "Vendors can access own notifications"
  ON public.vendor_notifications FOR ALL
  USING (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin())
  WITH CHECK (vendor_id = public.get_vendor_id_for_auth_user() OR public.is_admin());

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON public.vendor_products(status);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor_id ON public.vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_status ON public.vendor_orders(status);
CREATE INDEX IF NOT EXISTS idx_vendor_rfqs_vendor_id ON public.vendor_rfqs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotations_rfq_id ON public.vendor_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_unread ON public.vendor_notifications(vendor_id, is_read);