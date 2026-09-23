-- Add bg_image column to categories for category background images
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS bg_image TEXT;