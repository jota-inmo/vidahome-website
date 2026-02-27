-- Add description_pl to properties backup table
-- Run in Supabase SQL Editor

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS description_pl TEXT DEFAULT NULL;
