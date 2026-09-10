-- =============================================================================
-- GateMate Supabase Storage Security Policies
-- =============================================================================

-- 1. Private Vendor Verification Documents Bucket (GST, PAN, Cheque)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-verification-docs', 'vendor-verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policy: Vendors can only upload and read files within their own folder
CREATE POLICY "Vendors can upload own private verification docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vendor-verification-docs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Vendors and Admins can view private verification docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vendor-verification-docs'
  AND ((storage.foldername(name))[2] = auth.uid()::text OR public.is_admin())
);

-- 2. Public Product Photographs Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Anyone can read product photos; only authenticated vendors can upload
CREATE POLICY "Public read for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Vendors can upload product photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');