-- Hero content table for managing homepage hero section
CREATE TABLE IF NOT EXISTS public.hero_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  cta_text TEXT NOT NULL DEFAULT 'Shop Now',
  cta_link TEXT NOT NULL DEFAULT '/products',
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default hero content if not exists
INSERT INTO public.hero_content (title, subtitle, cta_text, cta_link, image_url)
SELECT 'Wear the standard you''re proud of.', 'Responsibly sourced, precisely cut apparel built to last.', 'Shop the Collection', '/products', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2000&h=1000&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.hero_content);