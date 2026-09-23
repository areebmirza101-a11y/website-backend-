-- Add SKU column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Add is_main and price columns to product_images
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

-- Migrate existing primary images to is_main
UPDATE public.product_images SET is_main = true WHERE is_primary = true;

-- Index for main images
CREATE INDEX IF NOT EXISTS idx_product_images_is_main ON public.product_images(product_id, is_main);