-- Add show_on_home column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;

-- Index for querying home categories efficiently
CREATE INDEX IF NOT EXISTS idx_categories_show_on_home ON public.categories(show_on_home);
