-- =============================================================================
-- GateMate Admin Domain Architecture & Security Policies
-- File: supabase/migrations/20260911200003_admin_schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'VENDOR_VERIFIED',
    'VENDOR_REJECTED',
    'VENDOR_CHANGES_REQUESTED',
    'PRODUCT_APPROVED',
    'PRODUCT_REJECTED',
    'PRODUCT_CHANGES_REQUESTED',
    'ATTRIBUTE_MERGED_GLOBALLY',
    'ATTRIBUTE_REJECTED',
    'COMMISSION_OVERRIDE',
    'ORDER_INTERVENTION'
  )),
  target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('VENDOR', 'PRODUCT', 'ATTRIBUTE', 'ORDER', 'SETTLEMENT')),
  target_entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT NOT NULL,
  reviewer_notes TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Admin Audit Logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view or insert audit logs
CREATE POLICY "Admins have full access to audit logs"
  ON public.admin_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Dynamic Category Attribute Global Approval by Admin
CREATE POLICY "Admins can manage shared category attributes"
  ON public.category_attributes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can review attribute suggestions"
  ON public.product_attribute_suggestions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Global Admin Oversight Across All Domain Entities
CREATE POLICY "Admins can review all vendor profiles"
  ON public.vendor_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can review all vendor applications"
  ON public.vendor_applications
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can moderate all products"
  ON public.vendor_products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all inventory and stock logs"
  ON public.vendor_inventory
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can view all inventory audit history"
  ON public.vendor_inventory_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can oversee all vendor orders"
  ON public.vendor_orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can oversee all vendor order items"
  ON public.vendor_order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all 5 percent commission ledgers"
  ON public.vendor_transactions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage bank settlement batches"
  ON public.vendor_settlements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can oversee all commercial RFQs"
  ON public.vendor_rfqs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can oversee all quotations"
  ON public.vendor_quotations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_entity_type, target_entity_id);