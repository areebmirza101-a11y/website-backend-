-- Migration: Create size_guides table

CREATE TABLE IF NOT EXISTS size_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Ensure uuid-ossp extension is enabled if not already (it is usually enabled in supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add an index for fetching active size guides ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_size_guides_active_sort ON size_guides(active, sort_order);
