ALTER TABLE settings
ADD COLUMN social_links JSONB DEFAULT '[]'::jsonb;
