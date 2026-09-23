-- Add CTA fields to settings table for consolidated hero content management

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS cta_text TEXT NOT NULL DEFAULT 'Shop the Collection';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS cta_link TEXT NOT NULL DEFAULT '/products';
