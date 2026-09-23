-- Website settings table for managing all site-wide settings
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT '',
  app_logo TEXT,
  tagline TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  business_hours TEXT NOT NULL DEFAULT '',
  map_embed TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  youtube TEXT NOT NULL DEFAULT '',
  brochure_url TEXT NOT NULL DEFAULT '',
  hero_bg TEXT,
  hero_title TEXT NOT NULL DEFAULT '',
  hero_highlighted_text TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  new_password TEXT,
  current_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO public.settings (company_name, tagline, intro, phone, whatsapp, email, address, business_hours)
SELECT 'VESTRA Global Apparel', 'Exporting quality worldwide', 'Responsibly sourced, precisely cut apparel built to last.', '+92 300 0000000', '+92 300 0000000', 'info@vestra.com', 'Karachi, Pakistan', 'Mon-Sat 9AM-6PM PKT'
WHERE NOT EXISTS (SELECT 1 FROM public.settings);