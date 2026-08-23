-- Migration: Add access_key_hash to companies table
ALTER TABLE IF EXISTS public.companies 
ADD COLUMN IF NOT EXISTS access_key_hash text;
