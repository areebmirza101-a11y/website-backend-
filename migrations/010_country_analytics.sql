-- Country columns for country/region analytics on the admin dashboard.
-- Traffic (page_views) and inquiries (contact_messages) are geo-resolved from
-- the visitor IP at insert time via geoip-lite; orders already carry
-- shipping_country. Stored as ISO 3166-1 alpha-2 codes (e.g. 'US', 'PK').

ALTER TABLE public.page_views      ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_country      ON public.page_views(country);
CREATE INDEX IF NOT EXISTS idx_contact_messages_country ON public.contact_messages(country);
