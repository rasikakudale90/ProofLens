-- ==============================================================================
-- ProofLens AI — Supabase Database & Storage Setup Script
-- Run this in your Supabase Project's SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Enable pgvector extension for high-dimensional semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Enable uuid generation extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create persistent storage bucket for PDF documents
-- Note: You can also create this via Dashboard -> Storage -> New Bucket ("prooflens-documents")
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prooflens-documents',
    'prooflens-documents',
    false,
    15728640, -- 15 MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Set RLS policy allowing service_role full access to the bucket
-- (The backend uses the Supabase service_role key to upload/download/delete files)
CREATE POLICY "Service role full access on prooflens-documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'prooflens-documents')
WITH CHECK (bucket_id = 'prooflens-documents');

-- 5. Verification Check:
-- Verify that pgvector is installed and active
SELECT name, default_version, installed_version, comment 
FROM pg_available_extensions 
WHERE name = 'vector';
