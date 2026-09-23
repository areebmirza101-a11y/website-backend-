-- Add parent_id to categories for hierarchical subcategories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL;

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);