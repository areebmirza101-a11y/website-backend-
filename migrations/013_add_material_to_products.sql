-- Add material column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
