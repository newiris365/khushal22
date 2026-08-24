-- Migration: Supabase Storage Bucket Policies for IRIS 365
-- Enforces allowed mime types and maximum object size (10 MB) at the storage layer

-- Create buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kyc', 'kyc', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('resumes', 'resumes', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('evidence', 'evidence', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('docs', 'docs', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies on storage.objects for authenticated uploads
DROP POLICY IF EXISTS "Authenticated users can upload objects to kyc bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload objects to kyc bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can upload objects to resumes bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload objects to resumes bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
  );

DROP POLICY IF EXISTS "Public read access for storage buckets" ON storage.objects;
CREATE POLICY "Public read access for storage buckets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('kyc', 'resumes', 'evidence', 'docs'));
