-- Promotions table for Sales feature
CREATE TABLE IF NOT EXISTS public.promotions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'products', 'categories'
  target_ids BIGINT[] DEFAULT '{}', -- Array of product or category IDs
  banner_title TEXT,
  banner_subtitle TEXT,
  banner_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying active promotions
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active);
